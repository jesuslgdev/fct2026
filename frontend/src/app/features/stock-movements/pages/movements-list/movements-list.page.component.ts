import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TableComponent } from '@shared/ui/table/table.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MovementsStore } from '@features/stock-movements/state/movements.store';
import { MovementDetailDialogComponent } from '@features/stock-movements/components/movement-detail-dialog/movement-detail-dialog.component';
import { MovementTypeBadgeComponent } from '@features/stock-movements/components/movement-type-badge/movement-type-badge.component';
import { StockMovement, MovementType } from '@domain/models/stock-movement.model';

@Component({
  selector: 'app-movements-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MovementsStore],
  imports: [
    FormsModule,
    RouterModule,
    DatePipe,
    TableComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SelectModule,
    DatePickerModule,
    MovementDetailDialogComponent,
    MovementTypeBadgeComponent,
  ],
  templateUrl: './movements-list.page.component.html',
})
export class MovementsListPageComponent implements OnInit {
  readonly store = inject(MovementsStore);
  private readonly router = inject(Router);

  readonly movementTypeOptions = [
    { label: 'Todos', value: undefined },
    { label: 'Entrada', value: 'inbound' as MovementType },
    { label: 'Salida', value: 'outbound' as MovementType },
    { label: 'Ajuste', value: 'adjustment' as MovementType },
  ];

  ngOnInit(): void {
    this.store.loadProductOptions();
    this.store.loadMovements();
  }

  formatDifference(difference: number): string {
    return difference > 0 ? `+${difference}` : `${difference}`;
  }

  openDetail(movement: StockMovement): void {
    this.store.openDetailDialog(movement);
  }

  navigateToSale(saleId: number): void {
    void this.router.navigate(['/sales', saleId]);
  }
}
