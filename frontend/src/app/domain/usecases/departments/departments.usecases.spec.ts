import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DepartmentRepository } from '@domain/repositories/department.repository';
import { Department } from '@domain/models/department.model';
import { DepartmentHasUsersError } from '@domain/models/department-errors';
import { GetDepartmentsUseCase } from './get-departments.usecase';
import { CreateDepartmentUseCase } from './create-department.usecase';
import { UpdateDepartmentUseCase } from './update-department.usecase';
import { DeleteDepartmentUseCase } from './delete-department.usecase';

const MOCK_DEPT: Department = { id: '1', name: 'Tecnología', userCount: 0 };

class MockDepartmentRepository implements DepartmentRepository {
  getAll = vi.fn().mockResolvedValue([MOCK_DEPT]);
  create = vi.fn().mockResolvedValue(MOCK_DEPT);
  update = vi.fn().mockResolvedValue({ ...MOCK_DEPT, name: 'Ventas' });
  delete = vi.fn().mockResolvedValue(undefined);
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
      ],
    });
  });

  describe('GetDepartmentsUseCase', () => {
    it('returns all departments from the repository', async () => {
      const useCase = TestBed.inject(GetDepartmentsUseCase);
      const result = await useCase.execute();
      expect(mockRepo.getAll).toHaveBeenCalledOnce();
      expect(result).toEqual([MOCK_DEPT]);
    });
  });

  describe('CreateDepartmentUseCase', () => {
    it('trims the name before calling repository', async () => {
      const useCase = TestBed.inject(CreateDepartmentUseCase);
      await useCase.execute('  Tecnología  ');
      expect(mockRepo.create).toHaveBeenCalledWith('Tecnología');
    });
  });

  describe('UpdateDepartmentUseCase', () => {
    it('trims the name before calling repository', async () => {
      const useCase = TestBed.inject(UpdateDepartmentUseCase);
      await useCase.execute('1', '  Ventas  ');
      expect(mockRepo.update).toHaveBeenCalledWith('1', 'Ventas');
    });
  });

  describe('DeleteDepartmentUseCase', () => {
    it('deletes a department with no users', async () => {
      const useCase = TestBed.inject(DeleteDepartmentUseCase);
      await useCase.execute({ ...MOCK_DEPT, userCount: 0 });
      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });

    it('throws DepartmentHasUsersError when department has users', async () => {
      const useCase = TestBed.inject(DeleteDepartmentUseCase);
      await expect(useCase.execute({ ...MOCK_DEPT, userCount: 3 }))
        .rejects.toThrow(DepartmentHasUsersError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
