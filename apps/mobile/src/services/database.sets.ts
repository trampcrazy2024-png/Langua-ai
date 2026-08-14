import {
  DatabaseManager,
  MigrationRunner,
  migration001,
  ConversationRepository,
  MessageRepository,
  VocabularyRepository,
  UserMemoryRepository
} from '@lingua/database';

export const database = new DatabaseManager();

export const repositories = {
  conversations: new ConversationRepository(database),
  messages: new MessageRepository(database),
  vocabulary: new VocabularyRepository(database),
  memory: new UserMemoryRepository(database)
};

export async function initializeDatabase(): Promise<void> {
  await database.initialize();

  const migrations = new MigrationRunner(database);

  await migrations.run([
    migration001
  ]);
}
