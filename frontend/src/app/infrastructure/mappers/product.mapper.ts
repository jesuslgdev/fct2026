import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductCategory,
  ProductSupplier,
  ProductStockByWarehouse,
} from '@domain/models/product.model';
import {
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  ProductCategoryDto,
  ProductSupplierDto,
  ProductWarehouseStockDto,
} from '@infrastructure/dtos/product.dto';

export class ProductMapper {
  private static toNumber(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private static toWarehouseStatus(currentStock: number, minStock: number): ProductStockByWarehouse['status'] {
    if (currentStock <= 0) {
      return 'out';
    }

    if (minStock <= 0) {
      return 'normal';
    }

    const criticalThreshold = Math.max(1, Math.floor(minStock / 2));
    if (currentStock <= criticalThreshold) {
      return 'critical';
    }

    if (currentStock < minStock) {
      return 'low';
    }

    return 'normal';
  }

  static supplierFromDto(dto: ProductSupplierDto): ProductSupplier {
    return {
      supplierId: dto.supplier_id ?? dto.supplierId ?? 0,
      supplierName: dto.supplier_name ?? dto.supplierName ?? 'Proveedor',
      supplierPrice: ProductMapper.toNumber(dto.supplier_price ?? dto.supplierPrice ?? 0),
    };
  }

  static stockByWarehouseFromDto(
    dto: ProductWarehouseStockDto,
    fallbackMinStock: number,
  ): ProductStockByWarehouse {
    const currentStock = typeof dto.available_stock === 'number'
      ? dto.available_stock
      : typeof dto.stock === 'number'
        ? dto.stock
        : 0;

    const minStock = fallbackMinStock;

    return {
      warehouseId: ProductMapper.toNumber(dto.warehouse_id),
      warehouseName: dto.warehouse_name,
      currentStock,
      minStock,
      status: ProductMapper.toWarehouseStatus(currentStock, minStock),
    };
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
      suppliers: Array.isArray(dto.suppliers)
        ? dto.suppliers.map(ProductMapper.supplierFromDto)
        : undefined,
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
    if (payload.minStock !== undefined && payload.minStock !== null) {
      dto.stock_min = payload.minStock;
      dto.min_stock = payload.minStock;
    }

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
