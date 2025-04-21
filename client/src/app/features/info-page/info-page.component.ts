import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-info-page',
  templateUrl: './info-page.component.html',
  styleUrls: ['./info-page.component.scss'],
  imports: [CommonModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['section'] && ['contact-us', 'terms', 'privacy'].includes(params['section'])) {
        setTimeout(() => {
          const element = document.getElementById(params['section']);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });
  }
}

export default InfoPageComponent;
