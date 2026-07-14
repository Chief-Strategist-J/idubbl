import 'package:equatable/equatable.dart';

class WalletModel extends Equatable {
  final String userId;
  final double depositBalance;
  final double winningsBalance;
  final double referralBalance;
  final double idubbuBalance;
  final double lockedBalance;
  final double pendingWithdrawals;

  const WalletModel({
    required this.userId,
    required this.depositBalance,
    required this.winningsBalance,
    required this.referralBalance,
    required this.idubbuBalance,
    required this.lockedBalance,
    required this.pendingWithdrawals,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      userId: json['userId'] ?? '',
      depositBalance: (json['depositBalance'] ?? 0).toDouble(),
      winningsBalance: (json['winningsBalance'] ?? 0).toDouble(),
      referralBalance: (json['referralBalance'] ?? 0).toDouble(),
      idubbuBalance: (json['idubbuBalance'] ?? 0).toDouble(),
      lockedBalance: (json['lockedBalance'] ?? 0).toDouble(),
      pendingWithdrawals: (json['pendingWithdrawals'] ?? 0).toDouble(),
    );
  }

  double get totalUSDT => depositBalance + winningsBalance + referralBalance;

  @override
  List<Object?> get props => [
        userId,
        depositBalance,
        winningsBalance,
        referralBalance,
        idubbuBalance,
        lockedBalance,
        pendingWithdrawals,
      ];
}
