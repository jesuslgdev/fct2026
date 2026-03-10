import { inject } from '@angular/core';
import { UserRepository } from '@domain/repositories/user.repository';
import { User, UserQueryParams, PagedResult } from '@domain/models/user.model';

export class GetUsersUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(params: UserQueryParams): Promise<PagedResult<User>> {
    return this.userRepository.getUsers(params);
  }
}
