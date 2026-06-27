import { ObjectId } from 'mongodb';

/**
 * Transaction MongoDB Model / Schema definition
 * References UserModel via userId
 */
export class TransactionModel {
  static schema = {
    _id: ObjectId,
    userId: ObjectId,       // Reference to User collection (_id)
    amount: Number,
    network: String,        // 'TRC20', 'ERC20', etc.
    txHash: String,         // Blockchain transaction ID
    status: String,         // 'pending', 'approved', 'rejected'
    type: String,           // 'deposit', 'withdrawal'
    note: String,
    createdAt: Date
  };

  static validate(data) {
    if (!data.userId) {
      throw new Error('userId reference is required.');
    }
    if (!data.amount || isNaN(Number(data.amount))) {
      throw new Error('Valid transaction amount is required.');
    }
    return {
      userId: typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId,
      amount: Number(data.amount),
      network: data.network || 'TRC20',
      txHash: (data.txHash || '').trim(),
      status: data.status || 'pending',
      type: data.type || 'deposit',
      note: data.note || '',
      createdAt: data.createdAt || new Date()
    };
  }
}
