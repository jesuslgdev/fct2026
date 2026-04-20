import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { HttpUserRepository } from './user.repository.http';
import {
  UserAlreadyActiveError,
  UserDeletedError,
  UserDepartmentRequiredError,
} from '@domain/models/user-errors';
import { UserRole } from '@domain/enums/user-role.enum';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/admin/users`;

describe('HttpUserRepository', () => {
  let repo: HttpUserRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpUserRepository],
    });

    repo = TestBed.inject(HttpUserRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('activates a user without sending a payload', async () => {
    const promise = firstValueFrom(repo.activateUser(1));
    const req = controller.expectOne(`${BASE_URL}/1/activate`);

    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeNull();
  });

  it('deletes a user', async () => {
    const promise = firstValueFrom(repo.deleteUser(1));
    const req = controller.expectOne(`${BASE_URL}/1`);

    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeNull();
  });

  it('maps already active conflicts', async () => {
    const promise = firstValueFrom(repo.activateUser(1));

    controller.expectOne(`${BASE_URL}/1/activate`).flush(
      { message: 'User is already active', error_code: 1206 },
      { status: 409, statusText: 'Conflict' },
    );

    await expect(promise).rejects.toBeInstanceOf(UserAlreadyActiveError);
  });

  it('maps deleted user conflicts', async () => {
    const promise = firstValueFrom(repo.deleteUser(1));

    controller.expectOne(`${BASE_URL}/1`).flush(
      { message: 'User has been deleted and cannot be modified', error_code: 1208 },
      { status: 409, statusText: 'Conflict' },
    );

    await expect(promise).rejects.toBeInstanceOf(UserDeletedError);
  });

  it('maps department required validation errors', async () => {
    const promise = firstValueFrom(
      repo.createUser({
        firstName: 'Ana',
        lastName: 'Garcia',
        email: 'ana@example.com',
        role: UserRole.Employee,
        departmentId: null,
      }),
    );

    controller.expectOne(BASE_URL).flush(
      { message: 'Department is required for Manager and Employee roles', error_code: 1204 },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    await expect(promise).rejects.toBeInstanceOf(UserDepartmentRequiredError);
  });
});
