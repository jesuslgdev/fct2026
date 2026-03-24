import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductCategory,
} from '@domain/models/product.model';
import {
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  ProductCategoryDto,
} from '@infrastructure/dtos/product.dto';

export class ProductMapper {
  static fromDto(dto: ProductDto): Product {
    return {
      productId: dto.id,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      categoryId: dto.category_id,
      categoryName: dto.category_name,
      price: dto.price,
      stock: dto.stock,
      minStock: dto.min_stock,
      isActive: dto.is_active,
    };
  }

  static toCreateDto(payload: CreateProductPayload): CreateProductDto {
    return {
      code: payload.code,
      name: payload.name,
      description: payload.description,
      category_id: payload.categoryId,
      price: payload.price,
      stock: payload.stock,
      min_stock: payload.minStock,
    };
  }

  static toUpdateDto(payload: UpdateProductPayload): UpdateProductDto {
    const dto: UpdateProductDto = {};

    if (payload.name !== undefined && payload.name !== null) dto.name = payload.name;
    if (payload.description !== undefined && payload.description !== null) dto.description = payload.description;
    if (payload.categoryId !== undefined && payload.categoryId !== null) dto.category_id = payload.categoryId;
    if (payload.price !== undefined && payload.price !== null) dto.price = payload.price;
    if (payload.stock !== undefined && payload.stock !== null) dto.stock = payload.stock;
    if (payload.minStock !== undefined && payload.minStock !== null) dto.min_stock = payload.minStock;

    return dto;
  }

  static categoryFromDto(dto: ProductCategoryDto): ProductCategory {
    return {
      categoryId: dto.id,
      name: dto.name,
      description: dto.description,
    };
  }
}
