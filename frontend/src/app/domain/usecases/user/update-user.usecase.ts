import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, UpdateUserPayload } from '@domain/models/user.model';
import { UserValidationError } from '@domain/models/user-errors';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number, payload: UpdateUserPayload): Observable<User> {
    if (!Number.isInteger(id) || id <= 0) {
      return throwError(
        () => new UserValidationError({ field: 'id' }, 'User id must be a positive integer.'),
      );
    }

    return this.userRepository.updateUser(id, payload);
  }
}
