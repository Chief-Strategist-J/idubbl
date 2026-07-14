import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../../wallet/bloc/wallet_bloc.dart';
import '../../wallet/bloc/wallet_event.dart';
import '../../wallet/bloc/wallet_state.dart';
import '../../game/bloc/game_bloc.dart';
import '../../game/bloc/game_event.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedTier = 'rookie'; // 'micro', 'rookie', 'pro', 'elite'
  String _selectedGameType = 'word_duel'; // 'word_duel', 'math_duel'

  @override
  void initState() {
    super.initState();
    context.read<WalletBloc>().add(WalletFetchRequested());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('iDubbl Arena'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
            onPressed: () {
              context.read<AuthBloc>().add(AuthLogoutRequested());
              Navigator.pushReplacementNamed(context, '/');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Greeting & Wallet Card
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, authState) {
                final userName = authState is AuthAuthenticated ? authState.user.name : 'Player';
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back, $userName!',
                      style: theme.textTheme.titleLarge?.copyWith(fontSize: 22),
                    ),
                    const SizedBox(height: 12),
                  ],
                );
              },
            ),

            // Real Balance Card from Wallet Bloc
            BlocBuilder<WalletBloc, WalletState>(
              builder: (context, walletState) {
                double balance = 0.0;
                String kycText = 'None';
                if (walletState is WalletLoaded) {
                  balance = walletState.wallet.totalUSDT;
                  kycText = 'Verified';
                }
                
                return Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        theme.colorScheme.primary.withOpacity(0.15),
                        theme.colorScheme.secondary.withOpacity(0.15),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: theme.colorScheme.primary.withOpacity(0.3),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Balance',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFFB0BEC5),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black26,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'KYC: $kycText',
                              style: const TextStyle(
                                color: Color(0xFF00E676),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        textBaseline: TextBaseline.alphabetic,
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        children: [
                          Text(
                            balance.toStringAsFixed(2),
                            style: theme.textTheme.displayLarge?.copyWith(
                              color: Colors.white,
                              fontSize: 40,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'USDT',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00E676),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pushNamed(context, '/wallet', arguments: 'deposit');
                              },
                              icon: const Icon(Icons.add_circle_outline),
                              label: const Text('DEPOSIT'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.colorScheme.primary,
                                foregroundColor: Colors.black,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pushNamed(context, '/wallet', arguments: 'withdraw');
                              },
                              icon: const Icon(Icons.arrow_circle_down_outlined),
                              label: const Text('WITHDRAW'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white10,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 32),

            // Select Duel Arena Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Duel Arena',
                  style: theme.textTheme.titleLarge,
                ),
                Text(
                  'Online: 1,424',
                  style: TextStyle(
                    color: theme.colorScheme.secondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Game Types Toggle Selector
            Row(
              children: [
                Expanded(child: _buildGameTypeSelector('word_duel', 'Word Duel', Icons.abc, theme)),
                const SizedBox(width: 12),
                Expanded(child: _buildGameTypeSelector('math_duel', 'Math Duel', Icons.calculate_outlined, theme)),
              ],
            ),
            const SizedBox(height: 24),

            // Tiers selector
            const Text(
              'Select Entry Fee Tier',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),
            _buildTierItem('micro', 'Micro Tier', 'Entry: 2 USDT', 'Prize: 3.20 USDT', theme),
            const SizedBox(height: 8),
            _buildTierItem('rookie', 'Rookie Tier', 'Entry: 5 USDT', 'Prize: 8.00 USDT', theme),
            const SizedBox(height: 8),
            _buildTierItem('pro', 'Pro Tier', 'Entry: 20 USDT', 'Prize: 32.00 USDT', theme),
            const SizedBox(height: 8),
            _buildTierItem('elite', 'Elite Tier', 'Entry: 50 USDT', 'Prize: 80.00 USDT', theme),

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                final authState = context.read<AuthBloc>().state;
                if (authState is AuthAuthenticated) {
                  context.read<GameBloc>().add(GameJoinQueue(
                        tierName: _selectedTier,
                        userId: authState.user.id,
                        playerName: authState.user.name,
                        gameType: _selectedGameType,
                      ));
                  Navigator.pushNamed(context, '/game');
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please log in first')),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 18),
              ),
              child: Text(
                'FIND MATCH (${_selectedTier.toUpperCase()})',
                style: const TextStyle(letterSpacing: 1.5, fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameTypeSelector(String type, String label, IconData icon, ThemeData theme) {
    final isSelected = _selectedGameType == type;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedGameType = type;
        });
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.secondary.withOpacity(0.15) : theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? theme.colorScheme.secondary : Colors.white.withOpacity(0.05),
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 36, color: isSelected ? theme.colorScheme.secondary : Colors.grey),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTierItem(String tier, String title, String entry, String prize, ThemeData theme) {
    final isSelected = _selectedTier == tier;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedTier = tier;
        });
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary.withOpacity(0.1) : theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? theme.colorScheme.primary : Colors.white.withOpacity(0.05),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(entry, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
            Text(
              prize,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isSelected ? theme.colorScheme.primary : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
