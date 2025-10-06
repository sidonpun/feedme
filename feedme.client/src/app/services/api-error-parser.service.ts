import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ApiRequestError, ApiRequestContext } from './api-request-error';

export interface CreateApiErrorParams {
  readonly method: string;
  readonly url: string;
  readonly payload?: unknown;
  readonly error: unknown;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorParserService {
  private static readonly correlationHeaderNames = [
    'request-id',
    'x-request-id',
    'x-correlation-id',
    'trace-id',
    'x-trace-id',
    'traceparent',
  ] as const;

  create(params: CreateApiErrorParams): ApiRequestError {
    if (params.error instanceof ApiRequestError) {
      return params.error;
    }

    const context: ApiRequestContext = {
      method: this.normalizeMethod(params.method),
      url: this.normalizeUrl(params.url),
      payloadPreview: this.formatPayload(params.payload),
    };

    if (params.error instanceof HttpErrorResponse) {
      return this.fromHttpError(context, params.error);
    }

    if (params.error instanceof Error) {
      const details = this.buildBaseDetails(context);
      details.push(`Причина: ${params.error.message}`);

      return new ApiRequestError(
        context,
        null,
        null,
        'Не удалось выполнить запрос к API.',
        details,
        params.error,
      );
    }

    return new ApiRequestError(
      context,
      null,
      null,
      'Не удалось выполнить запрос к API.',
      this.buildBaseDetails(context),
      params.error,
    );
  }

  private fromHttpError(context: ApiRequestContext, error: HttpErrorResponse): ApiRequestError {
    const status = Number.isFinite(error.status) ? error.status : null;
    const statusText = error.statusText?.trim() ? error.statusText.trim() : null;

    const details = this.buildBaseDetails(context);
    const now = new Date();
    details.push(`Время ошибки (UTC): ${now.toISOString()}`);
    details.push(`Часовой пояс браузера: ${this.formatTimezoneOffset(now)}`);

    const actualUrl = this.normalizeUrl(error.url ?? '');
    if (actualUrl && actualUrl !== context.url) {
      details.push(`Фактический URL: ${actualUrl}`);
    }

    if (status !== null) {
      const suffix = statusText ? ` (${statusText})` : '';
      details.push(`Код статуса: ${status}${suffix}`);
    } else {
      details.push('Код статуса: не определён');
    }

    const serverMessage = this.extractServerMessage(error.error);
    if (serverMessage) {
      details.push(`Сообщение сервера: ${serverMessage}`);
    }

    const responsePreview = this.formatPayload(error.error);
    if (responsePreview && responsePreview !== serverMessage) {
      details.push(`Ответ сервера (сырые данные): ${responsePreview}`);
    }

    const correlationHints = this.describeCorrelationIds(error.headers);
    details.push(...correlationHints);

    const retryHint = this.describeRetryAfter(error.headers);
    if (retryHint) {
      details.push(retryHint);
    }

    const networkHints = this.describeNetworkHints(error);
    details.push(...networkHints);

    const browserMessage = this.describeBrowserMessage(error.message);
    if (browserMessage) {
      details.push(browserMessage);
    }

    const userMessage = this.composeUserMessage(status, statusText, serverMessage, networkHints);

    return new ApiRequestError(context, status, statusText, userMessage, details, error);
  }

  private composeUserMessage(
    status: number | null,
    statusText: string | null,
    serverMessage: string | null,
    networkHints: readonly string[],
  ): string {
    if (status === 0) {
      return 'Браузер заблокировал запрос к API. Проверьте настройки CORS и доступность сервера.';
    }

    if (status !== null && status >= 500) {
      const suffix = statusText ? ` (${statusText})` : '';
      return `Сервер вернул внутреннюю ошибку${suffix ? suffix : ''}.`;
    }

    if (status !== null && status >= 400) {
      const suffix = statusText ? ` (${statusText})` : '';
      return `Сервер отклонил запрос${suffix ? suffix : ''}.`;
    }

    if (serverMessage) {
      return `Сервер вернул ошибку: ${serverMessage}`;
    }

    if (networkHints.length > 0) {
      return 'Не удалось выполнить запрос из-за сетевых ограничений.';
    }

    return 'Не удалось выполнить запрос к API.';
  }

  private buildBaseDetails(context: ApiRequestContext): string[] {
    const details = [`Метод: ${context.method}`, `URL: ${context.url}`];

    if (context.payloadPreview) {
      details.push(`Тело запроса: ${context.payloadPreview}`);
    }

    return details;
  }

  private describeNetworkHints(error: HttpErrorResponse): string[] {
    const hints: string[] = [];

    if (error.status === 0) {
      hints.push('Подсказка: статус 0 указывает на сетевую ошибку или блокировку CORS.');
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      hints.push('Подсказка: браузер сообщает об отсутствии подключения к интернету.');
    }

    if (error.url && error.url.startsWith('http://') && typeof window !== 'undefined') {
      const currentProtocol = window.location?.protocol ?? '';
      if (currentProtocol === 'https:') {
        hints.push('Подсказка: смешанный контент (https страница и http API) может блокироваться браузером.');
      }
    }

    return hints;
  }

  private describeCorrelationIds(headers: HttpHeaders | null | undefined): string[] {
    if (!headers) {
      return [];
    }

    const diagnostics: string[] = [];
    for (const name of ApiErrorParserService.correlationHeaderNames) {
      const value = this.getHeader(headers, name);
      if (value) {
        diagnostics.push(`Идентификатор запроса (${name.toLowerCase()}): ${value}`);
      }
    }

    if (diagnostics.length > 0) {
      diagnostics.push('Подсказка: сообщите идентификатор запроса службе поддержки для ускорения диагностики.');
    }

    return diagnostics;
  }

  private describeRetryAfter(headers: HttpHeaders | null | undefined): string | null {
    if (!headers) {
      return null;
    }

    const retryAfter = this.getHeader(headers, 'retry-after');
    if (!retryAfter) {
      return null;
    }

    const numeric = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(numeric)) {
      return `Подсказка: сервер рекомендует повторить запрос через ${numeric} секунд.`;
    }

    return `Подсказка: сервер рекомендует повторить запрос после ${retryAfter}.`;
  }

