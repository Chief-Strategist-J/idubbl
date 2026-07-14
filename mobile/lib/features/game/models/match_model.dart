import 'package:equatable/equatable.dart';

class MatchQuestion extends Equatable {
  final String? question;
  final String? expression; // For math duels
  final List<String> options;
  final String category;
  final String difficulty;

  const MatchQuestion({
    this.question,
    this.expression,
    required this.options,
    required this.category,
    required this.difficulty,
  });

  factory MatchQuestion.fromJson(Map<String, dynamic> json) {
    return MatchQuestion(
      question: json['question'],
      expression: json['expression'],
      options: List<String>.from(json['options'] ?? []),
      category: json['category'] ?? '',
      difficulty: json['difficulty'] ?? '',
    );
  }

  @override
  List<Object?> get props => [question, expression, options, category, difficulty];
}

class MatchModel extends Equatable {
  final String matchId;
  final String gameType;
  final String tier;
  final List<MatchQuestion> questions;
  final List<String> players;
  final Map<String, String> playerNames;
  final double prize;
  final String status;
  final String? winner;

  const MatchModel({
    required this.matchId,
    required this.gameType,
    required this.tier,
    required this.questions,
    required this.players,
    required this.playerNames,
    required this.prize,
    required this.status,
    this.winner,
  });

  factory MatchModel.fromJson(Map<String, dynamic> json) {
    final questionsList = (json['questions'] as List? ?? [])
        .map((q) => MatchQuestion.fromJson(q))
        .toList();
    
    final Map<String, String> names = {};
    if (json['playerNames'] != null) {
      json['playerNames'].forEach((key, val) {
        names[key] = val.toString();
      });
    }

    return MatchModel(
      matchId: json['matchId'] ?? json['id'] ?? '',
      gameType: json['gameType'] ?? 'word_duel',
      tier: json['tier'] ?? 'rookie',
      questions: questionsList,
      players: List<String>.from(json['players'] ?? []),
      playerNames: names,
      prize: (json['prize'] ?? 0).toDouble(),
      status: json['status'] ?? 'in_progress',
      winner: json['winner'],
    );
  }

  @override
  List<Object?> get props => [
        matchId,
        gameType,
        tier,
        questions,
        players,
        playerNames,
        prize,
        status,
        winner,
      ];
}
