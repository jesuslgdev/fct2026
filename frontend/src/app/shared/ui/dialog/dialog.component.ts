import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  model,
  computed,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonComponent } from '@shared/ui/button/button.component';

// Dialog size types
export type DialogSize = 'sm' | 'default' | 'lg' | 'xl' | 'fullscreen';

// Dialog variant types - drives the header accent color
export type DialogVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

// Width mapping per size
const SIZE_WIDTH_MAP: Record<DialogSize, string> = {
  sm:         '28rem',
  default:    '36rem',
  lg:         '52rem',
  xl:         '72rem',
  fullscreen: '100vw',
};

// Variant -> icon + header accent class
const VARIANT_MAP: Record<DialogVariant, { icon: string; headerClass: string }> = {
  default: { icon: '',                           headerClass: '' },
  info:    { icon: 'pi pi-info-circle',          headerClass: 'text-info' },
  success: { icon: 'pi pi-check-circle',         headerClass: 'text-success' },
  warning: { icon: 'pi pi-exclamation-triangle', headerClass: 'text-warning' },
  danger:  { icon: 'pi pi-times-circle',         headerClass: 'text-danger' },
};

@Component({
  selector: 'ui-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, ButtonComponent],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  // Two-way visible binding
  visible = model<boolean>(false);

  // Inputs
  header         = input<string>('');                 // Dialog title
  variant        = input<DialogVariant>('default');   // Visual variant
  size           = input<DialogSize>('default');      // Dialog width preset
  modal          = input<boolean>(true);              // Backdrop overlay
  closable       = input<boolean>(true);              // Show close button
  closeOnEscape  = input<boolean>(true);              // Close on Escape key
  dismissable    = input<boolean>(false);             // Close on backdrop click
  draggable      = input<boolean>(false);             // Allow dragging
  resizable      = input<boolean>(false);             // Allow resizing
  styleClass     = input<string>('');                 // Extra class on dialog root

  // Footer action inputs (optional convenience shortcuts)
  confirmLabel   = input<string>('');                 // Confirm button label
  cancelLabel    = input<string>('');                 // Cancel button label
  confirmLoading = input<boolean>(false);             // Confirm button loading state
  confirmDisabled = input<boolean>(false);            // Confirm button disabled state
  closeOnConfirm = input<boolean>(true);              // Auto-close when confirm button is clicked

  // Outputs
  confirmed = output<void>();   // Emitted when confirm button is clicked
  cancelled = output<void>();   // Emitted when cancel button is clicked
  closed    = output<void>();   // Emitted when dialog is dismissed/closed

  // Computed
  dialogStyle = computed<Record<string, string>>(() => {
    const w = SIZE_WIDTH_MAP[this.size()];
    const base: Record<string, string> = { width: w };
    if (this.size() === 'fullscreen') {
      base['height'] = '100vh';
      base['maxHeight'] = '100vh';
    }
    return base;
  });

  variantOptions = computed(() => VARIANT_MAP[this.variant()]);

  hasFooterActions = computed(
    () => !!this.confirmLabel() || !!this.cancelLabel(),
  );

  // Handlers
  onHide(): void {
    this.visible.set(false);
    this.closed.emit();
  }

  onConfirm(): void {
    if (this.closeOnConfirm()) {
      this.visible.set(false);
    }
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.visible.set(false);
  }
}
