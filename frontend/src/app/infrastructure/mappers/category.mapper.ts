import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryListResult,
} from '@domain/models/category.model';
import {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryListDto,
} from '@infrastructure/dtos/category.dto';

export class CategoryMapper {
  static fromDto(dto: CategoryDto): Category {
    return {
      categoryId: dto.category_id,
      name: dto.name,
      description: dto.description,
    };
  }

  static toCreateDto(payload: CreateCategoryPayload): CreateCategoryDto {
    return {
      name: payload.name,
      description: payload.description,
    };
  }

  static toUpdateDto(payload: UpdateCategoryPayload): UpdateCategoryDto {
    return {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.description !== undefined && { description: payload.description }),
    };
  }

  static fromListDto(dtos: CategoryListDto): CategoryListResult {
    return dtos.map(CategoryMapper.fromDto);
  }
}
