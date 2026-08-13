import { BaseRepository } from './BaseRepository';

export interface Message {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  audio_uri: string | null;
  token_count: number | null;
  created_at: number;
}

export class MessageRepository extends BaseRepository {
  async create(
    conversationId: string,
    role: Message['role'],
    content: string,
    audioUri: string | null = null
  ): Promise<string> {
    const id = this.generateId();

    await this.database.run(
      `
      INSERT INTO messages
        (id, conversation_id, role, content, audio_uri, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        conversationId,
        role,
        content,
        audioUri,
        this.now()
      ]
    );

    return id;
  }

  async listByConversation(
    conversationId: string
  ): Promise<Message[]> {
    return this.database.query<Message>(
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
