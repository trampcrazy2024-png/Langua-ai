import { DatabaseManager } from '../DatabaseManager';

export abstract class BaseRepository {
  protected constructor(
    protected readonly database: DatabaseManager
  ) {}

  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected now(): number {
    return Date.now();
  }
}
