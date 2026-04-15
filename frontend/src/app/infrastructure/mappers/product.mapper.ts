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
  private static toNumber(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  static fromDto(dto: ProductDto): Product {
    const productId = dto.product_id ?? dto.id ?? 0;
    const code = dto.product_code ?? dto.code ?? '';
    const stock = dto.stock_current ?? dto.stock ?? 0;
    const minStock = dto.stock_min ?? dto.min_stock ?? 0;

    return {
      productId,
      code,
      name: dto.name,
      description: dto.description ?? '',
      categoryId: dto.category_id,
      categoryName: dto.category_name ?? '',
      price: ProductMapper.toNumber(dto.price),
      stock,
      minStock,
      isActive: dto.is_active,
    };
  }

  static toCreateDto(payload: CreateProductPayload): CreateProductDto {
    return {
      product_code: payload.code,
  code: payload.code,
      name: payload.name,
      description: payload.description,
      category_id: payload.categoryId,
      price: payload.price,
      vat_rate: 0.21,
      stock_current: payload.stock,
      stock_min: payload.minStock,
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
    if (payload.stock !== undefined && payload.stock !== null) {
      dto.stock_current = payload.stock;
      dto.stock = payload.stock;
    }
    if (payload.minStock !== undefined && payload.minStock !== null) dto.stock_min = payload.minStock;
    if (payload.minStock !== undefined && payload.minStock !== null) dto.min_stock = payload.minStock;

    return dto;
  }

  static categoryFromDto(dto: ProductCategoryDto): ProductCategory {
    return {
      categoryId: dto.category_id ?? dto.id ?? 0,
      name: dto.name,
      description: dto.description,
    };
  }
}
