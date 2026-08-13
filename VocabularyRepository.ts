import { BaseRepository } from './BaseRepository';

export interface Vocabulary {
  id: string;
  user_id: string;
  word: string;
  language: string;
  translation: string | null;
  definition: string | null;
  example: string | null;
  cefr_level: string | null;
  frequency: number;
  mastery: number;
  created_at: number;
  updated_at: number;
}

export class VocabularyRepository extends BaseRepository {
  async upsert(
    userId: string,
    word: string,
    language: string,
    translation: string | null = null
  ): Promise<void> {
    const now = this.now();

    await this.database.run(
      `
      INSERT INTO vocabulary
        (
          id,
          user_id,
          word,
          language,
          translation,
          created_at,
          updated_at
        )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, word, language)
      DO UPDATE SET
        translation = excluded.translation,
        updated_at = excluded.updated_at
      `,
      [
        this.generateId(),
        userId,
        word,
        language,
        translation,
        now,
        now
      ]
    );
  }

  async listByUser(
    userId: string,
    language: string
  ): Promise<Vocabulary[]> {
    return this.database.query<Vocabulary>(
      `
      SELECT *
      FROM vocabulary
      WHERE user_id = ?
        AND language = ?
      ORDER BY updated_at DESC
      `,
      [userId, language]
    );
  }
}
