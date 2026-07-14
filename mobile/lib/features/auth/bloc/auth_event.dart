import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthCheckSession extends AuthEvent {}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;
  final String portal;

  const AuthLoginRequested({
    required this.email,
    required this.password,
    this.portal = 'player',
  });

  @override
  List<Object?> get props => [email, password, portal];
}

class AuthRegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String name;
  final String? referralCode;

  const AuthRegisterRequested({
    required this.email,
    required this.password,
    required this.name,
    this.referralCode,
  });

  @override
  List<Object?> get props => [email, password, name, referralCode];
}

class AuthVerifyOtpRequested extends AuthEvent {
  final String email;
  final String otp;

  const AuthVerifyOtpRequested({
    required this.email,
    required this.otp,
  });

  @override
  List<Object?> get props => [email, otp];
}

class AuthLogoutRequested extends AuthEvent {}
