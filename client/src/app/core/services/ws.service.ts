import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { WsData } from "../types/ws.types";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket!: WebSocket;
  private eventsSubject = new Subject<WsData>();

  events$ = this.eventsSubject.asObservable();

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    this.socket = new WebSocket(environment.wsUrl);

    this.socket.onmessage = (event) => {
      const data: WsData = JSON.parse(event.data);
      this.eventsSubject.next(data);
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }
}
