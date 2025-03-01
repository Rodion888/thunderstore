import { Injectable, inject, signal } from '@angular/core';
import { CONFIG_TOKEN } from '../tokens/config.token';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly configSignal = signal(inject(CONFIG_TOKEN));

  get apiUrl(): string {
    return this.configSignal().apiUrl;
  }

  get wsUrl(): string {
    return this.configSignal().wsUrl;
  }
}
