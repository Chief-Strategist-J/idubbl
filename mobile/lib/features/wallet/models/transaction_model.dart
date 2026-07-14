import 'package:equatable/equatable.dart';

class TransactionModel extends Equatable {
  final String id;
  final String userId;
  final double amount;
  final String? network;
  final String? txHash;
  final String? address;
  final String status;
  final String type;
  final DateTime createdAt;
  final String? note;

  const TransactionModel({
    required this.id,
    required this.userId,
    required this.amount,
    this.network,
    this.txHash,
    this.address,
    required this.status,
    required this.type,
    required this.createdAt,
    this.note,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      network: json['network'],
      txHash: json['txHash'],
      address: json['address'],
      status: json['status'] ?? 'pending',
      type: json['type'] ?? 'deposit',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      note: json['note'],
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        amount,
        network,
        txHash,
        address,
        status,
        type,
        createdAt,
        note,
      ];
}
