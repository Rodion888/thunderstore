import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, QueryList, ViewChild, ViewChildren, inject, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
export class CheckoutComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('checkoutForm') checkoutFormRef!: ElementRef;
  @ViewChildren('section0, section1, section2') sections!: QueryList<ElementRef>;

  activeTab = 0;
  showErrors = false;
  
  private isScrollingProgrammatically = false;
  private lastScrollTop = 0;
  private scrollingDirection: 'up' | 'down' = 'down';
  private destroy$ = new Subject<void>();

  private readonly SCROLL_THRESHOLD = 50;
  private readonly VISIBLE_THRESHOLD = 20;
  private readonly MIDDLE_SECTION_THRESHOLD = 10;
  private readonly SCROLL_ANIMATION_DURATION = 500;
  
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollListener(): void {
    if (!this.checkoutFormRef || !this.sections) return;
    
    const container = this.checkoutFormRef.nativeElement;
    this.lastScrollTop = container.scrollTop;
    
    container.addEventListener('scroll', () => {
      if (this.isScrollingProgrammatically) return;
      
      const st = container.scrollTop;
      this.scrollingDirection = st > this.lastScrollTop ? 'down' : 'up';
      this.lastScrollTop = st;
      
      this.updateActiveTabBasedOnScroll(container);
    });
    
    setTimeout(() => this.updateActiveTabBasedOnScroll(container), 100);
  }
  
  private updateActiveTabBasedOnScroll(container: HTMLElement): void {
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    if (scrollTop < this.SCROLL_THRESHOLD) {
      return this.updateActiveTab(0);
    }
    
    if (this.scrollingDirection === 'down' && scrollTop + containerHeight >= container.scrollHeight - this.SCROLL_THRESHOLD) {
      return this.updateActiveTab(2);
    }
    
    const visibleSections = this.getVisibleSections(container);
    
    if (this.scrollingDirection === 'up' && visibleSections.some(s => s.index === 1 && s.visiblePercent >= this.MIDDLE_SECTION_THRESHOLD)) {
      return this.updateActiveTab(1);
    }
    
    if (visibleSections.length > 0) {
      const mostVisibleSection = visibleSections[0];
      if (mostVisibleSection.visiblePercent >= this.VISIBLE_THRESHOLD) {
        this.updateActiveTab(mostVisibleSection.index);
      }
    }
  }

  private getVisibleSections(container: HTMLElement): { index: number, visiblePercent: number }[] {
    const sectionsArray = this.sections.toArray();
    const containerRect = container.getBoundingClientRect();
    const result: { index: number, visiblePercent: number }[] = [];
    
    sectionsArray.forEach((section, index) => {
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

    if (control.errors?.['required']) return ErrorMessages.required;
    if (control.errors?.['email']) return ErrorMessages.email;
    if (control.errors?.['pattern']) return ErrorMessages.pattern;

    return ErrorMessages.invalid;
  }

  scrollToSection(sectionIndex: number): void {
    this.isScrollingProgrammatically = true;
    this.updateActiveTab(sectionIndex);
    
    const section = this.sections.toArray()[sectionIndex];
    
    if (section) {
      section.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
      setTimeout(() => {
        this.isScrollingProgrammatically = false;
      }, this.SCROLL_ANIMATION_DURATION);
    }
  }

  continueCheckout(): void {
    this.showErrors = true;
    this.cdr.detectChanges();

    if (this.checkoutFormGroup.valid) {
      const orderData = this.checkoutFormGroup.value;
      
      this.orderService.createOrder(orderData).subscribe({
        next: (response: OrderResponse) => {
          console.log('Order successfully created:', response);
          
          if (orderData.paymentMethod === PaymentMethod.CRYPTO) {
            this.processCryptoPayment(response.orderId, orderData.email);
          }
        },
        error: (error) => {
          console.error('Error creating order:', error);
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
    }).subscribe({
      next: (response) => {
        window.location.href = response.paymentUrl;
      },
      error: (error) => {
        console.error('Error creating crypto payment:', error);
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

export default CheckoutComponent;
