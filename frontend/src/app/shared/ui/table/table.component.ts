import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Injector,
  TemplateRef,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TableModule, Table, TableService } from 'primeng/table';
import type {
  TablePageEvent,
  TableRowSelectEvent,
  TableRowUnSelectEvent,
} from 'primeng/table';
import type { SortEvent } from 'primeng/api';

// ── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'ui-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableModule, NgTemplateOutlet],
  templateUrl: './table.component.html',
})
export class TableComponent<T extends object, C extends object = object> {
  @ContentChild('caption')      captionTpl?: TemplateRef<void>;
  @ContentChild('header')       headerTpl?:  TemplateRef<unknown>;
  @ContentChild('body')         bodyTpl?:    TemplateRef<unknown>;
  @ContentChild('footer')       footerTpl?:  TemplateRef<unknown>;
  @ContentChild('emptymessage') emptyTpl?:   TemplateRef<void>;

  @ViewChild(Table, { static: true }) table!: Table;

  private parentInjector = inject(Injector);
  private _tableInjector?: Injector;

  /** Injector que provee Table y TableService para directivas como pSelectableRow */
  get tableInjector(): Injector {
    return (this._tableInjector ??= Injector.create({
      providers: [
        { provide: Table, useValue: this.table },
        { provide: TableService, useValue: this.table.tableService },
      ],
      parent: this.parentInjector,
    }));
  }

  // ── Inputs ─────────────────────────────────────────────────────────────────
  value              = input<T[]>([]);
  columns            = input<C[]>([]);
  paginator          = input<boolean>(false);
  lazy               = input<boolean>(false);
  first              = input<number>(0);
  rows               = input<number>(10);
  totalRecords       = input<number>(0);
  rowsPerPageOptions = input<number[]>([10, 20, 50]);
  loading            = input<boolean>(false);
  selection          = input<T | T[] | null>(null);
  selectionMode      = input<'single' | 'multiple' | null>(null);
  editMode           = input<'row' | 'cell'>('cell');
  editingRowKeys     = input<Record<string, boolean>>({});
  scrollable         = input<boolean>(false);
  scrollHeight       = input<string>('');
  resizableColumns   = input<boolean>(false);
  showGridlines      = input<boolean>(false);
  tableStyle         = input<Record<string, string> | null>(null);
  tableClass         = input<string>('');
  dataKey            = input<string>('');  // <-- NUEVO

  // ── Outputs ────────────────────────────────────────────────────────────────
  selectionChange = output<T | T[]>();
  rowSelect       = output<TableRowSelectEvent<T>>();
  rowUnselect     = output<TableRowUnSelectEvent<T>>();
  page            = output<TablePageEvent>();
  sort            = output<SortEvent>();
}
