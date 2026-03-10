export class DepartmentHasUsersError extends Error {
  override readonly name = 'DepartmentHasUsersError';

  constructor() {
    super('DEPARTMENT_HAS_USERS');
  }
}

export class DepartmentNameDuplicateError extends Error {
  override readonly name = 'DepartmentNameDuplicateError';

  constructor() {
    super('DEPARTMENT_NAME_DUPLICATE');
  }
}
