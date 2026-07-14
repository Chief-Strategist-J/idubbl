import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/socket_client.dart';
import '../models/match_model.dart';
import 'game_event.dart';
import 'game_state.dart';

class GameBloc extends Bloc<GameEvent, GameState> {
  final SocketClient socketClient;
  StreamSubscription? _socketSubscription;

  GameBloc({required this.socketClient}) : super(const GameState()) {
    on<GameJoinQueue>(_onJoinQueue);
    on<GameLeaveQueue>(_onLeaveQueue);
    on<GameMatchCreated>(_onMatchCreated);
    on<GameWaitingInQueue>(_onWaitingInQueue);
    on<GameMatchmakingError>(_onMatchmakingError);
    on<GamePlayerSelected>(_onPlayerSelected);
    on<GameRoundCompleted>(_onRoundCompleted);
    on<GameSubmitScore>(_onSubmitScore);
    on<GameReset>(_onReset);
  }

  void _onJoinQueue(GameJoinQueue event, Emitter<GameState> emit) {
    emit(GameState(
      queueStatus: 'searching',
      roundSelections: const {},
    ));

    socketClient.connect(event.userId);
    final socket = socketClient.socket;

    // Remove old listeners to avoid duplicates
    socket.off('match_created');
    socket.off('waiting_in_queue');
    socket.off('matchmaking_error');
    socket.off('player_selected');
    socket.off('round_completed');

    socket.on('connect_error', (err) {
      add(GameMatchmakingError('Server connection failed: $err'));
    });

    socket.on('match_created', (data) {
      final match = MatchModel.fromJson(data);
      add(GameMatchCreated(match));
    });

    socket.on('waiting_in_queue', (_) {
      add(GameWaitingInQueue());
    });

    socket.on('matchmaking_error', (data) {
      final error = data != null ? (data['error'] ?? 'Unknown error') : 'Unknown error';
      add(GameMatchmakingError(error.toString()));
    });

    socket.on('player_selected', (data) {
      if (data != null) {
        add(GamePlayerSelected(
          userId: data['userId']?.toString() ?? '',
          selectedIndex: data['selectedIndex'] is int ? data['selectedIndex'] : int.parse(data['selectedIndex'].toString()),
          roundNo: data['roundNo'] is int ? data['roundNo'] : int.parse(data['roundNo'].toString()),
        ));
      }
    });

    socket.on('round_completed', (data) {
      if (data != null) {
        add(GameRoundCompleted(
          roundNo: data['roundNo'] is int ? data['roundNo'] : int.parse(data['roundNo'].toString()),
          winnerId: data['winnerId']?.toString() ?? '',
          winnerName: data['winnerName']?.toString() ?? '',
          submissions: data['submissions'] as List? ?? [],
          correctIndex: data['correctIndex'] is int ? data['correctIndex'] : int.parse(data['correctIndex'].toString()),
        ));
      }
    });

    final emitFindMatch = () {
      socket.emit('find_match', {
        'userId': event.userId,
        'tier': event.tierName,
        'name': event.playerName,
        'gameType': event.gameType,
      });
    };

    if (socket.connected) {
      emitFindMatch();
    } else {
      socket.once('connect', (_) => emitFindMatch());
    }
  }

  void _onLeaveQueue(GameLeaveQueue event, Emitter<GameState> emit) {
    socketClient.socket.emit('cancel_matchmaking', {'userId': event.userId});
    socketClient.disconnect();
    emit(const GameState());
  }

  Future<void> _onMatchCreated(GameMatchCreated event, Emitter<GameState> emit) async {
    emit(state.copyWith(
      queueStatus: () => 'matched',
      matchmakingError: () => null,
    ));

    // Pause for presentation
    await Future.delayed(const Duration(seconds: 2));

    emit(state.copyWith(
      queueStatus: () => 'starting',
      currentMatch: () => event.match,
      currentRound: 1,
    ));

    socketClient.socket.emit('join_match_room', {
      'matchId': event.match.matchId,
    });
  }

  void _onWaitingInQueue(GameWaitingInQueue event, Emitter<GameState> emit) {
    emit(state.copyWith(queueStatus: () => 'searching'));
  }

  void _onMatchmakingError(GameMatchmakingError event, Emitter<GameState> emit) {
    emit(state.copyWith(
      queueStatus: () => 'error',
      matchmakingError: () => event.error,
    ));
  }

  void _onPlayerSelected(GamePlayerSelected event, Emitter<GameState> emit) {
    if (event.roundNo == state.currentRound) {
      final updatedSelections = Map<String, int>.from(state.roundSelections);
      updatedSelections[event.userId.toLowerCase()] = event.selectedIndex;
      emit(state.copyWith(roundSelections: updatedSelections));
    }
  }

