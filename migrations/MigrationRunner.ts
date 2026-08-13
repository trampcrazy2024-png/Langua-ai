import type { Migration } from './Migration';
import { DatabaseManager } from '../DatabaseManager';

export class MigrationRunner {
  constructor(private readonly database: DatabaseManager) {}

  async run(migrations: Migration[]): Promise<void> {
    const db = this.database.getConnection();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );
    `);

    const applied = await db.query<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version'
    );

    const versions = new Set(
      (applied.values ?? []).map((item) => item.version)
    );

    for (const migration of migrations) {
      if (versions.has(migration.version)) {
        continue;
      }

      await db.execute('BEGIN TRANSACTION');

      try {
        for (const sql of migration.sql) {
          await db.execute(sql);
        }

        await db.run(
          `
          INSERT INTO schema_migrations
            (version, name, applied_at)
          VALUES (?, ?, ?)
          `,
          [
            migration.version,
            migration.name,
            Date.now()
          ]
        );

        await db.execute('COMMIT');
      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }
    }
  }
}
