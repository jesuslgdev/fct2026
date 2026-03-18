import { Department } from '@domain/models/department.model';
import { DepartmentDto } from '@infrastructure/dtos/department.dto';

export class DepartmentMapper {
  static toDomain(dto: DepartmentDto, userCount = 0): Department {
    return {
      id: String(dto.department_id),
      name: dto.name,
      userCount,
    };
  }
}
