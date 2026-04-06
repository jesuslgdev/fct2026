import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetUserByIdUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(id: number): Observable<User> {
    return this.userRepository.getUserById(id);
  }
}
