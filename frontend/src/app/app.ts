import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule }       from 'primeng/button';
import { InputTextModule }    from 'primeng/inputtext';
import { SelectModule }       from 'primeng/select';
import { TableModule }        from 'primeng/table';
import { TagModule }          from 'primeng/tag';
import { ToastModule }        from 'primeng/toast';
import { CheckboxModule }     from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule }      from 'primeng/tooltip';


@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    CheckboxModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
  templateUrl: './app.html',
})
export class AppComponent {
}