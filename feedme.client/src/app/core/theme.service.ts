import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'feedme.theme';
  private readonly mediaQuery: MediaQueryList | null;
  private current: ThemeMode;

  constructor(@Inject(DOCUMENT) private readonly documentRef: Document) {
    this.mediaQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    this.current = this.resolveInitialTheme();
    this.applyTheme(this.current, false);

    if (this.mediaQuery) {
      if (typeof this.mediaQuery.addEventListener === 'function') {
        this.mediaQuery.addEventListener('change', this.handleMediaChange);
      } else if (typeof this.mediaQuery.addListener === 'function') {
        this.mediaQuery.addListener(this.handleMediaChange);
      }
    }
  }

  setDark(on: boolean): void {
    this.setTheme(on ? 'dark' : 'light');
  }

  setTheme(theme: ThemeMode, persist: boolean = true): void {
    if (this.current === theme) {
      return;
    }

    this.applyTheme(theme, persist);
  }

  toggle(): ThemeMode {
    const next = this.current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  private applyTheme(theme: ThemeMode, persist: boolean): void {
    const root = this.documentRef.documentElement;
    root.setAttribute('data-theme', theme);
    this.current = theme;

    if (!persist) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
      // no-op when storage is unavailable
    }
  }

  private resolveInitialTheme(): ThemeMode {
    const stored = this.readStoredPreference();
    if (stored) {
      return stored;
    }

    if (this.mediaQuery?.matches) {
      return 'dark';
    }

    const attr = this.documentRef.documentElement.getAttribute('data-theme');
    return attr === 'dark' ? 'dark' : 'light';
  }

  private readStoredPreference(): ThemeMode | null {
    try {
      const value = localStorage.getItem(this.storageKey);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      return null;
    }
  }

  private handleMediaChange = (event: MediaQueryListEvent): void => {
    if (this.readStoredPreference()) {
      return;
    }
    this.applyTheme(event.matches ? 'dark' : 'light', false);
  };
}
