export interface MigrationDatabase {
  execute(sql: string, values?: unknown[]): Promise<unknown>;
}

export interface Migration {
  version: number;
  name: string;
  up(database: MigrationDatabase): Promise<void>;
}
