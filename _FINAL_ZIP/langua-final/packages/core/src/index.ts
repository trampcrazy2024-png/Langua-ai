export interface Disposable {
  dispose(): void | Promise<void>;
}

export interface HealthStatus {
  healthy: boolean;
  message?: string;
}

export interface AppService extends Disposable {
  initialize(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}
