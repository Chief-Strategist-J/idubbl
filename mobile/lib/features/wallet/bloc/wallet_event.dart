import 'package:equatable/equatable.dart';

abstract class WalletEvent extends Equatable {
  const WalletEvent();

  @override
  List<Object?> get props => [];
}

class WalletFetchRequested extends WalletEvent {}

class WalletDepositRequested extends WalletEvent {
  final double amount;
  final String network;
  final String txHash;
  final String? note;

  const WalletDepositRequested({
    required this.amount,
    required this.network,
    required this.txHash,
    this.note,
  });

  @override
  List<Object?> get props => [amount, network, txHash, note];
}

class WalletWithdrawalRequested extends WalletEvent {
  final double amount;
  final String address;
  final String network;
  final String? note;

  const WalletWithdrawalRequested({
    required this.amount,
    required this.address,
    required this.network,
    this.note,
  });

  @override
  List<Object?> get props => [amount, address, network, note];
}

class WalletTransferWinningsRequested extends WalletEvent {
  final double amount;

  const WalletTransferWinningsRequested({
    required this.amount,
  });

  @override
  List<Object?> get props => [amount];
}
