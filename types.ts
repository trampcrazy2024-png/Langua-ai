export interface QueryResult<T = unknown> {
  values: T[];
  changes?: {
    changes?: number;
    lastId?: number;
  };
}

export interface Migration {
  version: number;
  name: string;
  up(): Promise<void>;
}
