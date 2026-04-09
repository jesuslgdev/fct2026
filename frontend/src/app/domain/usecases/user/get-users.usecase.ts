import { Injectable, inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, UserQueryParams, PagedResult } from '@domain/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetUsersUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(params: UserQueryParams): Observable<PagedResult<User>> {
    return this.userRepository.getUsers(params);
  }
}
