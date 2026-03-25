import { ChangeDetectionStrategy, Component, computed, inject, ViewChild } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SignOutUseCase } from '@domain/usecases/auth/sign-out.usecase';
import { AuthService } from '@core/services/auth.service';
import { isAdminRole } from '@core/guards/admin.guard';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from '../button/button.component';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  badge?: number;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/purchases': 'Compras',
  '/sales': 'Ventas',
  '/products': 'Productos',
  '/categories': 'Categorías',
  '/customers': 'Clientes',
  '/suppliers': 'Proveedores',
  '/warehouses': 'Almacenes',
  '/stock-by-warehouse': 'Stock por almacén',
  '/movements': 'Movimientos',
  '/departments': 'Departamentos',
  '/users': 'Usuarios',
  '/legal/terms': 'Términos y Condiciones',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    AvatarModule,
    BadgeModule,
    ButtonModule,
    DrawerModule,
    RippleModule,
    StyleClassModule,
    TooltipModule,
    ButtonComponent,
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  @ViewChild('drawerRef') drawerRef!: Drawer;

  private readonly router = inject(Router);
  private readonly signOut = inject(SignOutUseCase);
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly pageTitle = computed(() => PAGE_TITLES[this.currentUrl()] ?? 'ERP System');

  async logout(): Promise<void> {
    await this.signOut.execute();
    this.authService.setSession(null);
    await this.router.navigate(['/auth/login']);
  }

  sidebarVisible = false;

  closeDrawer(event: Event): void {
    this.drawerRef.close(event);
  }

  readonly navSections = computed(() => {
    const currentUser = this.authService.user();
    const isAdmin = isAdminRole(currentUser?.role);
    
    const allSections: NavSection[] = [
      {
        title: 'General',
        items: [
          { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
        ],
      },
      {
        title: 'Operaciones',
        items: [
          { label: 'Compras', icon: 'pi pi-shopping-cart', route: '/purchases' },
          { label: 'Ventas', icon: 'pi pi-credit-card', route: '/sales' },
        ],
      },
      {
        title: 'Catálogo',
        items: [
          { label: 'Productos', icon: 'pi pi-box', route: '/products' },
          { label: 'Categorías', icon: 'pi pi-tags', route: '/categories' },
        ],
      },
      {
        title: 'Terceros',
        items: [
          { label: 'Clientes', icon: 'pi pi-users', route: '/customers' },
          { label: 'Proveedores', icon: 'pi pi-truck', route: '/suppliers' },
        ],
      },
      {
        title: 'Inventario',
        items: [
          { label: 'Almacenes', icon: 'pi pi-building', route: '/warehouses' },
          { label: 'Stock por almacén', icon: 'pi pi-database', route: '/stock-by-warehouse' },
          { label: 'Movimientos', icon: 'pi pi-refresh', route: '/movements' },
        ],
      },
      {
        title: 'Administración',
        items: [
          { label: 'Departamentos', icon: 'pi pi-sitemap', route: '/departments' },
          { label: 'Usuarios', icon: 'pi pi-user', route: '/users' },
        ],
      },
      {
        title: 'Legal',
        items: [
          { label: 'Términos y Condiciones', icon: 'pi pi-file', route: '/legal/terms' },
        ],
      },
    ];

    // Filter out Administration section for non-admin users
    return allSections.filter(section => 
      isAdmin || section.title !== 'Administración'
    );
  });
}
