import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, UserQueryParams, PagedResult } from '@domain/models/user.model';
import { UserValidationError } from '@domain/models/user-errors';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetUsersUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(params: UserQueryParams): Observable<PagedResult<User>> {
    const normalizedParams: UserQueryParams = {
      ...params,
      search: params.search?.trim() || undefined,
    };

    try {
      this.validate(normalizedParams);
    } catch (error) {
      return throwError(() => error);
    }

    return this.userRepository.getUsers(normalizedParams);
  }

  private validate(params: UserQueryParams): void {
    if (!Number.isInteger(params.page) || params.page < 1) {
      throw new UserValidationError({ field: 'page' }, 'Page must be a positive integer.');
    }

    if (!Number.isInteger(params.pageSize) || params.pageSize < 1 || params.pageSize > 100) {
      throw new UserValidationError(
        { field: 'pageSize' },
        'Page size must be between 1 and 100.',
      );
    }

    if (params.search && params.search.length > 255) {
      throw new UserValidationError(
        { field: 'search' },
        'Search cannot exceed 255 characters.',
      );
    }
  }
}
