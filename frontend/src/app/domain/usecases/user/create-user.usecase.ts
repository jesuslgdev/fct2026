import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, CreateUserPayload } from '@domain/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CreateUserUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(payload: CreateUserPayload): Observable<User> {
    return this.userRepository.createUser(payload);
  }
}
