import { User, CreateUserPayload, UpdateUserPayload } from '@domain/models/user.model';
import { UserDto, CreateUserDto, UpdateUserDto } from '@infrastructure/dtos/user.dto';

export class UserMapper {
  static fromDto(dto: UserDto): User {
    return {
      id: dto.id,
      firstName: dto.first_name,
      lastName: dto.last_name,
      email: dto.email,
      role: dto.role,
      departmentId: dto.department_id,
      departmentName: dto.department_name,
      active: dto.active,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
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
      ...(payload.departmentId !== undefined && { department_id: payload.departmentId }),
    };
  }
}
