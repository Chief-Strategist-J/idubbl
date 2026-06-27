import { ObjectId } from 'mongodb';

/**
 * Wallet MongoDB Model / Schema definition
 * References UserModel via userId (stored as ObjectId or String ref)
 */
export class WalletModel {
  static schema = {
    _id: ObjectId,
    userId: ObjectId,             // Reference to User collection (_id)
    depositBalance: Number,       // Deposited USDT balance
    winningsBalance: Number,      // Win USDT balance
    lockedBalance: Number,        // Locked in active matches
    pendingWithdrawals: Number,   // Pending approval to withdraw
    createdAt: Date
  };

  static validate(data) {
    if (!data.userId) {
      throw new Error('userId reference is required.');
    }
    return {
      userId: typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId,
      depositBalance: Number(data.depositBalance || 0),
      winningsBalance: Number(data.winningsBalance || 0),
      lockedBalance: Number(data.lockedBalance || 0),
      pendingWithdrawals: Number(data.pendingWithdrawals || 0),
      createdAt: data.createdAt || new Date()
    };
  }
}
