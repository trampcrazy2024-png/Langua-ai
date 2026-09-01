import { BaseRepository } from './BaseRepository';

export interface UserMemory {
  id: string;
  user_id: string;
  memory_key: string;
  memory_value: string;
  importance: number;
  updated_at: string;
}

export class UserMemoryRepository extends BaseRepository {
  async upsert(
    memory: UserMemory
  ): Promise<void> {
    const existing = await this.query<UserMemory>(
      `
        SELECT *
        FROM user_memory
        WHERE user_id = ?
          AND memory_key = ?
        LIMIT 1
      `,
      [
        memory.user_id,
        memory.memory_key
      ]
    );

    if (existing.length > 0) {
      await this.execute(
        `
          UPDATE user_memory
          SET memory_value = ?,
              importance = ?,
              updated_at = ?
          WHERE user_id = ?
            AND memory_key = ?
        `,
        [
          memory.memory_value,
          memory.importance,
          memory.updated_at,
          memory.user_id,
          memory.memory_key
        ]
      );

      return;
    }

    await this.execute(
      `
        INSERT INTO user_memory
        (id, user_id, memory_key, memory_value, importance, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        memory.id,
        memory.user_id,
        memory.memory_key,
        memory.memory_value,
        memory.importance,
        memory.updated_at
      ]
    );
  }

  async list(
    userId: string
  ): Promise<UserMemory[]> {
    return this.query<UserMemory>(
      `
        SELECT *
        FROM user_memory
        WHERE user_id = ?
        ORDER BY importance DESC, updated_at DESC
      `,
      [userId]
    );
  }
}
