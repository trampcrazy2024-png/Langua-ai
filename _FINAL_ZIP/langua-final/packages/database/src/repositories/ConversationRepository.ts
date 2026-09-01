import { BaseRepository } from './BaseRepository';

export interface Conversation {
  id: string;
  user_id?: string;
  title?: string;
  dialect: string;
  created_at: string;
  updated_at: string;
}

export class ConversationRepository extends BaseRepository {
  async create(
    conversation: Conversation
  ): Promise<void> {
    await this.execute(
      `
        INSERT INTO conversations
        (id, user_id, title, dialect, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        conversation.id,
        conversation.user_id ?? null,
        conversation.title ?? null,
        conversation.dialect,
        conversation.created_at,
        conversation.updated_at
      ]
    );
  }

  async findById(
    id: string
  ): Promise<Conversation | null> {
    const rows = await this.query<Conversation>(
      `
        SELECT *
        FROM conversations
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    return rows[0] ?? null;
  }

  async list(
    userId?: string
  ): Promise<Conversation[]> {
    if (userId) {
      return this.query<Conversation>(
        `
          SELECT *
          FROM conversations
          WHERE user_id = ?
          ORDER BY updated_at DESC
        `,
        [userId]
      );
    }

    return this.query<Conversation>(
      `
        SELECT *
        FROM conversations
        ORDER BY updated_at DESC
      `
    );
  }
}
