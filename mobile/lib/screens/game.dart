import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  String _gameState = 'matchmaking'; // matchmaking -> playing -> score
  String _gameName = 'Word Duel';
  int _searchTime = 0;
  Timer? _searchTimer;
  Timer? _gameTimer;

  // Game vars
  int _score = 0;
  int _opponentScore = 0;
  int _timeLeft = 10;
  int _correctIndex = 2; // For reaction race grid
  int? _mySelection;
  int? _opponentSelection;
  final Random _random = Random();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments as String?;
    if (args != null) {
      _gameName = args;
    }
    if (_gameState == 'matchmaking' && _searchTimer == null) {
      _startMatchmaking();
    }
  }

  @override
  void dispose() {
    _searchTimer?.cancel();
    _gameTimer?.cancel();
    super.dispose();
  }

  void _startMatchmaking() {
    _searchTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _searchTime++;
      });

      if (_searchTime >= 4) {
        _searchTimer?.cancel();
        setState(() {
          _gameState = 'playing';
          _timeLeft = 10;
        });
        _startGameplay();
      }
    });
  }

  void _startGameplay() {
    _correctIndex = _random.nextInt(9);
    _gameTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_timeLeft > 0) {
          _timeLeft--;

          // Simulate real-time opponent actions
          if (_timeLeft == 7 && _opponentSelection == null) {
            // Opponent makes selection
            _opponentSelection = _random.nextInt(9);
            if (_opponentSelection == _correctIndex) {
              _opponentScore += 10;
            }
          }
        } else {
          // Round end / Game end
          _gameTimer?.cancel();
          _gameState = 'score';
        }
      });
    });
  }

  void _selectTile(int index) {
    if (_mySelection != null || _gameState != 'playing') return;

    setState(() {
      _mySelection = index;
      if (index == _correctIndex) {
        _score += 10;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(_gameName),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            _searchTimer?.cancel();
            _gameTimer?.cancel();
            Navigator.pop(context);
          },
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: _buildBody(theme),
        ),
      ),
    );
  }

  Widget _buildBody(ThemeData theme) {
    switch (_gameState) {
      case 'matchmaking':
        return _buildMatchmaking(theme);
      case 'playing':
        return _buildGameplay(theme);
      case 'score':
        return _buildScoreboard(theme);
      default:
        return Container();
    }
  }

  Widget _buildMatchmaking(ThemeData theme) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Spacer(),
        Center(
          child: SizedBox(
            height: 120,
            width: 120,
            child: CircularProgressIndicator(
              strokeWidth: 8,
              color: theme.colorScheme.primary,
            ),
          ),
        ),
        const SizedBox(height: 48),
        Text(
          'SEARCHING FOR OPPONENT',
          style: theme.textTheme.titleLarge?.copyWith(letterSpacing: 2),
        ),
        const SizedBox(height: 8),
        const Text(
          'Connecting to matchmaking room...',
          style: TextStyle(color: Colors.white30),
        ),
        const Spacer(),
        Text(
          'Time Elapsed: ${_searchTime}s',
          style: TextStyle(
            color: theme.colorScheme.secondary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildGameplay(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Match status panel
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('YOU', style: TextStyle(color: Colors.white54, fontSize: 12)),
                Text('$_score pts', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: theme.colorScheme.error.withOpacity(0.3)),
              ),
              child: Text(
                'ROUND TIMER: $_timeLeft',
                style: TextStyle(
                  color: theme.colorScheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text('OPPONENT', style: TextStyle(color: Colors.white54, fontSize: 12)),
                Text('$_opponentScore pts', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueAccent)),
              ],
            ),
          ],
        ),
        const SizedBox(height: 32),

        // Game specific interface
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_gameName == 'Reaction Race') ...[
                const Text(
                  'Tap the correct target tile!',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: 9,
                  itemBuilder: (context, index) {
                    final isCorrect = index == _correctIndex;
                    final isMe = index == _mySelection;
                    final isOpponent = index == _opponentSelection;

                    Color tileColor = theme.cardColor;
                    Border? border;

                    if (isCorrect && _mySelection != null) {
                      tileColor = theme.colorScheme.primary.withOpacity(0.2);
                    }
                    if (isMe) {
                      border = Border.all(color: theme.colorScheme.primary, width: 3);
                    } else if (isOpponent) {
                      border = Border.all(color: Colors.blue, width: 3, style: BorderStyle.solid);
                    }

                    return InkWell(
                      onTap: () => _selectTile(index),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: tileColor,
                          borderRadius: BorderRadius.circular(16),
                          border: border,
                          boxShadow: isCorrect && _mySelection == null
                              ? [
                                  BoxShadow(
                                    color: theme.colorScheme.primary.withOpacity(0.3),
                                    blurRadius: 12,
                                    spreadRadius: 2,
                                  )
                                ]
                              : null,
                        ),
                        child: Center(
                          child: isCorrect && _mySelection == null
                              ? Icon(Icons.flash_on, color: theme.colorScheme.primary, size: 36)
                              : Text(
                                  'Tile ${index + 1}',
                                  style: const TextStyle(color: Colors.white30),
                                ),
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
                if (_opponentSelection != null)
                  const Text(
                    'Opponent selected a tile!',
                    style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                  )
              ] else if (_gameName == 'Math Duel') ...[
                const Text(
                  'Solve this equation:',
                  style: TextStyle(fontSize: 18, color: Colors.white70),
                ),
                const SizedBox(height: 12),
                const Text(
                  '45 + 18 * 2 = ?',
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 48),
                _buildMathOption('126'),
                const SizedBox(height: 12),
                _buildMathOption('81'),
                const SizedBox(height: 12),
                _buildMathOption('108'),
              ] else ...[
                // Word Duel
                const Text(
                  'Unscramble the gaming word:',
                  style: TextStyle(fontSize: 18, color: Colors.white70),
                ),
                const SizedBox(height: 12),
                const Text(
                  'L T Y A O N R H E P T I E H E M P D G A O R A T M O C H L S F E L O O M R N G I V V E R R O W O A N P I T I O N A C E A U X S H T A H',
                  style: TextStyle(fontSize: 20, letterSpacing: 2, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                _buildMathOption('MULTIPLAYER'),
                const SizedBox(height: 12),
                _buildMathOption('TRANSACTION'),
                const SizedBox(height: 12),
                _buildMathOption('LEADERBOARD'),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMathOption(String option) {
    final isSelected = _mySelection != null;
    return ElevatedButton(
      onPressed: isSelected ? null : () => setState(() => _mySelection = 0),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white10,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 18),
      ),
      child: Text(option, style: const TextStyle(fontSize: 18)),
    );
  }

  Widget _buildScoreboard(ThemeData theme) {
    final didWin = _score > _opponentScore;
    final isTie = _score == _opponentScore;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Spacer(),
        Icon(
          didWin
              ? Icons.emoji_events
              : isTie
                  ? Icons.handshake
                  : Icons.sentiment_very_dissatisfied,
          size: 100,
          color: didWin
              ? const Color(0xFF00E676)
              : isTie
                  ? Colors.amber
                  : const Color(0xFFFF1744),
        ),
        const SizedBox(height: 24),
        Text(
          didWin
              ? 'VICTORY!'
              : isTie
                  ? 'IT\'S A TIE!'
                  : 'DEFEAT!',
          textAlign: TextAlign.center,
          style: theme.textTheme.displayLarge?.copyWith(
            color: didWin
                ? const Color(0xFF00E676)
                : isTie
                    ? Colors.amber
                    : const Color(0xFFFF1744),
            letterSpacing: 3,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          didWin ? 'Credited winnings to your wallet.' : 'Settled matching fees.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white54),
        ),
        const SizedBox(height: 48),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            children: [
              _buildScoreRow('Your Score:', '$_score'),
              const Divider(color: Colors.white10, height: 24),
              _buildScoreRow('Opponent Score:', '$_opponentScore'),
            ],
          ),
        ),
        const Spacer(),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text('BACK TO DASHBOARD'),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildScoreRow(String label, String val) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 16, color: Colors.white60)),
        Text(val, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
