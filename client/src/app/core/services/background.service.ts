import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BackgroundService {
  private currentVideoSrc: string | null = null;

  setVideo(src: string) {
    this.currentVideoSrc = src;
  }

  getVideo(): string | null {
    return this.currentVideoSrc;
  }
}
