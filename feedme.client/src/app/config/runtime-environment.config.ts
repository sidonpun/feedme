import type { EnvironmentConfig } from '../../environments/environment.model';

type FeedmeRuntimeWindow = Window & {
  __FEEDME_RUNTIME_CONFIG__?: unknown;
};

export type RuntimeEnvironmentConfig = Partial<EnvironmentConfig>;

const RUNTIME_CONFIG_ENDPOINT = '/assets/runtime-config.json' as const;

export async function loadRuntimeEnvironmentConfig(): Promise<RuntimeEnvironmentConfig> {
  const inlineConfig = readInlineRuntimeConfig();

  if (inlineConfig) {
    return inlineConfig;
  }

  const remoteConfig = await requestRuntimeConfig();

  if (remoteConfig) {
    return remoteConfig;
  }

  return {};
}

function readInlineRuntimeConfig(): RuntimeEnvironmentConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtimeWindow = window as FeedmeRuntimeWindow;
  const parsed = parseRuntimeConfig(runtimeWindow.__FEEDME_RUNTIME_CONFIG__);

  return hasRuntimeOverrides(parsed) ? parsed : null;
}

async function requestRuntimeConfig(): Promise<RuntimeEnvironmentConfig | null> {
  if (typeof fetch !== 'function') {
    return null;
  }

  try {
    const response = await fetch(RUNTIME_CONFIG_ENDPOINT, { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    const parsed = parseRuntimeConfig(await response.json());

    return hasRuntimeOverrides(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseRuntimeConfig(raw: unknown): RuntimeEnvironmentConfig {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }

  const input = raw as Record<string, unknown>;
  const config: RuntimeEnvironmentConfig = {};
  const apiBaseUrl = normalizeBaseUrl(input.apiBaseUrl);

  if (apiBaseUrl) {
    config.apiBaseUrl = apiBaseUrl;
  }

  return config;
}

function hasRuntimeOverrides(config: RuntimeEnvironmentConfig): boolean {
  return typeof config.apiBaseUrl === 'string';
}

function normalizeBaseUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}
