import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserValidationError } from '@domain/models/user-errors';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ActivateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number): Observable<void> {
    if (!Number.isInteger(id) || id <= 0) {
      return throwError(
        () => new UserValidationError({ field: 'id' }, 'User id must be a positive integer.'),
      );
    }

    return this.userRepository.activateUser(id);
  }
}
