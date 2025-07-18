import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, QueryList, ViewChild, ViewChildren, inject, AfterViewInit, OnDestroy, ChangeDetectorRef, PLATFORM_ID, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CustomFieldComponent } from '../../shared/components/custom-field/custom-field.component';
import { DeliveryOptions, PaymentOptions, ErrorMessages } from '../../core/constants/checkout.constants';
import { SummaryComponent } from '../../shared/components/summary/summary.component';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse } from '../../core/types/order.types';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentMethod } from '../../core/types/order.types';
import { Subject } from 'rxjs';
import { ScrollService } from '../../core/services/scroll.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private cdr = inject(ChangeDetectorRef);
  private scrollService = inject(ScrollService);
  private translationService = inject(TranslationService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  @ViewChild('checkoutForm') checkoutFormRef!: ElementRef;
  @ViewChildren('section0, section1, section2') sections!: QueryList<ElementRef>;

  activeTab = 0;
  showErrors = false;
  
  deliveryOptions = Object.entries(DeliveryOptions).map(([key, value]) => ({ value: key, label: value }));
  paymentOptions = Object.entries(PaymentOptions).map(([key, value]) => ({ value: key, label: value }));

  checkoutFormGroup: FormGroup = this.fb.group({
    deliveryType: ['', Validators.required],
    fullName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\+7\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/)]],
    email: ['', [Validators.required, Validators.email]],
    city: ['', Validators.required],
    address: ['', Validators.required],
    comment: [''],
    paymentMethod: ['', Validators.required]
  });

  ngAfterViewInit(): void {
    setTimeout(() => this.setupScrollListener(), 300);
  }

  private setupScrollListener(): void {
    if (!this.checkoutFormRef || !this.sections) return;
    
    const container = this.checkoutFormRef.nativeElement;
    const sectionsArray = this.sections.toArray();
    
    this.scrollService.setupScrollListener(container, sectionsArray, (index: number) => this.updateActiveTab(index), this.cdr);
  }
  
  private updateActiveTab(index: number): void {
    if (this.activeTab !== index) {
      this.activeTab = index;
      this.cdr.detectChanges();
    }
  }

  getErrorMessage(field: string): string | null {
    if (!this.showErrors) return null;
    const control = this.checkoutFormGroup.get(field);
    if (!control || !control.invalid) return null;

    if (control.errors?.['required']) return this.translationService.translate(ErrorMessages.required);
    if (control.errors?.['email']) return this.translationService.translate(ErrorMessages.email);
    if (control.errors?.['pattern']) return this.translationService.translate(ErrorMessages.pattern);

    return this.translationService.translate(ErrorMessages.invalid);
  }

  scrollToSection(sectionIndex: number): void {
    const section = this.sections.toArray()[sectionIndex];
    
    if (section) {
      this.updateActiveTab(sectionIndex);
      this.scrollService.scrollToSection(section);
    }
  }

  continueCheckout(): void {
    this.showErrors = true;
    this.cdr.detectChanges();

    if (this.checkoutFormGroup.valid) {
      const orderData = this.checkoutFormGroup.value;
      
      this.orderService.createOrder(orderData).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response: OrderResponse) => {
          if (orderData.paymentMethod === PaymentMethod.CRYPTO) {
            this.processCryptoPayment(response.orderId, orderData.email);
          }
        },
        error: (error) => {
          console.log(error);
        }
      });
    } else {
      this.scrollToFirstInvalidSection();
    }
  }

  private processCryptoPayment(orderId: number, email: string): void {
    const testAmount = 1; // 1 USDT test case

    this.paymentService.createCryptoPayment({
      orderId,
      amount: testAmount,
      email
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        if (response.paymentUrl) {
          if (isPlatformBrowser(this.platformId)) {
            window.location.href = response.paymentUrl;
          }
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
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
