import 'package:equatable/equatable.dart';
import '../models/match_model.dart';

class GameRoundDetail extends Equatable {
  final int roundNo;
  final String winner;
  final String score;
  final int playerScore;
  final int opponentScore;
  final int correctIndex;
  final int? playerSelection;
  final int? opponentSelection;
  final bool? playerCorrect;
  final bool? opponentCorrect;

  const GameRoundDetail({
    required this.roundNo,
    required this.winner,
    required this.score,
    required this.playerScore,
    required this.opponentScore,
    required this.correctIndex,
    this.playerSelection,
    this.opponentSelection,
    this.playerCorrect,
    this.opponentCorrect,
  });

  @override
  List<Object?> get props => [
        roundNo,
        winner,
        score,
        playerScore,
        opponentScore,
        correctIndex,
        playerSelection,
        opponentSelection,
        playerCorrect,
        opponentCorrect,
      ];
}

class MatchResultDetail extends Equatable {
  final String winner;
  final bool isWinner;
  final bool isTie;
  final List<GameRoundDetail> rounds;
  final double prize;
  final double entryFee;
  final String tierName;

  const MatchResultDetail({
    required this.winner,
    required this.isWinner,
    required this.isTie,
    required this.rounds,
    required this.prize,
    required this.entryFee,
    required this.tierName,
  });

  @override
  List<Object?> get props => [winner, isWinner, isTie, rounds, prize, entryFee, tierName];
}

class GameState extends Equatable {
  final String? queueStatus; // null, 'searching', 'matched', 'starting', 'error'
  final String? matchmakingError;
  final MatchModel? currentMatch;
  final int currentRound;
  final List<GameRoundDetail> rounds;
  final Map<String, int> roundSelections; // maps userId -> selectedIndex
  final bool roundWaiting;
  final MatchResultDetail? matchResult;

  const GameState({
    this.queueStatus,
    this.matchmakingError,
    this.currentMatch,
    this.currentRound = 0,
    this.rounds = const [],
    this.roundSelections = const {},
    this.roundWaiting = false,
    this.matchResult,
  });

  GameState copyWith({
    String? Function()? queueStatus,
    String? Function()? matchmakingError,
    MatchModel? Function()? currentMatch,
    int? currentRound,
    List<GameRoundDetail>? rounds,
    Map<String, int>? roundSelections,
    bool? roundWaiting,
    MatchResultDetail? Function()? matchResult,
  }) {
    return GameState(
      queueStatus: queueStatus != null ? queueStatus() : this.queueStatus,
      matchmakingError: matchmakingError != null ? matchmakingError() : this.matchmakingError,
      currentMatch: currentMatch != null ? currentMatch() : this.currentMatch,
      currentRound: currentRound ?? this.currentRound,
      rounds: rounds ?? this.rounds,
      roundSelections: roundSelections ?? this.roundSelections,
      roundWaiting: roundWaiting ?? this.roundWaiting,
      matchResult: matchResult != null ? matchResult() : this.matchResult,
    );
  }

  @override
  List<Object?> get props => [
        queueStatus,
        matchmakingError,
        currentMatch,
        currentRound,
        rounds,
        roundSelections,
        roundWaiting,
        matchResult,
      ];
}
