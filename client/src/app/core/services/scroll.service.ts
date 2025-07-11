import { Injectable, ElementRef, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface VisibleSection {
  index: number;
  visiblePercent: number;
}

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down'
}

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  private platformId = inject(PLATFORM_ID);
  
  private isScrollingProgrammatically = false;
  private lastScrollTop = 0;
  private scrollingDirection: ScrollDirection = ScrollDirection.DOWN;
  
  readonly SCROLL_THRESHOLD = 50;
  readonly VISIBLE_THRESHOLD = 20;
  readonly MIDDLE_SECTION_THRESHOLD = 10;
  readonly SCROLL_ANIMATION_DURATION = 500;

  detectMobileDevice(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const userAgent = navigator.userAgent || '';
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  }

  setupScrollListener(
    container: HTMLElement, 
    sections: ElementRef[], 
    onActiveTabChange: (index: number) => void,
    cdr: ChangeDetectorRef
  ): void {
    if (!container || !sections?.length) return;
    
    this.lastScrollTop = container.scrollTop;
    
    container.addEventListener('scroll', () => {
      if (this.isScrollingProgrammatically) return;
      
      const st = container.scrollTop;
      this.scrollingDirection = st > this.lastScrollTop ? ScrollDirection.DOWN : ScrollDirection.UP;
      this.lastScrollTop = st;
      
      const activeTab = this.determineActiveTab(container, sections);
      if (activeTab !== null) {
        onActiveTabChange(activeTab);
        cdr.detectChanges();
      }
    });
    
    setTimeout(() => {
      const activeTab = this.determineActiveTab(container, sections);
      if (activeTab !== null) {
        onActiveTabChange(activeTab);
        cdr.detectChanges();
      }
    }, 100);
  }

  private determineActiveTab(container: HTMLElement, sections: ElementRef[]): number | null {
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const isMobile = this.detectMobileDevice();
    
    if (scrollTop < this.SCROLL_THRESHOLD) {
      return 0;
    }
    
    if (isMobile) {
      const visibleSections = this.getVisibleSections(container, sections);
      const threshold = 40;
      
      if (visibleSections.length > 0) {
        const mostVisibleSection = visibleSections[0];
        if (mostVisibleSection.index === 2 && mostVisibleSection.visiblePercent >= threshold && scrollTop + containerHeight > scrollHeight - containerHeight / 2) {
          return 2;
        }
        if (mostVisibleSection.visiblePercent >= threshold) {
          return mostVisibleSection.index;
        }
      }
      
      if (this.scrollingDirection === ScrollDirection.UP && visibleSections.some(s => s.index === 1 && s.visiblePercent >= this.MIDDLE_SECTION_THRESHOLD)) {
        return 1;
      }
    } else {
      if (this.scrollingDirection === ScrollDirection.DOWN && scrollTop + containerHeight >= scrollHeight - this.SCROLL_THRESHOLD) {
        return 2;
      }
      
      const visibleSections = this.getVisibleSections(container, sections);

      if (this.scrollingDirection === ScrollDirection.UP && visibleSections.some(s => s.index === 1 && s.visiblePercent >= this.MIDDLE_SECTION_THRESHOLD)) {
        return 1;
      }
      
      if (visibleSections.length > 0) {
        const mostVisibleSection = visibleSections[0];
        if (mostVisibleSection.visiblePercent >= this.VISIBLE_THRESHOLD) {
          return mostVisibleSection.index;
        }
      }
    }
    
    return null;
  }

  private getVisibleSections(container: HTMLElement, sections: ElementRef[]): VisibleSection[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }
    
    const containerRect = container.getBoundingClientRect();
    const result: VisibleSection[] = [];
    
    sections.forEach((section, index) => {
      const element = section.nativeElement;
      const rect = element.getBoundingClientRect();
      
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      
      if (visibleBottom > visibleTop) {
        const visibleHeight = visibleBottom - visibleTop;
        const percentVisible = (visibleHeight / rect.height) * 100;
        
        result.push({ index, visiblePercent: percentVisible });
      }
    });
    
    return result.sort((a, b) => b.visiblePercent - a.visiblePercent);
  }

  scrollToSection(section: ElementRef, callback?: () => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      if (callback) callback();
      return;
    }
    
    this.isScrollingProgrammatically = true;
    
    section.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
    
    setTimeout(() => {
      this.isScrollingProgrammatically = false;
      if (callback) callback();
    }, this.SCROLL_ANIMATION_DURATION);
  }
} 