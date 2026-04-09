import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportResult,
  ImportError,
  ProductSupplier,
  PagedResult,
} from '@domain/models/supplier-product.model';
import {
  SupplierProductDto,
  AddSupplierProductDto,
  UpdateSupplierProductPriceDto,
  SupplierProductsPageDto,
  ProductSupplierDto,
  ProductSuppliersPageDto,
  ImportErrorDto,
  ImportResultDto,
} from '@infrastructure/dtos/supplier-product.dto';

export class SupplierProductMapper {
  private static toNumber(value: number | string): number {
    const parsed = typeof value === 'string' ? Number(value) : value;

    if (!Number.isFinite(parsed)) {
      throw new Error('Invalid decimal value received from API.');
    }

    return parsed;
  }

  static fromDto(dto: SupplierProductDto): SupplierProduct {
    return {
      productId: dto.product_id,
      productCode: dto.product_code ?? null,
      productName: dto.product_name ?? null,
      categoryName: dto.category_name ?? null,
      supplierPrice: this.toNumber(dto.supplier_price),
    };
  }

  static fromSupplierProductsPageDto(dto: SupplierProductsPageDto): PagedResult<SupplierProduct> {
    return {
      data: dto.items.map((item) => this.fromDto(item)),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    };
  }

  static fromProductSupplierDto(dto: ProductSupplierDto): ProductSupplier {
    return {
      supplierId: dto.supplier_id,
      supplierName: dto.supplier_name,
      taxId: dto.tax_id,
      supplierPrice: this.toNumber(dto.supplier_price),
    };
  }

  static fromProductSuppliersPageDto(dto: ProductSuppliersPageDto): PagedResult<ProductSupplier> {
    return {
      data: dto.items.map((item) => this.fromProductSupplierDto(item)),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    };
  }

  static toAddDto(request: AddSupplierProductRequest): AddSupplierProductDto {
    return {
      product_id: request.productId,
      supplier_price: request.supplierPrice,
    };
  }

  static toUpdateDto(request: UpdateSupplierProductPriceRequest): UpdateSupplierProductPriceDto {
    return {
      supplier_price: request.supplierPrice,
    };
  }

  static importResultFromDto(dto: ImportResultDto): ImportResult {
    return {
      total: dto.total,
      created: dto.created,
      errors: dto.errors,
      error_detail: dto.error_detail.map((item) => this.importErrorFromDto(item)),
    };
  }

  static importErrorFromDto(dto: ImportErrorDto): ImportError {
    return {
      row: dto.row,
      reason: dto.reason,
    };
  }
}
