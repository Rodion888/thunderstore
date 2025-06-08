import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss'],
  imports: [CommonModule, ButtonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessComponent {
  private router = inject(Router);

  goToHome() {
    this.router.navigate(['/']);
  }
}
