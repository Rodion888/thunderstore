import { Injectable, inject } from '@angular/core';
import { CONFIG_TOKEN } from '../tokens/config.token';

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
