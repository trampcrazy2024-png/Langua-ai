import { BaseRepository } from './BaseRepository';

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export class MessageRepository extends BaseRepository {
  async create(
    message: Message
  ): Promise<void> {
    await this.execute(
      `
        INSERT INTO messages
        (id, conversation_id, role, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        message.id,
        message.conversation_id,
        message.role,
        message.content,
        message.created_at
      ]
    );
  }

  async listByConversation(
    conversationId: string
  ): Promise<Message[]> {
    return this.query<Message>(
      `
        SELECT *
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `,
      [conversationId]
    );
  }
}
