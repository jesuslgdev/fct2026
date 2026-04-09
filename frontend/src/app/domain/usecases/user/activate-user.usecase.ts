import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { ActivateUserPayload } from '@domain/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ActivateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number, payload: ActivateUserPayload): Observable<void> {
    return this.userRepository.activateUser(id, payload);
  }
}
