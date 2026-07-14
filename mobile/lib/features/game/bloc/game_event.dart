import 'package:equatable/equatable.dart';
import '../models/match_model.dart';

abstract class GameEvent extends Equatable {
  const GameEvent();

  @override
  List<Object?> get props => [];
}

class GameJoinQueue extends GameEvent {
  final String tierName;
  final String userId;
  final String playerName;
  final String gameType;

  const GameJoinQueue({
    required this.tierName,
    required this.userId,
    required this.playerName,
    required this.gameType,
  });

  @override
  List<Object?> get props => [tierName, userId, playerName, gameType];
}

class GameLeaveQueue extends GameEvent {
  final String userId;

  const GameLeaveQueue({required this.userId});

  @override
  List<Object?> get props => [userId];
}

class GameMatchCreated extends GameEvent {
  final MatchModel match;

  const GameMatchCreated(this.match);

  @override
  List<Object?> get props => [match];
}

class GameWaitingInQueue extends GameEvent {}

class GameMatchmakingError extends GameEvent {
  final String error;

  const GameMatchmakingError(this.error);

  @override
  List<Object?> get props => [error];
}

class GamePlayerSelected extends GameEvent {
  final String userId;
  final int selectedIndex;
  final int roundNo;

  const GamePlayerSelected({
    required this.userId,
    required this.selectedIndex,
    required this.roundNo,
  });

  @override
  List<Object?> get props => [userId, selectedIndex, roundNo];
}

class GameRoundCompleted extends GameEvent {
  final int roundNo;
  final String winnerId;
  final String winnerName;
  final List<dynamic> submissions;
  final int correctIndex;

  const GameRoundCompleted({
    required this.roundNo,
    required this.winnerId,
    required this.winnerName,
    required this.submissions,
    required this.correctIndex,
  });

  @override
  List<Object?> get props => [roundNo, winnerId, winnerName, submissions, correctIndex];
}

class GameSubmitScore extends GameEvent {
  final int selectedIndex;
  final int timeLeft;

  const GameSubmitScore({
    required this.selectedIndex,
    required this.timeLeft,
  });

  @override
  List<Object?> get props => [selectedIndex, timeLeft];
}

class GameReset extends GameEvent {}
