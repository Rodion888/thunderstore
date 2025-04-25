import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundService } from '../../core/services/background.service';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss'],
})
export class SuccessComponent implements OnInit {
  orderId: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private backgroundService: BackgroundService
  ) {}
  
  ngOnInit() {
    // Получаем orderId из параметров URL
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
    
    // Установить видео фон
    this.backgroundService.setVideo('assets/videos/bg.mp4');
  }
  
  // Вернуться на главную страницу
  goToHome() {
    this.router.navigate(['/']);
  }
}
