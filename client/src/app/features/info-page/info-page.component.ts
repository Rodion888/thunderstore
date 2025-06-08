import { ChangeDetectionStrategy, Component, inject, OnInit, AfterViewInit, ViewChild, ViewChildren, QueryList, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-info-page',
  templateUrl: './info-page.component.html',
  styleUrls: ['./info-page.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoPageComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private scrollService = inject(ScrollService);

  @ViewChild('mainContent') mainContentRef!: ElementRef;
  @ViewChildren('sectionRef') sectionRefs!: QueryList<ElementRef>;

  sections = [
    { id: 'contact-us', title: 'Contact Us' },
    { id: 'terms', title: 'Terms' },
    { id: 'privacy', title: 'Privacy' }
  ];
  activeSectionIndex = 0;

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['section'] && ['contact-us', 'terms', 'privacy'].includes(params['section'])) {
        setTimeout(() => {
          const sectionIndex = this.sections.findIndex(s => s.id === params['section']);
          if (sectionIndex !== -1 && this.sectionRefs) {
            const sectionRef = this.sectionRefs.toArray()[sectionIndex];
            if (sectionRef) {
              this.scrollService.scrollToSection(sectionRef);
              this.activeSectionIndex = sectionIndex;
            }
          }
        }, 100);
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.setupScrollListener(), 300);
  }

  private setupScrollListener(): void {
    if (!this.mainContentRef || !this.sectionRefs) return;
    
    const container = this.mainContentRef.nativeElement;
    const sectionsArray = this.sectionRefs.toArray();
    
    this.scrollService.setupScrollListener(
      container,
      sectionsArray,
      (index: number) => this.updateActiveTab(index),
      this.cdr
    );
  }
  
  private updateActiveTab(index: number): void {
    if (this.activeSectionIndex !== index) {
      this.activeSectionIndex = index;
      this.cdr.detectChanges();
    }
  }

  scrollToSection(id: string, event: Event) {
    event.preventDefault();
    
    const sectionIndex = this.sections.findIndex(s => s.id === id);
    if (sectionIndex !== -1) {
      if (id === 'contact-us') {
        this.mainContentRef.nativeElement.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        this.updateActiveTab(sectionIndex);
      } else {
        const sectionRef = this.sectionRefs.toArray()[sectionIndex];
        if (sectionRef) {
          this.updateActiveTab(sectionIndex);
          this.scrollService.scrollToSection(sectionRef);
        }
      }
    }
  }
}

export default InfoPageComponent;
