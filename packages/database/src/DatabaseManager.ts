import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection
} from '@capacitor-community/sqlite';

export interface DatabaseResult {
  values?: Array<Record<string, unknown>>;
  changes?: {
    changes?: number;
    lastId?: number;
  };
}

export class DatabaseManager {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private connection: SQLiteDBConnection | null = null;

  private readonly databaseName = 'linguaai.db';
  private readonly version = 1;

  async initialize(): Promise<void> {
    if (this.connection) {
      return;
    }

    this.connection = await this.sqlite.createConnection(
      this.databaseName,
      false,
      'no-encryption',
      this.version,
      false
    );

    await this.connection.open();
  }

  private getConnection(): SQLiteDBConnection {
    if (!this.connection) {
      throw new Error('Database has not been initialized');
    }

    return this.connection;
  }

  async execute(
    sql: string,
    values: unknown[] = []
  ): Promise<DatabaseResult> {
    const result = await this.getConnection().run(sql, values);

    return {
      values: result.values as Array<Record<string, unknown>> | undefined,
      changes: result.changes
    };
  }

  async query(
    sql: string,
    values: unknown[] = []
  ): Promise<DatabaseResult> {
    const result = await this.getConnection().query(sql, values);

    return {
      values: result.values as Array<Record<string, unknown>> | undefined
    };
  }

  async transaction(
    callback: (database: DatabaseManager) => Promise<void>
  ): Promise<void> {
    const connection = this.getConnection();

    await connection.beginTransaction();

    try {
      await callback(this);
      await connection.commitTransaction();
    } catch (error) {
      await connection.rollbackTransaction();
      throw error;
    }
  }

  async close(): Promise<void> {
    if (!this.connection) {
      return;
    }

    await this.sqlite.closeConnection(
      this.databaseName,
      false
    );

    this.connection = null;
  }
}
