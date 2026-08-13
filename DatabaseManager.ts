import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

export class DatabaseManager {
  private readonly sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;

  private readonly databaseName = 'lingua_assistant';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    const consistency = await this.sqlite.checkConnectionsConsistency();

    if (!consistency.result) {
      await this.sqlite.closeAllConnections();
    }

    const connected = await this.sqlite.isConnection(
      this.databaseName,
      false
    );

    if (connected.result) {
      this.db = await this.sqlite.retrieveConnection(
        this.databaseName,
        false
      );
    } else {
      this.db = await this.sqlite.createConnection(
        this.databaseName,
        false,
        'no-encryption',
        1,
        false
      );
    }

    await this.db.open();
  }

  getConnection(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database has not been initialized');
    }

    return this.db;
  }

  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    await this.db.close();
    this.db = null;
  }

  async execute(sql: string): Promise<void> {
    await this.getConnection().execute(sql);
  }

  async query<T = unknown>(
    sql: string,
    values: unknown[] = []
  ): Promise<T[]> {
    const result = await this.getConnection().query(sql, values);
    return (result.values ?? []) as T[];
  }

  async run(
    sql: string,
    values: unknown[] = []
  ): Promise<void> {
    await this.getConnection().run(sql, values);
  }
}
