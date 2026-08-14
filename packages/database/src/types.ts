export interface DatabaseRow {
  [key: string]: unknown;
}

export interface DatabaseResult {
  changes?: number;
  lastId?: number;
  values?: DatabaseRow[];
}

export interface Migration {
  version: number;
  name: string;
  up(database: DatabaseExecutor): Promise<void>;
}

export interface DatabaseExecutor {
  execute(
    sql: string,
    values?: unknown[]
  ): Promise<DatabaseResult>;

  query(
    sql: string,
    values?: unknown[]
  ): Promise<DatabaseResult>;
}
