import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AppShellComponent } from '@shared/ui/app-shell/app-shell.component';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, NgIf, AppShellComponent],
  templateUrl: './app.html',
})
export class AppComponent {
  readonly isAuthenticated = inject(AuthService).isLoggedIn;
}