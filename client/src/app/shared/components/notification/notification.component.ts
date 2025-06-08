import { 
  Component, 
  inject, 
  computed, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  NotificationService, 
  Notification, 
  NotificationType 
} from '../../../core/services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  animations: [
    trigger('notificationAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent {
  private notificationService = inject(NotificationService);
  
  activeNotifications = this.notificationService.notifications;
  notificationTypes = NotificationType;
  
  showNotifications = computed(() => this.activeNotifications().length > 0);
  
  removeNotification(notification: Notification): void {
    this.notificationService.remove(notification.id);
  }
  
  getIconClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'bi bi-check-circle-fill';
      case NotificationType.ERROR:
        return 'bi bi-exclamation-circle-fill';
      case NotificationType.INFO:
        return 'bi bi-info-circle-fill';
      default:
        return 'bi bi-bell-fill';
    }
  }
}
