import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@domain/enums/user-role.enum';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@domain/models/category.model';
import { GetCategoriesUseCase } from '@domain/usecases/category/get-categories.usecase';
import { GetCategoryByIdUseCase } from '@domain/usecases/category/get-category-by-id.usecase';
import { CreateCategoryUseCase } from '@domain/usecases/category/create-category.usecase';
import { UpdateCategoryUseCase } from '@domain/usecases/category/update-category.usecase';
import { DeleteCategoryUseCase } from '@domain/usecases/category/delete-category.usecase';

export type DialogMode = 'create' | 'edit';

@Injectable()
export class CategoriesStore {
  private readonly authService = inject(AuthService);
  private readonly getCategoriesUseCase = inject(GetCategoriesUseCase);
  private readonly getCategoryByIdUseCase = inject(GetCategoryByIdUseCase);
  private readonly createCategoryUseCase = inject(CreateCategoryUseCase);
  private readonly updateCategoryUseCase = inject(UpdateCategoryUseCase);
  private readonly deleteCategoryUseCase = inject(DeleteCategoryUseCase);

  private readonly _categories = signal<Category[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _searchQuery = signal('');
  private readonly _selectedCategory = signal<Category | null>(null);
  private readonly _dialogVisible = signal(false);
  private readonly _dialogMode = signal<DialogMode>('create');
  private readonly _confirmDialogVisible = signal(false);
  private readonly _categoryToDelete = signal<Category | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();
  readonly dialogVisible = this._dialogVisible.asReadonly();
  readonly dialogMode = this._dialogMode.asReadonly();
  readonly confirmDialogVisible = this._confirmDialogVisible.asReadonly();
  readonly categoryToDelete = this._categoryToDelete.asReadonly();

  readonly canEdit = computed(() => {
    const user = this.authService.user();
    return user?.role === UserRole.Administrator || user?.role === UserRole.Manager;
  });

  readonly filteredCategories = computed(() => {
    const categories = this.categories();
    const query = this.searchQuery().toLowerCase();
    
    if (!query) return categories;
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      (category.description ?? '').toLowerCase().includes(query)
    );
  });

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error) {
      return err.message || fallback;
    }
    return fallback;
  }

  async loadCategories(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const categories = await firstValueFrom(this.getCategoriesUseCase.execute());
      this._categories.set(categories);
    } catch (err) {
      this._error.set(this.resolveErrorMessage(err, 'No se pudieron cargar las categorías.'));
    } finally {
      this._loading.set(false);
    }
  }

  async loadCategoryById(id: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const category = await firstValueFrom(this.getCategoryByIdUseCase.execute(id));
      this._selectedCategory.set(category);
    } catch (err) {
      this._error.set(this.resolveErrorMessage(err, 'No se pudo cargar la categoría.'));
    } finally {
      this._loading.set(false);
    }
  }

  openCreateDialog(): void {
    this._selectedCategory.set(null);
    this._dialogMode.set('create');
    this._error.set(null);
    this._dialogVisible.set(true);
  }

  openEditDialog(category: Category): void {
    this.loadCategoryForEdit(category.categoryId);
  }

  private async loadCategoryForEdit(categoryId: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const categoryData = await firstValueFrom(this.getCategoryByIdUseCase.execute(categoryId));
      this._selectedCategory.set(categoryData);
      this._dialogMode.set('edit');
      this._dialogVisible.set(true);
    } catch (err) {
      this._error.set('Error al cargar los datos de la categoría');
      console.error('Error loading category for edit:', err);
    } finally {
      this._loading.set(false);
    }
  }

  closeDialog(): void {
    this._dialogVisible.set(false);
    this._selectedCategory.set(null);
    this._error.set(null);
  }

  requestDelete(category: Category): void {
    this._categoryToDelete.set(category);
    this._error.set(null);
    this._confirmDialogVisible.set(true);
  }

  cancelDelete(): void {
    this._categoryToDelete.set(null);
    this._confirmDialogVisible.set(false);
    this._error.set(null);
  }

  async saveCategory(name: string, description: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      if (this._dialogMode() === 'edit' && this._selectedCategory()) {
        const payload: UpdateCategoryPayload = { name, description };
        const updated = await firstValueFrom(this.updateCategoryUseCase.execute(
          this._selectedCategory()!.categoryId,
          payload,
        ));
        this._categories.update((list) =>
          list.map((c) => (c.categoryId === updated.categoryId ? updated : c)),
        );
      } else {
        const payload: CreateCategoryPayload = { name, description };
        const created = await firstValueFrom(this.createCategoryUseCase.execute(payload));
        this._categories.update((list) => [...list, created]);
      }
      this.closeDialog();
    } catch (err) {
      this._error.set(this.resolveErrorMessage(err, 'No se pudo guardar la categoría.'));
    } finally {
      this._loading.set(false);
    }
  }

  async confirmDelete(): Promise<void> {
    const category = this._categoryToDelete();
    if (!category) return;
    
    this._loading.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(this.deleteCategoryUseCase.execute(category.categoryId));
      this._categories.update((list) =>
        list.filter((c) => c.categoryId !== category.categoryId),
      );
      this._confirmDialogVisible.set(false);
      this._categoryToDelete.set(null);
    } catch (err) {
      this._error.set(this.resolveErrorMessage(err, 'No se pudo eliminar la categoría.'));
    } finally {
      this._loading.set(false);
    }
  }

  onSearch(query: string): void {
    this._searchQuery.set(query);
  }


}
