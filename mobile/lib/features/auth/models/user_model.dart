import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? referralCode;
  final String? referredBy;
  final String? kycStatus;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.referralCode,
    this.referredBy,
    this.kycStatus,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'player',
      referralCode: json['referralCode'],
      referredBy: json['referredBy'],
      kycStatus: json['kycStatus'] ?? 'none',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'referralCode': referralCode,
      'referredBy': referredBy,
      'kycStatus': kycStatus,
    };
  }

  @override
  List<Object?> get props => [id, email, name, role, referralCode, referredBy, kycStatus];
}
