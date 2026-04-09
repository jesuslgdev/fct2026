import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { CategoriesStore } from '@features/categories/state/categories.store';
import { CategoryFormDialogComponent } from '@features/categories/components/category-form-dialog/category-form-dialog.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CategoriesStore],
  imports: [
    FormsModule,
    InputComponent,
    TableComponent,
    ButtonComponent,
    DialogComponent,
    CategoryFormDialogComponent,
  ],
  templateUrl: './categories.page.component.html',
})
export class CategoriesPageComponent implements OnInit {
  readonly store = inject(CategoriesStore);

  ngOnInit(): void {
    this.store.loadCategories();
  }
}
