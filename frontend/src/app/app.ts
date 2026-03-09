import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AppShellComponent } from '@shared/ui/app-shell/app-shell.component';
import { AuthStore } from '@core/auth/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, NgIf, AppShellComponent],
  templateUrl: './app.html',
})
export class AppComponent {
  private readonly authStore = inject(AuthStore);
  readonly isAuthenticated = this.authStore.isAuthenticated;
}