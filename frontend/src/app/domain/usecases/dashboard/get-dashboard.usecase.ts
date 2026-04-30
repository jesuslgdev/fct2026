import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardRepository } from '@domain/repositories/dashboard.repository';
import { DashboardData } from '@domain/models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class GetDashboardUseCase {
  private readonly dashboardRepository = inject(DashboardRepository);

  execute(): Observable<DashboardData> {
    return this.dashboardRepository.getDashboard();
  }
}
