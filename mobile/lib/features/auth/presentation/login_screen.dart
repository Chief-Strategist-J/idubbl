import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            Navigator.pushReplacementNamed(context, '/dashboard');
          } else if (state is AuthVerificationRequired) {
            Navigator.pushNamed(
              context,
              '/verify',
              arguments: state.email,
            );
          } else if (state is AuthFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: theme.colorScheme.error,
              ),
            );
          }
        },
        builder: (context, state) {
          return Scaffold(
            body: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF0B0F19),
                    Color(0xFF111827),
                    Color(0xFF1F2937),
                  ],
                ),
              ),
              child: Stack(
                children: [
                  // Top-Left Glowing Ambient Blob
                  Positioned(
                    top: -100,
                    left: -100,
                    child: Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: theme.colorScheme.primary.withOpacity(0.2),
                      ),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 50, sigmaY: 50),
                        child: Container(color: Colors.transparent),
                      ),
                    ),
                  ),
                  // Bottom-Right Glowing Ambient Blob
                  Positioned(
                    bottom: -150,
                    right: -100,
                    child: Container(
                      width: 350,
                      height: 350,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: theme.colorScheme.secondary.withOpacity(0.15),
                      ),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
                        child: Container(color: Colors.transparent),
                      ),
                    ),
                  ),
                  // Middle-Right Ambient Blob
                  Positioned(
                    top: 250,
                    right: -50,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.purple.withOpacity(0.12),
                      ),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
                        child: Container(color: Colors.transparent),
                      ),
                    ),
                  ),
                  // Core Content
                  SafeArea(
                    child: Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Center(
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.primary.withOpacity(0.1),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: theme.colorScheme.primary.withOpacity(0.5),
                                      width: 2,
                                    ),
                                  ),
                                  child: Icon(
                                    Icons.sports_esports,
                                    size: 64,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'iDubbl',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.displayLarge?.copyWith(
                                  letterSpacing: 2,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'Competitive Gaming Arena',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: theme.colorScheme.secondary.withOpacity(0.8),
                                ),
                              ),
                              const SizedBox(height: 48),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                                  child: Container(
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.06),
                                      borderRadius: BorderRadius.circular(24),
                                      border: Border.all(
                                        color: Colors.white.withOpacity(0.15),
                                        width: 1.5,
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                        Text(
                                          'Sign In',
                                          style: theme.textTheme.titleLarge?.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 24),
                                        TextFormField(
                                          controller: _emailController,
                                          style: const TextStyle(color: Colors.white),
                                          decoration: InputDecoration(
                                            labelText: 'Email Address',
                                            labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                                            prefixIcon: Icon(Icons.email_outlined, color: Colors.white.withOpacity(0.6)),
                                            enabledBorder: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(12),
                                              borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                                            ),
                                            focusedBorder: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(12),
                                              borderSide: BorderSide(color: theme.colorScheme.primary),
                                            ),
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                          ),
                                          keyboardType: TextInputType.emailAddress,
                                          validator: (value) {
                                            if (value == null || value.isEmpty) {
                                              return 'Please enter your email';
                                            }
                                            return null;
                                          },
                                        ),
                                        const SizedBox(height: 16),
                                        TextFormField(
                                          controller: _passwordController,
                                          style: const TextStyle(color: Colors.white),
                                          decoration: InputDecoration(
                                            labelText: 'Password',
                                            labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                                            prefixIcon: Icon(Icons.lock_outlined, color: Colors.white.withOpacity(0.6)),
                                            enabledBorder: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(12),
                                              borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                                            ),
                                            focusedBorder: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(12),
                                              borderSide: BorderSide(color: theme.colorScheme.primary),
                                            ),
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                          ),
                                          obscureText: true,
                                          validator: (value) {
                                            if (value == null || value.isEmpty) {
                                              return 'Please enter your password';
                                            }
                                            return null;
                                          },
                                        ),
                                        const SizedBox(height: 24),
                                        state is AuthLoading
                                            ? const Center(child: CircularProgressIndicator())
                                            : ElevatedButton(
                                                onPressed: () {
                                                  if (_formKey.currentState!.validate()) {
                                                    context.read<AuthBloc>().add(
                                                          AuthLoginRequested(
                                                            email: _emailController.text.trim(),
                                                            password: _passwordController.text,
                                                          ),
                                                        );
                                                  }
                                                },
                                                child: const Text('ENTER ARENA'),
                                              ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text("Don't have an account? ", style: TextStyle(color: Colors.white70)),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pushNamed(context, '/register');
                                    },
                                    child: Text(
                                      'Register',
                                      style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
