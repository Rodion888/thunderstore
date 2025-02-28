import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BackgroundService {
  private videoSrc$ = new BehaviorSubject<string | null>(null);

  setVideo(src: string) {
    this.videoSrc$.next(src);
  }

  getVideo() {
    return this.videoSrc$.asObservable();
  }
}
