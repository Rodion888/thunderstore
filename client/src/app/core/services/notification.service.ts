import { Injectable, signal } from '@angular/core';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info'
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSignal = signal<Notification[]>([]);
  
  readonly notifications = this.notificationsSignal.asReadonly();
  
  success(message: string, duration = 5000): void {
    this.show(NotificationType.SUCCESS, message, duration);
  }
  
  error(message: string, duration = 8000): void {
    this.show(NotificationType.ERROR, message, duration);
  }
  
  info(message: string, duration = 5000): void {
    this.show(NotificationType.INFO, message, duration);
  }
  
  remove(id: string): void {
    this.notificationsSignal.update(notifications => 
      notifications.filter(notification => notification.id !== id)
    );
  }
  
  clear(): void {
    this.notificationsSignal.set([]);
  }
  
  private show(type: NotificationType, message: string, duration: number): void {
    const id = this.generateId();
    
    const notification: Notification = {
      id,
      type,
      message,
      duration
    };
    
    this.notificationsSignal.update(notifications => [...notifications, notification]);
    
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
} 