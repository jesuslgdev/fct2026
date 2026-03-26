import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthService } from '@core/services/auth.service';
import { Department } from '@domain/models/department.model';
import { DepartmentHasUsersError } from '@domain/models/department-errors';
import { GetDepartmentsUseCase } from './get-departments.usecase';
import { CreateDepartmentUseCase } from './create-department.usecase';
import { UpdateDepartmentUseCase } from './update-department.usecase';
import { DeleteDepartmentUseCase } from './delete-department.usecase';

const MOCK_DEPT: Department = { id: '1', name: 'Tecnología', userCount: 0 };

class MockDepartmentRepository implements DepartmentRepository {
  getAll = vi.fn().mockReturnValue(of([MOCK_DEPT]));
  create = vi.fn().mockReturnValue(of(MOCK_DEPT));
  update = vi.fn().mockReturnValue(of({ ...MOCK_DEPT, name: 'Ventas' }));
  delete = vi.fn().mockReturnValue(of(undefined));
}

class MockUserRepository {
  getUsers = vi.fn();
  getDepartments = vi.fn();
}

class MockAuthService {
  readonly isAdmin = signal(false);
}

describe('Department Use Cases', () => {
  let mockRepo: MockDepartmentRepository;

  beforeEach(() => {
    mockRepo = new MockDepartmentRepository();
    TestBed.configureTestingModule({
      providers: [
        GetDepartmentsUseCase,
        CreateDepartmentUseCase,
        UpdateDepartmentUseCase,
        DeleteDepartmentUseCase,
        { provide: DepartmentRepository, useValue: mockRepo },
        { provide: UserRepository, useValue: new MockUserRepository() },
        { provide: AuthService, useValue: new MockAuthService() },
      ],
    });
  });

  describe('GetDepartmentsUseCase', () => {
    it('returns all departments from the repository', async () => {
      const useCase = TestBed.inject(GetDepartmentsUseCase);
      const result = await firstValueFrom(useCase.execute());
      expect(mockRepo.getAll).toHaveBeenCalledOnce();
      expect(result).toEqual([MOCK_DEPT]);
    });
  });

  describe('CreateDepartmentUseCase', () => {
    it('trims the name before calling repository', async () => {
      const useCase = TestBed.inject(CreateDepartmentUseCase);
      await firstValueFrom(useCase.execute('  Tecnología  '));
      expect(mockRepo.create).toHaveBeenCalledWith('Tecnología');
    });
  });

  describe('UpdateDepartmentUseCase', () => {
    it('trims the name before calling repository', async () => {
      const useCase = TestBed.inject(UpdateDepartmentUseCase);
      await firstValueFrom(useCase.execute('1', '  Ventas  '));
      expect(mockRepo.update).toHaveBeenCalledWith('1', 'Ventas');
    });
  });

  describe('DeleteDepartmentUseCase', () => {
    it('deletes a department with no users', async () => {
      const useCase = TestBed.inject(DeleteDepartmentUseCase);
      await firstValueFrom(useCase.execute({ ...MOCK_DEPT, userCount: 0 }));
      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });

    it('throws DepartmentHasUsersError when department has users', async () => {
      const useCase = TestBed.inject(DeleteDepartmentUseCase);
      await expect(firstValueFrom(useCase.execute({ ...MOCK_DEPT, userCount: 3 })))
        .rejects.toThrow(DepartmentHasUsersError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
