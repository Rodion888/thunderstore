import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CustomFieldComponent } from '../../shared/components/custom-field/custom-field.component';
import { DeliveryOptions, ErrorMessages, PaymentOptions } from '../../core/constants/checkout.constants';
import { SummaryComponent } from '../../shared/components/summary/summary.component';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    CustomFieldComponent,
    SummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cartService = inject(CartService);

  @ViewChild('checkoutForm') checkoutFormRef!: ElementRef;
  @ViewChildren('section0, section1, section2') sections!: QueryList<ElementRef>;

  activeTab = 0;
  showErrors = false;

  checkoutFormGroup: FormGroup = this.fb.group({
    deliveryType: ['', Validators.required],
    fullName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^(\+7|8)?\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/)]],
    email: ['', [Validators.required, Validators.email]],
    city: ['', Validators.required],
    address: ['', Validators.required],
    comment: [''],
    paymentMethod: ['', Validators.required],
  });

  deliveryOptions = Object.entries(DeliveryOptions).map(([value, label]) => ({ label, value }));
  paymentOptions = Object.entries(PaymentOptions).map(([value, label]) => ({ label, value }));

  getErrorMessage(field: string): string | null {
    if (!this.showErrors) return null;
    const control = this.checkoutFormGroup.get(field);
    if (!control || !control.invalid) return null;

    if (control.errors?.['required']) return ErrorMessages.required;
    if (control.errors?.['email']) return ErrorMessages.email;
    if (control.errors?.['pattern']) return ErrorMessages.pattern;

    return ErrorMessages.invalid;
  }

  scrollToSection(sectionIndex: number): void {
    const section = this.sections.toArray()[sectionIndex];
  
    if (section) {
      section.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      this.activeTab = sectionIndex;
    }
  }

  continueCheckout(): void {
    this.showErrors = true;

    if (this.checkoutFormGroup.valid) {
      const orderData = this.checkoutFormGroup.value;
      
      const cartItems = this.cartService.cartItems();
      const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  
      const paymentData = {
        amount: totalAmount.toFixed(2),
        description: orderData.fullName,
      };
    
      this.http.post<{ payment_url: string }>('/api/create-payment', paymentData).subscribe({
        next: (response) => {
          window.location.href = response.payment_url;
        },
      });
    } else {
      this.scrollToFirstInvalidSection();
    }
  }

  private scrollToFirstInvalidSection(): void {
    const invalidControls = Object.keys(this.checkoutFormGroup.controls).filter(
      key => this.checkoutFormGroup.get(key)?.invalid
    );

    if (!invalidControls.length) return;

    const sectionMapping: Record<string, number> = {
      deliveryType: 0,
      fullName: 1,
      phone: 1,
      email: 1,
      city: 1,
      address: 1,
      paymentMethod: 2,
    };

    const firstInvalidSection = Math.min(...invalidControls.map(key => sectionMapping[key]));

    this.scrollToSection(firstInvalidSection);
  }
}

export default CheckoutComponent;
