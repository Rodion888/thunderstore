import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundService } from '../../core/services/background.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss'],
  imports: [CommonModule],
})
export class SuccessComponent implements OnInit {
  orderId: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private backgroundService: BackgroundService
  ) {}
  
  ngOnInit() {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
    
    this.backgroundService.setVideo('assets/videos/bg.mp4');
  }
  
  goToHome() {
    this.router.navigate(['/']);
  }
}
