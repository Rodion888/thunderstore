import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() type: 'btn' | 'cross' | 'arrow-left' | 'arrow-right' = 'btn';
  @Input() text: string = '';

  @Output() buttonClick = new EventEmitter<void>();
  
  private platformId = inject(PLATFORM_ID);

  handleClick() {
    this.buttonClick.emit();
  }
  
  @HostListener('mousemove', ['$event'])
  handleMouseMove(event: MouseEvent) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const button = event.target as HTMLElement;
    const rect = button.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    button.style.setProperty('--x', `${x}%`);
    button.style.setProperty('--y', `${y}%`);
  }
}
