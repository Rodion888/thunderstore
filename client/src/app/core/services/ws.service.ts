import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { Subject } from "rxjs";
import { WsData } from "../types/ws.types";
import { ConfigService } from "./config.service";
import { isPlatformBrowser } from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private config = inject(ConfigService);
  private platformId = inject(PLATFORM_ID);

  private socket!: WebSocket;
  private eventsSubject = new Subject<WsData>();

  events$ = this.eventsSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connectWebSocket();
    }
  }

  private connectWebSocket() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.socket = new WebSocket(this.config.wsUrl);

    this.socket.onmessage = (event) => {
      const data: WsData = JSON.parse(event.data);
      this.eventsSubject.next(data);
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }
}
