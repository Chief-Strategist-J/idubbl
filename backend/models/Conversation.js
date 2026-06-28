export class ConversationModel {
  static validate(data) {
    const { type, name, members, createdBy } = data;
    if (!['direct', 'group'].includes(type)) throw new Error('Invalid type.');
    if (!Array.isArray(members) || members.length < 2) throw new Error('At least 2 members required.');
    if (type === 'direct' && members.length !== 2) throw new Error('Direct conversation requires exactly 2 members.');
    if (type === 'group' && !name?.trim()) throw new Error('Group name is required.');
    if (!createdBy) throw new Error('createdBy is required.');
    const now = new Date();
    return {
      type,
      name: type === 'group' ? name.trim() : null,
      members: members.map(userId => ({
        userId,
        role: type === 'group' ? (userId === createdBy ? 'owner' : 'member') : 'member',
        joinedAt: now,
        lastReadAt: new Date(0)
      })),
      lastMessage: null,
      createdBy,
      createdAt: now,
      updatedAt: now
    };
  }
}
