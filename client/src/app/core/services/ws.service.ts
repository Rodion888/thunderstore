import { Injectable, inject } from "@angular/core";
import { Subject } from "rxjs";
import { WsData } from "../types/ws.types";
import { ConfigService } from "./config.service";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private config = inject(ConfigService);

  private socket!: WebSocket;
  private eventsSubject = new Subject<WsData>();

  events$ = this.eventsSubject.asObservable();

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
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
