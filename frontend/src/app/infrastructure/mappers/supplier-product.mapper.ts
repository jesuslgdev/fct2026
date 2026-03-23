import {
  SupplierProduct,
  AddSupplierProductRequest,
  UpdateSupplierProductPriceRequest,
  ImportSupplierProductsRequest,
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
  static fromDto(dto: SupplierProductDto): SupplierProduct {
    return {
      supplierId: dto.product_id, 
      productId: dto.product_id,
      productCode: dto.product_code || '',
      productName: dto.product_name || '',
      categoryName: dto.category_name,
      supplierPrice: dto.supplier_price,
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(),
    };
  }

  static fromPageDto(dto: SupplierProductsPageDto, supplierId: number): {
    data: SupplierProduct[];
    total: number;
    page: number;
    pageSize: number;
  } {
    return {
      data: dto.items.map(item => ({
        ...this.fromDto(item),
        supplierId,
      })),
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

  static toImportResultDto(request: ImportSupplierProductsRequest): {
    products: { product_code: string; supplier_price: number }[];
  } {
    return {
      products: request.products.map(product => ({
        product_code: product.productCode,
        supplier_price: product.supplierPrice,
      })),
    };
  }

  static importResultFromDto(dto: ImportResultDto): ImportResult {
    return {
      total: dto.total,
      created: dto.created,
      errors: dto.error_detail.map(this.importErrorFromDto),
    };
  }

  static importErrorFromDto(dto: ImportErrorDto): ImportError {
    return {
      row: dto.row,
      reason: dto.reason,
    };
  }
}
