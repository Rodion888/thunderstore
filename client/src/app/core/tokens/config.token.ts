import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
}

export const CONFIG_TOKEN = new InjectionToken<AppConfig>('CONFIG_TOKEN', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: window['env']?.NG_APP_API_URL || 'http://localhost:3000',
    wsUrl: window['env']?.NG_APP_WS_URL || 'ws://localhost:3000',
  }),
});

