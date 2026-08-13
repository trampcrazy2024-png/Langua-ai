import type { Migration } from './Migration';

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',

  sql: [
    `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT,
      native_language TEXT NOT NULL DEFAULT 'fa',
      target_language TEXT NOT NULL DEFAULT 'en-US',
      dialect TEXT NOT NULL DEFAULT 'en-US',
      cefr_level TEXT NOT NULL DEFAULT 'A1',
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT,
      dialect TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'offline',
      summary TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      audio_uri TEXT,
      token_count INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(conversation_id)
        REFERENCES conversations(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      word TEXT NOT NULL,
      language TEXT NOT NULL,
      translation TEXT,
      definition TEXT,
      example TEXT,
      cefr_level TEXT,
      frequency INTEGER NOT NULL DEFAULT 0,
      mastery REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id, word, language),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS vocabulary_examples (
      id TEXT PRIMARY KEY NOT NULL,
      vocabulary_id TEXT NOT NULL,
      example TEXT NOT NULL,
      translation TEXT,
      source TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(vocabulary_id)
        REFERENCES vocabulary(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS srs_cards (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      vocabulary_id TEXT,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      due_at INTEGER NOT NULL,
      last_reviewed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(vocabulary_id)
        REFERENCES vocabulary(id) ON DELETE SET NULL
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS srs_reviews (
      id TEXT PRIMARY KEY NOT NULL,
      card_id TEXT NOT NULL,
      quality INTEGER NOT NULL,
      previous_interval INTEGER NOT NULL,
      new_interval INTEGER NOT NULL,
      previous_ease REAL NOT NULL,
      new_ease REAL NOT NULL,
      reviewed_at INTEGER NOT NULL,
      FOREIGN KEY(card_id)
        REFERENCES srs_cards(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS mistakes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      conversation_id TEXT,
      message_id TEXT,
      type TEXT NOT NULL,
      source_text TEXT NOT NULL,
      correction TEXT,
      explanation TEXT,
      severity INTEGER NOT NULL DEFAULT 1,
      occurrence_count INTEGER NOT NULL DEFAULT 1,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS grammar_mistakes (
      id TEXT PRIMARY KEY NOT NULL,
      mistake_id TEXT NOT NULL,
      rule TEXT NOT NULL,
      expected TEXT,
      actual TEXT,
      FOREIGN KEY(mistake_id)
        REFERENCES mistakes(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS pronunciation_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      conversation_id TEXT,
      text TEXT NOT NULL,
      dialect TEXT NOT NULL,
      score REAL NOT NULL,
      audio_uri TEXT,
      duration_ms INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS pronunciation_errors (
      id TEXT PRIMARY KEY NOT NULL,
      attempt_id TEXT NOT NULL,
      word TEXT NOT NULL,
      phoneme TEXT,
      expected TEXT,
      actual TEXT,
      score REAL NOT NULL,
      FOREIGN KEY(attempt_id)
        REFERENCES pronunciation_attempts(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      skill TEXT NOT NULL,
      dialect TEXT NOT NULL,
      level TEXT NOT NULL,
      score REAL NOT NULL DEFAULT 0,
      practice_minutes INTEGER NOT NULL DEFAULT 0,
      items_completed INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id, skill, dialect),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      dialect TEXT NOT NULL,
      cefr_level TEXT NOT NULL,
      difficulty INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS path_progress (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      path_id TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id, path_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      dialect TEXT NOT NULL,
      cefr_level TEXT NOT NULL,
      difficulty INTEGER NOT NULL DEFAULT 1,
      character_name TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS scenario_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      score REAL,
      completed INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS user_memory (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      importance REAL NOT NULL DEFAULT 0.5,
      source TEXT,
      last_accessed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id, category, key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS conversation_summaries (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      message_start_id TEXT,
      message_end_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(conversation_id)
        REFERENCES conversations(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      achievement_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      unlocked_at INTEGER,
      progress REAL NOT NULL DEFAULT 0,
      UNIQUE(user_id, achievement_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      badge_key TEXT NOT NULL,
      title TEXT NOT NULL,
      earned_at INTEGER,
      UNIQUE(user_id, badge_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS streaks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_activity_date TEXT,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS daily_goals (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      goal_date TEXT NOT NULL,
      target_minutes INTEGER NOT NULL DEFAULT 15,
      completed_minutes INTEGER NOT NULL DEFAULT 0,
      target_xp INTEGER NOT NULL DEFAULT 100,
      earned_xp INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, goal_date),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS xp_events (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS imported_content (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_type TEXT NOT NULL,
      source_uri TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS audio_records (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      uri TEXT NOT NULL,
      duration_ms INTEGER,
      size_bytes INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS model_registry (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      version TEXT NOT NULL,
      path TEXT,
      size_bytes INTEGER,
      quantization TEXT,
      installed INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL
    );
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id, created_at);
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_conversations_user
      ON conversations(user_id, updated_at);
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_vocabulary_user
      ON vocabulary(user_id, language);
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_srs_due
      ON srs_cards(user_id, due_at);
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_mistakes_user
      ON mistakes(user_id, type, resolved);
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_memory_user
      ON user_memory(user_id, category);
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_sync_status
      ON sync_queue(status, created_at);
    `
  ]
};
