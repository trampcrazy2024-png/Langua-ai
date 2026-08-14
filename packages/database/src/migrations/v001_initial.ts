import type { Migration } from './Migration';

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',

  async up(database) {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        email TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        title TEXT,
        dialect TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id TEXT PRIMARY KEY NOT NULL,
        language TEXT NOT NULL,
        dialect TEXT NOT NULL,
        word TEXT NOT NULL,
        meaning TEXT,
        example TEXT,
        level TEXT,
        created_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS srs_cards (
        id TEXT PRIMARY KEY NOT NULL,
        vocabulary_id TEXT NOT NULL,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        interval_days INTEGER NOT NULL DEFAULT 0,
        repetitions INTEGER NOT NULL DEFAULT 0,
        due_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS mistakes (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        conversation_id TEXT,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        original_text TEXT,
        corrected_text TEXT,
        created_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS pronunciation_attempts (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        word TEXT NOT NULL,
        dialect TEXT NOT NULL,
        score REAL NOT NULL,
        phonemes TEXT,
        created_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        dialect TEXT NOT NULL,
        level TEXT NOT NULL,
        skill TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS user_memory (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        memory_key TEXT NOT NULL,
        memory_value TEXT NOT NULL,
        importance REAL NOT NULL DEFAULT 0.5,
        updated_at TEXT NOT NULL
      )
    `);

    await database.execute(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id)
    `);

    await database.execute(`
      CREATE INDEX IF NOT EXISTS idx_vocabulary_word
      ON vocabulary(word)
    `);

    await database.execute(`
      CREATE INDEX IF NOT EXISTS idx_memory_user
      ON user_memory(user_id)
    `);
  }
};
