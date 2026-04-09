export interface CategoryDto {
  category_id: number;
  name: string;
  description: string;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
}

export interface UpdateCategoryDto {
  name?: string | null;
  description?: string | null;
}

export type CategoryListDto = CategoryDto[];
