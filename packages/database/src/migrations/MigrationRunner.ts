import type { DatabaseManager } from '../DatabaseManager';
import type { Migration } from './Migration';

export class MigrationRunner {
  constructor(
    private readonly database: DatabaseManager
  ) {}

  async run(migrations: Migration[]): Promise<void> {
    await this.database.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    const result = await this.database.query(`
      SELECT version
      FROM schema_migrations
    `);

    const applied = new Set(
      (result.values ?? []).map(
        (row) => Number(row.version)
      )
    );

    const pending = [...migrations]
      .filter(
        (migration) => !applied.has(migration.version)
      )
      .sort(
        (a, b) => a.version - b.version
      );

    for (const migration of pending) {
      await this.database.transaction(
        async (database) => {
          await migration.up(database);

          await database.execute(
            `
              INSERT INTO schema_migrations
              (version, name, applied_at)
              VALUES (?, ?, ?)
            `,
            [
              migration.version,
              migration.name,
              new Date().toISOString()
            ]
          );
        }
      );
    }
  }
}
