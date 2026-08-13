import { BaseRepository } from './BaseRepository';

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  dialect: string;
  mode: string;
  summary: string | null;
  created_at: number;
  updated_at: number;
}

export class ConversationRepository extends BaseRepository {
  async create(
    userId: string,
    dialect: string,
    mode = 'offline',
    title: string | null = null
  ): Promise<string> {
    const id = this.generateId();
    const now = this.now();

    await this.database.run(
      `
      INSERT INTO conversations
        (id, user_id, title, dialect, mode, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [id, userId, title, dialect, mode, now, now]
    );

    return id;
  }

  async findById(id: string): Promise<Conversation | null> {
    const rows = await this.database.query<Conversation>(
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

  async listByUser(userId: string): Promise<Conversation[]> {
    return this.database.query<Conversation>(
      `
      SELECT *
      FROM conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
      `,
      [userId]
    );
  }
}
