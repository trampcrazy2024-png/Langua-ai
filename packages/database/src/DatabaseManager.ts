import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection
} from '@capacitor-community/sqlite';

import type {
  DatabaseExecutor,
  DatabaseResult
} from './types';

export class DatabaseManager implements DatabaseExecutor {
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
    const connection = this.getConnection();

    const result = await connection.run(
      sql,
      values
    );

    return {
      changes:
        result.changes !== undefined
          ? Number(result.changes)
          : undefined
    };
  }

  async query(
    sql: string,
    values: unknown[] = []
  ): Promise<DatabaseResult> {
    const connection = this.getConnection();

    const result = await connection.query(
      sql,
      values
    );

    return {
      values:
        result.values !== undefined
          ? (result.values as DatabaseResult['values'])
          : undefined
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
