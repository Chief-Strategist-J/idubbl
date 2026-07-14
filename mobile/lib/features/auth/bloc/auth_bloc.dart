import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/api_client.dart';
import '../../../core/constants.dart';
import '../models/user_model.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiClient apiClient;

  AuthBloc({required this.apiClient}) : super(AuthInitial()) {
    on<AuthCheckSession>(_onCheckSession);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthVerifyOtpRequested>(_onVerifyOtpRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onCheckSession(AuthCheckSession event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final token = await apiClient.getToken();
      if (token == null || token.isEmpty) {
        emit(AuthUnauthenticated());
        return;
      }

      final response = await apiClient.get('${AppConstants.apiAuthUrl}/get-session');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data != null && data['user'] != null) {
          final user = UserModel.fromJson(data['user']);
          emit(AuthAuthenticated(user));
          return;
        }
      }
      await apiClient.clearToken();
      emit(AuthUnauthenticated());
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onLoginRequested(AuthLoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final response = await apiClient.post(
        '${AppConstants.apiAuthUrl}/sign-in/email',
        {
          'email': event.email,
          'password': event.password,
        },
        extraHeaders: {'x-portal': event.portal},
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data != null && data['user'] != null) {
        final token = response.headers['set-auth-token'] ?? 
                      data['token'] ?? 
                      (data['session'] != null ? data['session']['token'] : null) ??
                      data['sessionToken'];
        if (token != null) {
          await apiClient.saveToken(token);
        }
        final user = UserModel.fromJson(data['user']);
        emit(AuthAuthenticated(user));
      } else {
        final errorMsg = data['message'] ?? 'Invalid credentials';
        emit(AuthFailure(errorMsg));
      }
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onRegisterRequested(AuthRegisterRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final response = await apiClient.post(
        '${AppConstants.apiAuthUrl}/sign-up/email',
        {
          'email': event.email,
          'password': event.password,
          'name': event.name,
          'enteredReferralCode': event.referralCode,
        },
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data != null && data['user'] != null) {
        // Sign-up succeeded; requires verification OTP which backend sent
        emit(AuthVerificationRequired(event.email));
      } else {
        final errorMsg = data['message'] ?? 'Failed to register';
        emit(AuthFailure(errorMsg));
      }
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onVerifyOtpRequested(AuthVerifyOtpRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final response = await apiClient.post(
        '${AppConstants.apiAuthUrl}/verify-email-otp',
        {
          'email': event.email,
          'otp': event.otp,
        },
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data != null && data['user'] != null) {
        final token = response.headers['set-auth-token'] ?? 
                      data['token'] ?? 
                      (data['session'] != null ? data['session']['token'] : null) ??
                      data['sessionToken'];
        if (token != null) {
          await apiClient.saveToken(token);
        }
        final user = UserModel.fromJson(data['user']);
        emit(AuthAuthenticated(user));
      } else {
        final errorMsg = data['error'] ?? data['message'] ?? 'Verification failed';
        emit(AuthFailure(errorMsg));
      }
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onLogoutRequested(AuthLogoutRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      await apiClient.post('${AppConstants.apiAuthUrl}/sign-out', {});
    } catch (_) {}
    await apiClient.clearToken();
    emit(AuthUnauthenticated());
  }
}