  void _onRoundCompleted(GameRoundCompleted event, Emitter<GameState> emit) {
    final myId = socketClient.socket.query != null 
        ? socketClient.socket.query.toString().split('userId=').last.split('&').first.toLowerCase()
        : '';
    
    final List<dynamic> subs = event.submissions;
    final mySub = subs.firstWhere((s) => s['userId']?.toString().toLowerCase() == myId, orElse: () => null);
    final oppSub = subs.firstWhere((s) => s['userId']?.toString().toLowerCase() != myId, orElse: () => null);

    final isTiedRound = event.winnerId == 'tie' || event.winnerId == 'draw';
    final roundWinnerName = isTiedRound 
        ? 'tie' 
        : (event.winnerId.toLowerCase() == myId ? 'You' : event.winnerName);

    final roundDetail = GameRoundDetail(
      roundNo: event.roundNo,
      winner: roundWinnerName,
      score: '${mySub != null ? mySub['score'] : 0}-${oppSub != null ? oppSub['score'] : 0}',
      playerScore: mySub != null ? (mySub['score'] is int ? mySub['score'] : int.parse(mySub['score'].toString())) : 0,
      opponentScore: oppSub != null ? (oppSub['score'] is int ? oppSub['score'] : int.parse(oppSub['score'].toString())) : 0,
      correctIndex: event.correctIndex,
      playerSelection: mySub != null ? (mySub['selectedIndex'] != null ? (mySub['selectedIndex'] is int ? mySub['selectedIndex'] : int.parse(mySub['selectedIndex'].toString())) : null) : null,
      opponentSelection: oppSub != null ? (oppSub['selectedIndex'] != null ? (oppSub['selectedIndex'] is int ? oppSub['selectedIndex'] : int.parse(oppSub['selectedIndex'].toString())) : null) : null,
      playerCorrect: mySub != null ? mySub['isCorrect'] == true : false,
      opponentCorrect: oppSub != null ? oppSub['isCorrect'] == true : false,
    );

    final updatedRounds = List<GameRoundDetail>.from(state.rounds)..add(roundDetail);

    final playerWins = updatedRounds.where((r) => r.winner == 'You').length;
    final opponentWins = updatedRounds.where((r) => r.winner != 'You' && r.winner != 'tie').length;

    if (playerWins == 2 || opponentWins == 2 || updatedRounds.length == 3) {
      final isWinner = playerWins > opponentWins;
      final isTie = !isWinner && playerWins == opponentWins;
      final matchWinnerName = isTie ? 'tie' : (isWinner ? 'You' : event.winnerName);

      final double tierEntryFee = state.currentMatch?.tier.toLowerCase() == 'micro' ? 2 :
                            state.currentMatch?.tier.toLowerCase() == 'rookie' ? 5 :
                            state.currentMatch?.tier.toLowerCase() == 'pro' ? 20 :
                            state.currentMatch?.tier.toLowerCase() == 'elite' ? 50 : 5;

      final matchResult = MatchResultDetail(
        winner: matchWinnerName,
        isWinner: isWinner,
        isTie: isTie,
        rounds: updatedRounds,
        prize: isWinner ? (state.currentMatch?.prize ?? 0) : 0,
        entryFee: tierEntryFee,
        tierName: state.currentMatch?.tier ?? '',
      );

      emit(state.copyWith(
        rounds: updatedRounds,
        matchResult: () => matchResult,
        roundSelections: const {},
        roundWaiting: false,
      ));
    } else {
      emit(state.copyWith(
        rounds: updatedRounds,
        currentRound: event.roundNo + 1,
        roundWaiting: false,
        roundSelections: const {},
      ));
    }
  }

  void _onSubmitScore(GameSubmitScore event, Emitter<GameState> emit) {
    emit(state.copyWith(roundWaiting: true));
    final myId = socketClient.socket.query != null 
        ? socketClient.socket.query.toString().split('userId=').last.split('&').first
        : '';
    final myName = state.currentMatch?.playerNames[myId] ?? 'You';

    socketClient.socket.emit('submit_score', {
      'matchId': state.currentMatch?.matchId,
      'roundNo': state.currentRound,
      'userId': myId,
      'selectedIndex': event.selectedIndex,
      'timeLeft': event.timeLeft,
      'name': myName,
    });
  }

  void _onReset(GameReset event, Emitter<GameState> emit) {
    socketClient.disconnect();
    emit(const GameState());
  }

  @override
  Future<void> close() {
    _socketSubscription?.cancel();
    socketClient.disconnect();
    return super.close();
  }
}
