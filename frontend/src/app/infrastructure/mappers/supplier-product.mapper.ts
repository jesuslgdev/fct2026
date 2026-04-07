import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportResult,
  ImportError,
} from '@domain/models/supplier-product.model';
import {
  SupplierProductDto,
  AddSupplierProductDto,
  UpdateSupplierProductPriceDto,
  SupplierProductsPageDto,
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

  static fromPageDto(dto: SupplierProductsPageDto): SupplierProduct[] {
    return dto.items.map((item) => this.fromDto(item));
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
