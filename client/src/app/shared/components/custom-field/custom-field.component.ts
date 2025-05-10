import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-field',
  templateUrl: './custom-field.component.html',
  styleUrls: ['./custom-field.component.scss'],
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomFieldComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() label: string = '';
  @Input() errorMessage: string | null = null;
  @Input() type: string = 'text';
  @Input() isPhone: boolean = false;

  value: string = '';

  private onChange: (value: string) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;
    
    if (this.isPhone) {
      inputValue = this.formatPhoneNumber(inputValue);
      input.value = inputValue;
    }
    
    this.value = inputValue;
    this.onChange(this.value);
  }

  handleBlur(): void {
    if (this.isPhone && this.value && !this.value.startsWith('+7')) {
      const formattedNumber = this.formatPhoneNumber(this.value);
      this.value = formattedNumber;
      this.onChange(this.value);
    }
    
    this.onTouchedCallback();
  }

  private formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '');
    
    if (!digits.length) {
      return '';
    }
    
    let phoneDigits;
    if (digits.startsWith('7') || digits.startsWith('8')) {
      phoneDigits = digits.substring(1);
    } else {
      phoneDigits = digits;
    }
    
    let result = '+7';
    
    if (phoneDigits.length > 0) {
      result += ' ' + phoneDigits.substring(0, Math.min(3, phoneDigits.length));
    }
    
    if (phoneDigits.length > 3) {
      result += ' ' + phoneDigits.substring(3, Math.min(6, phoneDigits.length));
    }
    
    if (phoneDigits.length > 6) {
      result += ' ' + phoneDigits.substring(6, Math.min(8, phoneDigits.length));
    }
    
    if (phoneDigits.length > 8) {
      result += ' ' + phoneDigits.substring(8, Math.min(10, phoneDigits.length));
    }
    
    return result;
  }
}
