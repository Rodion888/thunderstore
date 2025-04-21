import { Component, ElementRef, Renderer2, ViewChild, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BackgroundService } from '../../../core/services/background.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-background-video',
  templateUrl: './background-video.component.html',
  styleUrls: ['./background-video.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundVideoComponent implements OnInit {
  private renderer = inject(Renderer2);
  private backgroundService = inject(BackgroundService);
  private cd = inject(ChangeDetectorRef);

  @ViewChild('videoElement', { static: false }) videoElement?: ElementRef<HTMLVideoElement>;

  videoSrc: string | null = null;
  isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/chrome|crios/i.test(navigator.userAgent);

  ngOnInit(): void {
    if (this.isSafari) {
      return;
    }

    this.backgroundService.getVideo().subscribe((src) => {
      if (src) {
        this.videoSrc = src;
        this.cd.detectChanges();
        
        setTimeout(() => {
          if (this.videoElement) {
            this.renderer.addClass(this.videoElement.nativeElement, 'visible');
            this.renderer.addClass(document.body, 'video-loaded');
          }
        });
      }
    });
  }
}
