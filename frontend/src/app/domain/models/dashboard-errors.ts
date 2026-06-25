export class DashboardUnauthorizedError extends Error {
  override readonly name = 'DashboardUnauthorizedError';

  constructor(message = 'Autenticación requerida.') {
    super(message);
  }
}

export class DashboardForbiddenError extends Error {
  override readonly name = 'DashboardForbiddenError';

  constructor(message = 'No tienes permisos para consultar el dashboard.') {
    super(message);
  }
}

export class DashboardApiError extends Error {
  override readonly name = 'DashboardApiError';

  constructor(message = 'Error inesperado al consultar el dashboard.') {
    super(message);
  }
}
