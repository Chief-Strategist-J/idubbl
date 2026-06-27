import { ObjectId } from 'mongodb';

/**
 * User MongoDB Model / Schema definition
 */
export class UserModel {
  static schema = {
    _id: ObjectId,
    email: String,          // Unique user email
    name: String,           // User display name
    role: String,           // 'player' or 'admin'
    status: String,         // 'active' or 'suspended'
    createdAt: Date
  };

  static validate(data) {
    if (!data.email || typeof data.email !== 'string') {
      throw new Error('Valid email is required.');
    }
    return {
      email: data.email.trim().toLowerCase(),
      name: data.name || 'User',
      role: data.role || 'player',
      status: data.status || 'active',
      createdAt: data.createdAt || new Date()
    };
  }
}
