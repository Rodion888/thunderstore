import { Component, ElementRef, Renderer2, AfterViewInit, ViewChild, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BackgroundService } from '../../../core/services/background.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-background-video',
  templateUrl: './background-video.component.html',
  styleUrls: ['./background-video.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundVideoComponent implements OnInit, AfterViewInit {
  private renderer = inject(Renderer2);
  private backgroundService = inject(BackgroundService);
  private cd = inject(ChangeDetectorRef);

  @ViewChild('videoElement', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  videoSrc: string | null = null;

  ngOnInit(): void {
    this.backgroundService.getVideo().subscribe((src) => {
      if (src) {
        this.videoSrc = src;
        this.cd.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.videoElement) {
      this.renderer.listen(this.videoElement.nativeElement, 'loadeddata', () => {
        this.renderer.setStyle(this.videoElement.nativeElement, 'opacity', '1');
        this.renderer.setStyle(this.videoElement.nativeElement, 'transition', 'opacity 0.5s ease-in-out');
      });
    }
  }
}
