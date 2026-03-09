import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppShellComponent } from "@shared/ui/app-shell/app-shell.component";

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
  templateUrl: './app.html',
})
export class AppComponent {

}