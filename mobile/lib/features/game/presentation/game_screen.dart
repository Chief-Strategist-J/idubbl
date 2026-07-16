import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_state.dart';
import '../bloc/game_bloc.dart';
import '../bloc/game_event.dart';
import '../bloc/game_state.dart';
import '../models/match_model.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  int _searchTime = 0;
  Timer? _searchTimer;
  Timer? _roundTimer;
  int _timeLeft = 10;
  int _lastRoundTracked = 0;

  @override
  void initState() {
    super.initState();
    _startSearchTimer();
  }

  @override
  void dispose() {
    _searchTimer?.cancel();
    _roundTimer?.cancel();
    super.dispose();
  }

  void _startSearchTimer() {
    _searchTimer?.cancel();
    _searchTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _searchTime++;
        });
      }
    });
  }

  void _startRoundTimer(BuildContext context, int roundNo) {
    _roundTimer?.cancel();
    setState(() {
      _timeLeft = 10;
      _lastRoundTracked = roundNo;
    });

    _roundTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_timeLeft > 0) {
        setState(() {
          _timeLeft--;
        });
      } else {
        _roundTimer?.cancel();
        // Time ran out, auto submit incorrect selection
        final gameBloc = context.read<GameBloc>();
        if (!gameBloc.state.roundWaiting && gameBloc.state.matchResult == null) {
          gameBloc.add(GameSubmitScore(selectedIndex: -1, timeLeft: 0));
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return WillPopScope(
      onWillPop: () async {
        _handleExit(context);
        return false;
      },
      child: Scaffold(
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          title: const Text('iDubbl Arena', style: TextStyle(fontWeight: FontWeight.bold)),
          centerTitle: true,
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => _handleExit(context),
          ),
          flexibleSpace: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(color: Colors.black.withOpacity(0.15)),
            ),
          ),
        ),
        body: BlocConsumer<GameBloc, GameState>(
          listener: (context, state) {
            if (state.queueStatus == 'starting' && state.currentMatch != null && state.matchResult == null) {
              if (state.currentRound != _lastRoundTracked) {
                _startRoundTimer(context, state.currentRound);
              }
            } else if (state.matchResult != null) {
              _roundTimer?.cancel();
            }
          },
          builder: (context, state) {
            final status = state.queueStatus;

            if (status == 'searching') {
              return _buildSearching(theme, context);
            } else if (status == 'matched') {
              return _buildMatched(theme, state.currentMatch);
            } else if (status == 'starting' && state.currentMatch != null) {
              if (state.matchResult != null) {
                return _buildScoreboard(theme, context, state.matchResult!);
              }
              return _buildGameplay(theme, context, state);
            } else if (status == 'error') {
              return _buildError(theme, context, state.matchmakingError ?? 'Matchmaking failed');
            }

            return const Center(child: Text('Initializing match...'));
          },
        ),
      ),
    );
  }

  void _handleExit(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      context.read<GameBloc>().add(GameLeaveQueue(userId: authState.user.id));
    }
    Navigator.pop(context);
  }

  Widget _buildSearching(ThemeData theme, BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(),
            SizedBox(
              height: 120,
              width: 120,
              child: CircularProgressIndicator(
                strokeWidth: 8,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 48),
            Text(
              'Searching for Opponent...',
              style: theme.textTheme.titleLarge?.copyWith(letterSpacing: 1.2),
            ),
            const SizedBox(height: 12),
            Text(
              'Time Elapsed: ${_searchTime}s',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.secondary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Matching you with players in your entry tier.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () => _handleExit(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white10,
                foregroundColor: Colors.white,
              ),
              child: const Text('CANCEL MATCHMAKING'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMatched(ThemeData theme, MatchModel? match) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.flash_on, size: 80, color: theme.colorScheme.primary),
          const SizedBox(height: 24),
          Text(
            'MATCH FOUND!',
            style: theme.textTheme.displayLarge?.copyWith(
              color: theme.colorScheme.primary,
              fontSize: 36,
            ),
          ),
          const SizedBox(height: 12),
          const Text('Prepare yourself. Loading duel arena...', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildGameplay(ThemeData theme, BuildContext context, GameState state) {
    final match = state.currentMatch!;
    final questions = match.questions;
    final currentRoundIndex = state.currentRound - 1;
    
    // Safety check in case rounds overflow questions list length
    if (currentRoundIndex >= questions.length || currentRoundIndex < 0) {
      return const Center(child: Text('Synchronizing game questions...'));
    }

    final question = questions[currentRoundIndex];
    final isWordDuel = match.gameType == 'word_duel';
    final currentUserId = context.read<AuthBloc>().state is AuthAuthenticated 
        ? (context.read<AuthBloc>().state as AuthAuthenticated).user.id.toLowerCase()
        : '';

    // Opponent ID calculation
    final opponentId = match.players.firstWhere((p) => p.toLowerCase() != currentUserId, orElse: () => 'system').toLowerCase();
    final opponentName = match.playerNames[opponentId] ?? 'Opponent';

    final hasPlayerSubmitted = state.roundWaiting;
    final hasOpponentSubmitted = state.roundSelections.containsKey(opponentId);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top HUD showing score/timer
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('YOU', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: hasPlayerSubmitted ? Colors.green : Colors.amber,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Round Score: ${state.rounds.fold<int>(0, (sum, r) => sum + r.playerScore)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                ],
              ),
              // Timer
              CircleAvatar(
                radius: 28,
                backgroundColor: theme.colorScheme.secondary.withOpacity(0.1),
                child: Text(
                  '$_timeLeft',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: _timeLeft <= 3 ? theme.colorScheme.error : theme.colorScheme.secondary,
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(opponentName.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
                  Row(
                    children: [
                      Text(
                        'Round Score: ${state.rounds.fold<int>(0, (sum, r) => sum + r.opponentScore)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: hasOpponentSubmitted ? Colors.green : Colors.amber,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Round progress indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (idx) {
              Color dotColor = Colors.white24;
              if (idx < state.rounds.length) {
                final round = state.rounds[idx];
                if (round.winner == 'You') {
                  dotColor = theme.colorScheme.primary;
                } else if (round.winner == 'tie') {
                  dotColor = Colors.grey;
                } else {
                  dotColor = theme.colorScheme.error;
                }
              } else if (idx == state.currentRound - 1) {
                dotColor = theme.colorScheme.secondary;
              }
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 6),
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: dotColor,
                ),
              );
            }),
          ),
          const SizedBox(height: 32),

          // Round Question Card
          Expanded(
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              color: theme.cardColor,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'ROUND ${state.currentRound}',
                      style: TextStyle(
                        color: theme.colorScheme.secondary,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      isWordDuel 
                          ? (question.question ?? 'Solve the word problem!') 
                          : (question.expression ?? 'Solve the equation!'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Options Grid
          ...List.generate(question.options.length, (index) {
            final option = question.options[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: ElevatedButton(
                onPressed: hasPlayerSubmitted
                    ? null
                    : () {
                        _roundTimer?.cancel();
                        context.read<GameBloc>().add(
                              GameSubmitScore(
                                selectedIndex: index,
                                timeLeft: _timeLeft,
                              ),
                            );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: hasPlayerSubmitted ? Colors.white10 : theme.colorScheme.secondary,
                  foregroundColor: hasPlayerSubmitted ? Colors.white38 : Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(
                  option,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            );
          }),
          
          if (hasPlayerSubmitted)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12.0),
              child: Center(
                child: Text(
                  'Waiting for opponent to submit...',
                  style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScoreboard(ThemeData theme, BuildContext context, MatchResultDetail result) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(
            result.isWinner 
                ? Icons.emoji_events_rounded 
                : (result.isTie ? Icons.handshake_rounded : Icons.sentiment_very_dissatisfied),
            size: 96,
            color: result.isWinner ? theme.colorScheme.primary : Colors.grey,
          ),
          const SizedBox(height: 24),
          Text(
            result.isWinner 
                ? 'VICTORY!' 
                : (result.isTie ? 'DRAW MATCH' : 'DEFEAT'),
            textAlign: TextAlign.center,
            style: theme.textTheme.displayLarge?.copyWith(
              color: result.isWinner ? theme.colorScheme.primary : Colors.white70,
              fontSize: 36,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            result.isWinner 
                ? 'You won +${result.prize.toStringAsFixed(2)} USDT!' 
                : 'Better luck next time!',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18, color: Colors.grey),
          ),
          const SizedBox(height: 32),

          // Rounds summary table
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                const Text(
                  'Rounds Breakdown',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const Divider(),
                ...result.rounds.map((r) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Round ${r.roundNo}'),
                        Text(
                          r.winner == 'You' ? 'Won' : (r.winner == 'tie' ? 'Tie' : 'Lost'),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: r.winner == 'You' 
                                ? theme.colorScheme.primary 
                                : (r.winner == 'tie' ? Colors.grey : theme.colorScheme.error),
                          ),
                        ),
                        Text(r.score),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: () {
              context.read<GameBloc>().add(GameReset());
              Navigator.pop(context);
            },
            child: const Text('BACK TO ARENA'),
          ),
        ],
      ),
    );
  }

  Widget _buildError(ThemeData theme, BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 80, color: theme.colorScheme.error),
            const SizedBox(height: 24),
            const Text(
              'Matchmaking Error',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 48),
            ElevatedButton(
              onPressed: () {
                context.read<GameBloc>().add(GameReset());
                Navigator.pop(context);
              },
              child: const Text('RETURN TO ARENA'),
            ),
          ],
        ),
      ),
    );
  }
}
