export interface Category {
  categoryId: number;
  name: string;
  description: string;
}

export interface CreateCategoryPayload {
  name: string;       
  description: string; 
}

export interface UpdateCategoryPayload {
  name?: string | null;       
  description?: string | null;
}

export type CategoryListResult = Category[];
