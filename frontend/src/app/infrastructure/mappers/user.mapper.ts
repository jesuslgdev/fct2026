import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from '@domain/models/user.model';
import { Department } from '@domain/models/department.model';
import { UserDto, CreateUserDto, UpdateUserDto } from '@infrastructure/dtos/user.dto';
import { DepartmentDto } from '@infrastructure/dtos/department.dto';

export class UserMapper {
  static fromDto(dto: UserDto): User {
    return {
      id: dto.user_id,
      firstName: dto.first_name,
      lastName: dto.last_name,
      email: dto.email,
      role: dto.role,
      departmentId: dto.department_id,
      active: dto.is_active,
    };
  }

  static departmentFromDto(dto: DepartmentDto): Department {
    return {
      id: dto.department_id,
      name: dto.name,
    };
  }

  static toCreateDto(payload: CreateUserPayload): CreateUserDto {
    return {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      role: payload.role,
      department_id: payload.departmentId,
    };
  }

  static toUpdateDto(payload: UpdateUserPayload): UpdateUserDto {
    return {
      ...(payload.firstName !== undefined && { first_name: payload.firstName }),
      ...(payload.lastName !== undefined && { last_name: payload.lastName }),
      ...(payload.role !== undefined && { role: payload.role }),
      ...(payload.departmentId !== undefined && {
        department_id: payload.departmentId,
      }),
    };
  }
}
