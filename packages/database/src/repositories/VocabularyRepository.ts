import { BaseRepository } from './BaseRepository';

export interface Vocabulary {
  id: string;
  language: string;
  dialect: string;
  word: string;
  meaning?: string;
  example?: string;
  level?: string;
  created_at: string;
}

export class VocabularyRepository extends BaseRepository {
  async create(
    vocabulary: Vocabulary
  ): Promise<void> {
    await this.execute(
      `
        INSERT INTO vocabulary
        (id, language, dialect, word, meaning, example, level, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        vocabulary.id,
        vocabulary.language,
        vocabulary.dialect,
        vocabulary.word,
        vocabulary.meaning ?? null,
        vocabulary.example ?? null,
        vocabulary.level ?? null,
        vocabulary.created_at
      ]
    );
  }

  async search(
    word: string
  ): Promise<Vocabulary[]> {
    return this.query<Vocabulary>(
      `
        SELECT *
        FROM vocabulary
        WHERE word LIKE ?
        ORDER BY word ASC
      `,
      [`%${word}%`]
    );
  }
}
