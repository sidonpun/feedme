// Общая типизация для всех конфигураций окружений Angular приложения.
export type EnvironmentConfig = {
  production: boolean;
  apiBaseUrl?: string;
};
