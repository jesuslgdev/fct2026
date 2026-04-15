import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ActivateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number): Observable<void> {
    return this.userRepository.activateUser(id);
  }
}
