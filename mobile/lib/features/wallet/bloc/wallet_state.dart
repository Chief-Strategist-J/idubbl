import 'package:equatable/equatable.dart';
import '../models/wallet_model.dart';
import '../models/transaction_model.dart';

abstract class WalletState extends Equatable {
  const WalletState();

  @override
  List<Object?> get props => [];
}

class WalletInitial extends WalletState {}

class WalletLoading extends WalletState {}

class WalletLoaded extends WalletState {
  final WalletModel wallet;
  final List<TransactionModel> transactions;

  const WalletLoaded({required this.wallet, required this.transactions});

  @override
  List<Object?> get props => [wallet, transactions];
}

class WalletActionSuccess extends WalletState {
  final String message;

  const WalletActionSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class WalletFailure extends WalletState {
  final String message;

  const WalletFailure(this.message);

  @override
  List<Object?> get props => [message];
}
