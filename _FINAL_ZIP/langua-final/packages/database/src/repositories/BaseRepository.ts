import type { DatabaseManager } from '../DatabaseManager';

export abstract class BaseRepository {
  constructor(
    protected readonly database: DatabaseManager
  ) {}

  protected async query<T>(
    sql: string,
    values: unknown[] = []
  ): Promise<T[]> {
    const result = await this.database.query(
      sql,
      values
    );

    return (result.values ?? []) as T[];
  }

  protected async execute(
    sql: string,
    values: unknown[] = []
  ): Promise<void> {
    await this.database.execute(
      sql,
      values
    );
  }
}
