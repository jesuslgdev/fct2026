import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { CategoriesStore } from '@features/categories/state/categories.store';

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogComponent, InputComponent],
  templateUrl: './category-form-dialog.component.html',
})
export class CategoryFormDialogComponent {
  readonly store = inject(CategoriesStore);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  get name() { return this.form.controls.name; }
  get description() { return this.form.controls.description; }

  readonly confirmLabel = 'Guardar';

  getDialogTitle(): string {
    const mode = this.store.dialogMode();
    if (mode === 'create') return 'Nueva categoría';
    if (mode === 'edit') return 'Editar categoría';
    return 'Categoría';
  }

  constructor() {
    effect(() => {
      const category = this.store.selectedCategory();
      const mode = this.store.dialogMode();
      if (category && mode === 'edit') {
        this.form.patchValue({
          name: category.name,
          description: category.description,
        });
      } else {
        this.form.reset();
      }
    });
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.store.saveCategory(v.name!, v.description ?? '');
  }

  onCancel(): void {
    this.store.closeDialog();
  }
}
