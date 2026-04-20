import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '@domain/repositories/warehouse.repository';
import {
  Warehouse,
  WarehouseAddress,
  UpdateWarehousePayload,
} from '@domain/models/warehouse.model';
import { Observable, throwError } from 'rxjs';
import { WarehouseValidationError } from '@domain/models/warehouse-errors';

@Injectable({
  providedIn: 'root',
})
export class UpdateWarehouseUseCase {
  private readonly warehouseRepository = inject(WarehouseRepository);

  private normalizeAddress(address: WarehouseAddress): WarehouseAddress {
    return {
      street: address.street?.trim() ?? '',
      city: address.city?.trim() ?? '',
      province: address.province?.trim() ?? '',
      postalCode: address.postalCode?.trim() ?? '',
    };
  }

  private validateAddress(address: WarehouseAddress): WarehouseValidationError | null {
    if (address.street.length === 0) {
      return new WarehouseValidationError('address.street', 'Street is required.');
    }
    if (address.street.length < 5 || address.street.length > 255) {
      return new WarehouseValidationError('address.street', 'Street must be between 5 and 255 characters.');
    }
    if (address.city.length === 0) {
      return new WarehouseValidationError('address.city', 'City is required.');
    }
    if (address.city.length > 100) {
      return new WarehouseValidationError('address.city', 'City cannot exceed 100 characters.');
    }
    if (address.province.length === 0) {
      return new WarehouseValidationError('address.province', 'Province is required.');
    }
    if (address.province.length > 100) {
      return new WarehouseValidationError('address.province', 'Province cannot exceed 100 characters.');
    }
    if (address.postalCode.length === 0) {
      return new WarehouseValidationError('address.postalCode', 'Postal code is required.');
    }
    if (address.postalCode.length > 10) {
      return new WarehouseValidationError('address.postalCode', 'Postal code cannot exceed 10 characters.');
    }

    return null;
  }

  execute(warehouseId: number, payload: UpdateWarehousePayload): Observable<Warehouse> {
    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
      return throwError(() => new WarehouseValidationError('warehouseId', 'Warehouse ID must be a positive integer.'));
    }

    const name = payload.name?.trim() ?? '';
    const address = this.normalizeAddress(payload.address);

    if (name.length === 0) {
      return throwError(() => new WarehouseValidationError('name', 'Name is required.'));
    }
    if (name.length < 2 || name.length > 100) {
      return throwError(() => new WarehouseValidationError('name', 'Name must be between 2 and 100 characters.'));
    }

    const addressError = this.validateAddress(address);
    if (addressError) {
      return throwError(() => addressError);
    }

    return this.warehouseRepository.updateWarehouse(warehouseId, { name, address });
  }
}
