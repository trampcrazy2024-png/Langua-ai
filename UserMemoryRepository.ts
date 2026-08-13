import { BaseRepository } from './BaseRepository';

export interface UserMemory {
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: string;
  importance: number;
  source: string | null;
  last_accessed_at: number | null;
  created_at: number;
  updated_at: number;
}

export class UserMemoryRepository extends BaseRepository {
  async upsert(
    userId: string,
    category: string,
    key: string,
    value: string,
    importance = 0.5,
    source: string | null = null
  ): Promise<void> {
    const now = this.now();

    await this.database.run(
      `
      INSERT INTO user_memory
        (
          id,
          user_id,
          category,
          key,
          value,
          importance,
          source,
          created_at,
          updated_at
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, category, key)
      DO UPDATE SET
        value = excluded.value,
        importance = excluded.importance,
        source = excluded.source,
        updated_at = excluded.updated_at
      `,
      [
        this.generateId(),
        userId,
        category,
        key,
        value,
        importance,
        source,
        now,
        now
      ]
    );
  }

  async findByCategory(
    userId: string,
    category: string
  ): Promise<UserMemory[]> {
    return this.database.query<UserMemory>(
      `
      SELECT *
      FROM user_memory
      WHERE user_id = ?
        AND category = ?
      ORDER BY importance DESC, updated_at DESC
      `,
      [userId, category]
    );
  }
}
