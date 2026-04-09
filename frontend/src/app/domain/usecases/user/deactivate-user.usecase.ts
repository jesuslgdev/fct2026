import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeactivateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number): Observable<void> {
    return this.userRepository.deactivateUser(id);
  }
}
