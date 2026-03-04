import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonComponent, InputComponent } from './shared/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastModule, ButtonComponent, InputComponent, FormsModule],
  templateUrl: './app.html',
})
export class AppComponent {
  lastAction = signal('');

  onSave()   { this.lastAction.set('clicked: Guardar'); }
  onCancel() { this.lastAction.set('clicked: Cancelar'); }
  onDelete() { this.lastAction.set('clicked: Eliminar'); }

  // ── Input demo ──
  inputDefault  = signal('');
  inputFilled   = signal('');
  inputSm       = signal('');
  inputLg       = signal('');
  inputDisabled = signal('Valor bloqueado');
  inputSearch   = signal('');
}