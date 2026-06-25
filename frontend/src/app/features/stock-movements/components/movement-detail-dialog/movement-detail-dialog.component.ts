import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DialogComponent } from '@shared/ui/dialog/dialog.component';
import { MovementsStore } from '@features/stock-movements/state/movements.store';
import { MovementTypeBadgeComponent } from '@features/stock-movements/components/movement-type-badge/movement-type-badge.component';

@Component({
  selector: 'app-movement-detail-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogComponent, MovementTypeBadgeComponent, DatePipe, RouterModule],
  templateUrl: './movement-detail-dialog.component.html',
})
export class MovementDetailDialogComponent {
  readonly store = inject(MovementsStore);
}
