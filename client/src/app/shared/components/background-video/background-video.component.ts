import { Component, ElementRef, Renderer2, ViewChild, inject, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { BackgroundService } from '../../../core/services/background.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-background-video',
  templateUrl: './background-video.component.html',
  styleUrls: ['./background-video.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundVideoComponent implements AfterViewInit {
  private renderer = inject(Renderer2);
  private backgroundService = inject(BackgroundService);

  @ViewChild('videoElement', { static: false }) videoElement?: ElementRef<HTMLVideoElement>;

  get videoSrc(): string | null {
    return this.backgroundService.getVideo();
  }

  ngAfterViewInit(): void {
    const videoSrc = this.backgroundService.getVideo();
    if (videoSrc && this.videoElement) {
      this.setupVideo();
    }
  }

  private setupVideo(): void {
    if (!this.videoElement) return;

    const videoEl = this.videoElement.nativeElement;
    
    videoEl.addEventListener('loadeddata', () => {
      this.renderer.addClass(videoEl, 'visible');
      this.renderer.addClass(document.body, 'video-loaded');
    });
  }
}
