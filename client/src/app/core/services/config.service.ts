import { Injectable, InjectionToken, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
}

export const CONFIG_TOKEN = new InjectionToken<AppConfig>('CONFIG_TOKEN', {
  providedIn: 'root',
  factory: () => environment
});

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly config = inject(CONFIG_TOKEN);

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get wsUrl(): string {
    return this.config.wsUrl;
  }
}
