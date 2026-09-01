export interface DatabaseRow {
  [key: string]: unknown;
}

export interface DatabaseResult {
  changes?: number | undefined;
  lastId?: number | undefined;
  values?: DatabaseRow[] | undefined;
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