  private describeBrowserMessage(message: string | undefined): string | null {
    if (!message) {
      return null;
    }

    const normalized = message.trim();
    if (!normalized) {
      return null;
    }

    return `Сообщение браузера: ${normalized}`;
  }

  private getHeader(headers: HttpHeaders, name: string): string | null {
    const value = headers.get(name) ?? headers.get(name.toLowerCase()) ?? headers.get(name.toUpperCase());
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private extractServerMessage(payload: unknown): string | null {
    if (payload == null) {
      return null;
    }

    if (typeof payload === 'string') {
      const normalized = payload.trim();
      return normalized.length > 0 ? normalized : null;
    }

    if (typeof payload === 'object') {
      const message = this.tryExtractString(payload as Record<string, unknown>, [
        'message',
        'title',
        'error',
        'detail',
      ]);

      if (message) {
        return message;
      }

      if ('errors' in (payload as Record<string, unknown>)) {
        const errors = (payload as Record<string, unknown>)['errors'];
        if (errors && typeof errors === 'object') {
          const entries = Object.entries(errors as Record<string, unknown>);
          if (entries.length > 0) {
            return entries
              .map(([field, value]) => {
                if (Array.isArray(value)) {
                  return `${field}: ${value.filter(Boolean).join(', ')}`;
                }

                if (value && typeof value === 'object') {
                  return `${field}: ${this.formatPayload(value) ?? '[объект]'}`;
                }

                return `${field}: ${String(value)}`;
              })
              .join('; ');
          }
        }
      }
    }

    return null;
  }

  private tryExtractString(source: Record<string, unknown>, keys: readonly string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private formatPayload(payload: unknown): string | null {
    if (payload == null) {
      return null;
    }

    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      if (trimmed.length === 0) {
        return null;
      }

      return this.truncate(trimmed);
    }

    try {
      const serialized = JSON.stringify(payload);
      if (!serialized || serialized === '""') {
        return null;
      }

      return this.truncate(serialized);
    } catch {
      return null;
    }
  }

  private truncate(value: string, max = 280): string {
    if (value.length <= max) {
      return value;
    }

    return `${value.slice(0, max - 1)}…`;
  }

  private formatTimezoneOffset(date: Date): string {
    const totalMinutes = -date.getTimezoneOffset();
    const sign = totalMinutes >= 0 ? '+' : '-';
    const absolute = Math.abs(totalMinutes);
    const hours = Math.floor(absolute / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (absolute % 60)
      .toString()
      .padStart(2, '0');

    return `UTC${sign}${hours}:${minutes}`;
  }

  private normalizeMethod(method: string): string {
    if (typeof method === 'string') {
      const normalized = method.trim().toUpperCase();
      if (normalized.length > 0) {
        return normalized;
      }
    }

    return 'GET';
  }

  private normalizeUrl(url: string): string {
    if (typeof url === 'string') {
      const normalized = url.trim();
      if (normalized.length > 0) {
        return normalized;
      }
    }

    return 'не указан';
  }
}
