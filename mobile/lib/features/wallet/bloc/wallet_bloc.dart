import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/api_client.dart';
import '../../../core/constants.dart';
import '../models/wallet_model.dart';
import '../models/transaction_model.dart';
import 'wallet_event.dart';
import 'wallet_state.dart';

class WalletBloc extends Bloc<WalletEvent, WalletState> {
  final ApiClient apiClient;

  WalletBloc({required this.apiClient}) : super(WalletInitial()) {
    on<WalletFetchRequested>(_onFetchRequested);
    on<WalletDepositRequested>(_onDepositRequested);
    on<WalletWithdrawalRequested>(_onWithdrawalRequested);
    on<WalletTransferWinningsRequested>(_onTransferWinningsRequested);
  }

  Future<void> _onFetchRequested(WalletFetchRequested event, Emitter<WalletState> emit) async {
    emit(WalletLoading());
    try {
      final balanceRes = await apiClient.get('${AppConstants.apiWalletUrl}/balance');
      final txsRes = await apiClient.get('${AppConstants.apiWalletUrl}/transactions');

      if (balanceRes.statusCode == 200 && txsRes.statusCode == 200) {
        final balanceData = jsonDecode(balanceRes.body);
        final txsData = jsonDecode(txsRes.body);

        final wallet = WalletModel.fromJson(balanceData);
        final List<dynamic> txList = txsData is List ? txsData : (txsData['data'] ?? []);
        final transactions = txList.map((tx) => TransactionModel.fromJson(tx)).toList();

        emit(WalletLoaded(wallet: wallet, transactions: transactions));
      } else {
        emit(const WalletFailure('Failed to fetch wallet info'));
      }
    } catch (e) {
      emit(WalletFailure(e.toString()));
    }
  }

  Future<void> _onDepositRequested(WalletDepositRequested event, Emitter<WalletState> emit) async {
    emit(WalletLoading());
    try {
      final response = await apiClient.post(
        '${AppConstants.apiWalletUrl}/deposit',
        {
          'amount': event.amount,
          'network': event.network,
          'txHash': event.txHash,
          'note': event.note,
        },
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        final bool autoVerified = data['autoVerified'] ?? false;
        final String msg = autoVerified 
            ? 'Deposit auto-verified and credited!' 
            : 'Deposit submitted and pending manual review.';
        emit(WalletActionSuccess(msg));
        add(WalletFetchRequested());
      } else {
        final errorMsg = data['error'] ?? data['warning'] ?? 'Failed to submit deposit';
        emit(WalletFailure(errorMsg));
      }
    } catch (e) {
      emit(WalletFailure(e.toString()));
    }
  }

  Future<void> _onWithdrawalRequested(WalletWithdrawalRequested event, Emitter<WalletState> emit) async {
    emit(WalletLoading());
    try {
      final response = await apiClient.post(
        '${AppConstants.apiWalletUrl}/withdraw',
        {
          'amount': event.amount,
          'address': event.address,
          'network': event.network,
          'currency': 'USDT',
          'note': event.note,
        },
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        emit(const WalletActionSuccess('Withdrawal request submitted successfully!'));
        add(WalletFetchRequested());
      } else {
        final errorMsg = data['error'] ?? data['message'] ?? 'Failed to submit withdrawal';
        emit(WalletFailure(errorMsg));
      }
    } catch (e) {
      emit(WalletFailure(e.toString()));
    }
  }

  Future<void> _onTransferWinningsRequested(WalletTransferWinningsRequested event, Emitter<WalletState> emit) async {
    emit(WalletLoading());
    try {
      final response = await apiClient.post(
        '${AppConstants.apiWalletUrl}/transfer-winnings',
        {
          'amount': event.amount,
        },
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        emit(const WalletActionSuccess('Successfully transferred winnings to main balance!'));
        add(WalletFetchRequested());
      } else {
        final errorMsg = data['error'] ?? data['message'] ?? 'Failed to transfer winnings';
        emit(WalletFailure(errorMsg));
      }
    } catch (e) {
      emit(WalletFailure(e.toString()));
    }
  }
}
