import { Injectable, computed, inject, signal } from '@angular/core';
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

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly selectedCategory = signal<Category | null>(null);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<DialogMode>('create');
  readonly confirmDialogVisible = signal(false);
  readonly categoryToDelete = signal<Category | null>(null);

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
    this.loading.set(true);
    this.error.set(null);
    try {
      const categories = await this.getCategoriesUseCase.execute();
      this.categories.set(categories);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load categories.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategoryById(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const category = await this.getCategoryByIdUseCase.execute(id);
      this.selectedCategory.set(category);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to load category.'));
    } finally {
      this.loading.set(false);
    }
  }

  openCreateDialog(): void {
    this.selectedCategory.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  openEditDialog(category: Category): void {
    this.loadCategoryForEdit(category.categoryId);
  }

  private async loadCategoryForEdit(categoryId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const categoryData = await this.getCategoryByIdUseCase.execute(categoryId);
      this.selectedCategory.set(categoryData);
      this.dialogMode.set('edit');
      this.dialogVisible.set(true);
    } catch (err) {
      this.error.set('Error loading category data');
      console.error('Error loading category for edit:', err);
    } finally {
      this.loading.set(false);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedCategory.set(null);
  }

  requestDelete(category: Category): void {
    this.categoryToDelete.set(category);
    this.error.set(null);
    this.confirmDialogVisible.set(true);
  }

  cancelDelete(): void {
    this.categoryToDelete.set(null);
    this.confirmDialogVisible.set(false);
    this.error.set(null);
  }

  async saveCategory(name: string, description: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.dialogMode() === 'edit' && this.selectedCategory()) {
        const payload: UpdateCategoryPayload = { name, description };
        const updated = await this.updateCategoryUseCase.execute(
          this.selectedCategory()!.categoryId,
          payload,
        );
        this.categories.update((list) =>
          list.map((c) => (c.categoryId === updated.categoryId ? updated : c)),
        );
      } else {
        const payload: CreateCategoryPayload = { name, description };
        const created = await this.createCategoryUseCase.execute(payload);
        this.categories.update((list) => [...list, created]);
      }
      this.closeDialog();
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to save category.'));
    } finally {
      this.loading.set(false);
    }
  }

  async confirmDelete(): Promise<void> {
    const category = this.categoryToDelete();
    if (!category) return;
    
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.deleteCategoryUseCase.execute(category.categoryId);
      this.categories.update((list) =>
        list.filter((c) => c.categoryId !== category.categoryId),
      );
      this.confirmDialogVisible.set(false);
      this.categoryToDelete.set(null);
    } catch (err) {
      this.error.set(this.resolveErrorMessage(err, 'Failed to delete category.'));
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

}
