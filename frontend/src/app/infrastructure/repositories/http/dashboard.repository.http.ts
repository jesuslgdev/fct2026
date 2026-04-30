import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { DashboardRepository } from '@domain/repositories/dashboard.repository';
import {
  DashboardApiError,
  DashboardForbiddenError,
  DashboardUnauthorizedError,
} from '@domain/models/dashboard-errors';
import { DashboardData } from '@domain/models/dashboard.model';
import { DashboardDto } from '@infrastructure/dtos/dashboard.dto';
import { DashboardMapper } from '@infrastructure/mappers/dashboard.mapper';
import { environment } from 'environments/environment';

const BASE_URL = `${environment.apiUrl}/api/v1/dashboard`;

@Injectable()
export class HttpDashboardRepository implements DashboardRepository {
  private readonly http = inject(HttpClient);

  private mapHttpError(err: unknown): Error {
    if (!(err instanceof HttpErrorResponse)) {
      return err instanceof Error ? err : new DashboardApiError();
    }

    const message = this.extractErrorMessage(err);

    switch (err.status) {
      case 401:
        return new DashboardUnauthorizedError(message ?? 'Autenticación requerida.');
      case 403:
        return new DashboardForbiddenError(
          message ?? 'No tienes permisos para consultar el dashboard.',
        );
      default:
        return new DashboardApiError(
          message ?? 'No se pudo cargar la información del dashboard.',
        );
    }
  }

  private extractErrorMessage(err: HttpErrorResponse): string | undefined {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      const payload = err.error as Record<string, unknown>;
      const rawMessage = payload['message'];
      const rawDetail = payload['detail'];

      if (typeof rawMessage === 'string' && rawMessage.trim()) {
        return rawMessage;
      }

      if (typeof rawDetail === 'string' && rawDetail.trim()) {
        return rawDetail;
      }
    }

    return undefined;
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardDto>(BASE_URL).pipe(
      map((response) => DashboardMapper.fromDto(response)),
      catchError((err) => throwError(() => this.mapHttpError(err))),
    );
  }
}
