import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../features/auth/bloc/auth_bloc.dart';
import '../../features/auth/bloc/auth_event.dart';
import '../../features/auth/bloc/auth_state.dart';

class GlassDrawer extends StatelessWidget {
  const GlassDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Drawer(
      backgroundColor: Colors.transparent,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0B0F19).withOpacity(0.9),
            border: Border(
              right: BorderSide(color: Colors.white.withOpacity(0.15), width: 1.5),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drawer Header with User Profile Details
              BlocBuilder<AuthBloc, AuthState>(
                builder: (context, authState) {
                  final userName = authState is AuthAuthenticated ? authState.user.name : 'Player';
                  final userEmail = authState is AuthAuthenticated ? authState.user.email : 'play@idubbl.com';
                  final userRole = authState is AuthAuthenticated ? authState.user.role : 'player';

                  return Container(
                    padding: const EdgeInsets.only(top: 60, bottom: 24, left: 24, right: 24),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Colors.white.withOpacity(0.1), width: 1),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: theme.colorScheme.primary.withOpacity(0.2),
                          child: Icon(
                            Icons.sports_esports_rounded,
                            size: 40,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          userName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          userEmail,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.6),
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: theme.colorScheme.primary.withOpacity(0.3)),
                          ),
                          child: Text(
                            userRole.toUpperCase(),
                            style: TextStyle(
                              color: theme.colorScheme.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),

              // Drawer Navigation Items
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                  children: [
                    _buildDrawerItem(
                      icon: Icons.home_filled,
                      label: 'Home / Arena',
                      onTap: () {
                        Navigator.pop(context); // Close Drawer
                        Navigator.pushReplacementNamed(context, '/dashboard');
                      },
                    ),
                    const SizedBox(height: 8),
                    _buildDrawerItem(
                      icon: Icons.account_balance_wallet_rounded,
                      label: 'USDT Wallet Hub',
                      onTap: () {
                        Navigator.pop(context); // Close Drawer
                        Navigator.pushReplacementNamed(context, '/wallet');
                      },
                    ),
                  ],
                ),
              ),

              // Bottom Area with Logout
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.logout_rounded, color: Colors.redAccent),
                    title: const Text(
                      'Logout',
                      style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
                    ),
                    onTap: () {
                      context.read<AuthBloc>().add(AuthLogoutRequested());
                      Navigator.pop(context); // Close drawer
                      Navigator.pushReplacementNamed(context, '/');
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: ListTile(
        leading: Icon(icon, color: Colors.white),
        title: Text(
          label,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white38),
        onTap: onTap,
      ),
    );
  }
}
