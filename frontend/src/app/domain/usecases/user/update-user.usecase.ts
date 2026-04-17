import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  User,
  UpdateUserPayload,
  isDepartmentRequiredForRole,
} from '@domain/models/user.model';
import { UserValidationError } from '@domain/models/user-errors';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number, payload: UpdateUserPayload): Observable<User> {
    const normalizedPayload: UpdateUserPayload = {
      ...(payload.firstName !== undefined && {
        firstName: payload.firstName?.trim() ?? null,
      }),
      ...(payload.lastName !== undefined && {
        lastName: payload.lastName?.trim() ?? null,
      }),
      ...(payload.role !== undefined && { role: payload.role }),
      ...(payload.departmentId !== undefined && { departmentId: payload.departmentId }),
    };

    try {
      this.validateId(id);
      this.validate(normalizedPayload);
    } catch (error) {
      return throwError(() => error);
    }

    return this.userRepository.updateUser(id, normalizedPayload);
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new UserValidationError({ field: 'id' }, 'User id must be a positive integer.');
    }
  }

  private validate(payload: UpdateUserPayload): void {
    if (payload.firstName !== undefined) {
      if (!payload.firstName) {
        throw new UserValidationError({ field: 'firstName' }, 'First name is required.');
      }

      if (payload.firstName.length > 100) {
        throw new UserValidationError(
          { field: 'firstName' },
          'First name cannot exceed 100 characters.',
        );
      }
    }

    if (payload.lastName !== undefined) {
      if (!payload.lastName) {
        throw new UserValidationError({ field: 'lastName' }, 'Last name is required.');
      }

      if (payload.lastName.length > 150) {
        throw new UserValidationError(
          { field: 'lastName' },
          'Last name cannot exceed 150 characters.',
        );
      }
    }

    if (payload.role === null) {
      throw new UserValidationError({ field: 'role' }, 'Role is required.');
    }

    if (
      payload.role !== undefined &&
      isDepartmentRequiredForRole(payload.role) &&
      payload.departmentId === null
    ) {
      throw new UserValidationError(
        { field: 'departmentId' },
        'Department is required for this role.',
      );
    }
  }
}
