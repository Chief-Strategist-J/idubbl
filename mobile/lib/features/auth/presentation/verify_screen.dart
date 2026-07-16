import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class VerifyScreen extends StatefulWidget {
  const VerifyScreen({super.key});

  @override
  State<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends State<VerifyScreen> {
  final _otpController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final email = ModalRoute.of(context)!.settings.arguments as String;

    return Scaffold(
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
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
            extendBodyBehindAppBar: true,
            appBar: AppBar(
              title: const Text('Verify Email', style: TextStyle(fontWeight: FontWeight.bold)),
              centerTitle: true,
              backgroundColor: Colors.transparent,
              elevation: 0,
              flexibleSpace: ClipRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(color: Colors.black.withOpacity(0.15)),
                ),
              ),
            ),
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
                  // Core Content
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
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
                                        'Verification Code Sent',
                                        textAlign: TextAlign.center,
                                        style: theme.textTheme.titleLarge?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'We sent an activation code to $email. Please enter it below to confirm your account.',
                                        textAlign: TextAlign.center,
                                        style: theme.textTheme.bodyMedium?.copyWith(
                                          color: Colors.white.withOpacity(0.7),
                                        ),
                                      ),
                                      const SizedBox(height: 32),
                                      TextFormField(
                                        controller: _otpController,
                                        style: const TextStyle(color: Colors.white, fontSize: 24, letterSpacing: 8, fontWeight: FontWeight.bold),
                                        decoration: InputDecoration(
                                          labelText: '6-digit OTP Code',
                                          labelStyle: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 16, letterSpacing: 0),
                                          prefixIcon: Icon(Icons.security, color: Colors.white.withOpacity(0.6)),
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
                                        keyboardType: TextInputType.number,
                                        textAlign: TextAlign.center,
                                        maxLength: 6,
                                        validator: (value) {
                                          if (value == null || value.length < 6) {
                                            return 'Please enter the 6-digit code';
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
                                                        AuthVerifyOtpRequested(
                                                          email: email,
                                                          otp: _otpController.text.trim(),
                                                        ),
                                                      );
                                                }
                                              },
                                              child: const Text('ACTIVATE ACCOUNT'),
                                            ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
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
