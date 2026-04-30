import { Observable } from 'rxjs';
import { DashboardData } from '@domain/models/dashboard.model';

export abstract class DashboardRepository {
  abstract getDashboard(): Observable<DashboardData>;
}
