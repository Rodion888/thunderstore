import { InjectionToken } from "@angular/core";
import { environment } from "../../../environments/environment";

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
}

export const CONFIG_TOKEN = new InjectionToken<AppConfig>('CONFIG_TOKEN', {
  providedIn: 'root',
  factory: () => environment
});
