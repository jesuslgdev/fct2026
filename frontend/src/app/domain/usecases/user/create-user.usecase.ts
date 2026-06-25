import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import {
  User,
  CreateUserPayload,
  isDepartmentRequiredForRole,
} from '@domain/models/user.model';
import { UserValidationError } from '@domain/models/user-errors';
import { Observable, throwError } from 'rxjs';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

@Injectable({
  providedIn: 'root',
})
export class CreateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(payload: CreateUserPayload): Observable<User> {
    const normalizedPayload: CreateUserPayload = {
      firstName: payload.firstName?.trim() ?? '',
      lastName: payload.lastName?.trim() ?? '',
      email: payload.email?.trim() ?? '',
      role: payload.role,
      departmentId: payload.departmentId,
    };

    try {
      this.validate(normalizedPayload);
    } catch (error) {
      return throwError(() => error);
    }

    return this.userRepository.createUser(normalizedPayload);
  }

  private validate(payload: CreateUserPayload): void {
    if (!payload.firstName) {
      throw new UserValidationError({ field: 'firstName' }, 'First name is required.');
    }

    if (payload.firstName.length > 100) {
      throw new UserValidationError(
        { field: 'firstName' },
        'First name cannot exceed 100 characters.',
      );
    }

    if (!payload.lastName) {
      throw new UserValidationError({ field: 'lastName' }, 'Last name is required.');
    }

    if (payload.lastName.length > 150) {
      throw new UserValidationError(
        { field: 'lastName' },
        'Last name cannot exceed 150 characters.',
      );
    }

    if (!payload.email) {
      throw new UserValidationError({ field: 'email' }, 'Email is required.');
    }

    if (payload.email.length > 255 || !EMAIL_PATTERN.test(payload.email)) {
      throw new UserValidationError({ field: 'email' }, 'Enter a valid email address.');
    }

    if (!payload.role) {
      throw new UserValidationError({ field: 'role' }, 'Role is required.');
    }

    if (isDepartmentRequiredForRole(payload.role) && payload.departmentId === null) {
      throw new UserValidationError(
        { field: 'departmentId' },
        'Department is required for this role.',
      );
    }
  }
}
