import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierProductRepository } from '@domain/repositories/supplier-product.repository';
import { DownloadSupplierProductTemplateRequest } from '@domain/models/supplier-product.model';
import { SupplierProductValidationError } from '@domain/models/supplier-product-errors';

@Injectable({ providedIn: 'root' })
export class DownloadTemplateUseCase {
  private readonly supplierProductRepository = inject(SupplierProductRepository);

  execute(
    supplierId: number,
    request?: DownloadSupplierProductTemplateRequest,
  ): Observable<Blob> {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new SupplierProductValidationError({ supplierId }, 'Invalid supplier ID.');
    }

    const productIds = this.normalizeProductIds(request?.productIds);

    return this.supplierProductRepository.downloadTemplate(
      supplierId,
      productIds ? { productIds } : undefined,
    );
  }

  private normalizeProductIds(productIds?: number[]): number[] | undefined {
    if (!productIds || productIds.length === 0) {
      return undefined;
    }

    const normalizedIds: number[] = [];
    const seenIds = new Set<number>();

    for (const productId of productIds) {
      if (!Number.isInteger(productId) || productId <= 0) {
        throw new SupplierProductValidationError({ productIds }, 'Invalid product ID.');
      }

      if (!seenIds.has(productId)) {
        seenIds.add(productId);
        normalizedIds.push(productId);
      }
    }

    return normalizedIds;
  }
}
