import { Injectable, inject, PLATFORM_ID, DestroyRef } from "@angular/core";
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
  private destroyRef = inject(DestroyRef);

  private socket!: WebSocket;
  private eventsSubject = new Subject<WsData>();

  events$ = this.eventsSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connectWebSocket();
    }
    
    this.destroyRef.onDestroy(() => {
      if (this.socket) {
        this.socket.close();
      }
      this.eventsSubject.complete();
    });
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
