export class MessageModel {
  static validate(data) {
    const { conversationId, senderId, senderName, text } = data;
    if (!conversationId) throw new Error('conversationId is required.');
    if (!senderId) throw new Error('senderId is required.');
    if (!text?.trim()) throw new Error('Message text cannot be empty.');
    return {
      conversationId,
      senderId,
      senderName: senderName?.trim() || 'Unknown',
      text: text.trim(),
      replyTo: data.replyTo ?? null,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date()
    };
  }
}
