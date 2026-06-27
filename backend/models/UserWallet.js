import { ObjectId } from 'mongodb';

/**
 * UserWallet MongoDB Model / Schema definition
 * References UserModel via userId
 */
export class UserWalletModel {
  static schema = {
    _id: ObjectId,
    userId: ObjectId,             // Reference to User collection (_id)
    tron: {
      address: String,
      privateKey: String
    },
    ethereum: {
      address: String,
      privateKey: String
    },
    createdAt: Date,
    updatedAt: Date
  };

  static validate(data) {
    if (!data.userId) {
      throw new Error('userId reference is required.');
    }
    if (!data.tron?.address || !data.ethereum?.address) {
      throw new Error('Tron and Ethereum addresses are required.');
    }
    return {
      userId: typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId,
      tron: {
        address: data.tron.address,
        privateKey: data.tron.privateKey || ''
      },
      ethereum: {
        address: data.ethereum.address,
        privateKey: data.ethereum.privateKey || ''
      },
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    };
  }
}
