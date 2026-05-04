import { ChangeDetectionStrategy, Component, computed, inject, ViewChild } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SignOutUseCase } from '@domain/usecases/auth/sign-out.usecase';
import { AuthService } from '@core/services/auth.service';
import { UserPermission } from '@domain/enums/user-permission.enum';
import { UserRole } from '@domain/enums/user-role.enum';
import { PurchasePermissionContext } from '@domain/models/purchase.model';
import { canManagePurchases } from '@domain/models/purchase-rules';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
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
  roles?: UserRole[];
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
  '/clients': 'Clientes',
  '/suppliers': 'Proveedores',
  '/warehouses': 'Almacenes',
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

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    if (PAGE_TITLES[url]) {
      return PAGE_TITLES[url];
    }
    if (url.startsWith('/products/')) {
      return 'Detalle de producto';
    }
    return 'ERP System';
  });

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
    const isAdmin = this.authService.isAdmin();
    const user = this.authService.user();
    const purchasesDepartmentId = this.authService.hasPermission(UserPermission.PurchasesDepartment)
      ? (user?.departmentId ?? -1)
      : -1;
    const purchasePermissionContext: PurchasePermissionContext = {
      role: user?.role,
      departmentId: user?.departmentId ?? null,
      purchasesDepartmentId,
      permissions: user?.permissions ?? [],
    };
    const canAccessPurchases = canManagePurchases(purchasePermissionContext);

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
          ...(canAccessPurchases
            ? [{ label: 'Compras', icon: 'pi pi-shopping-cart', route: '/purchases' }]
            : []),
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
          { label: 'Clientes', icon: 'pi pi-users', route: '/clients' },
          { label: 'Proveedores', icon: 'pi pi-truck', route: '/suppliers' },
        ],
      },
      {
        title: 'Inventario',
        items: [
          { label: 'Almacenes', icon: 'pi pi-building', route: '/warehouses' },
          { label: 'Movimientos', icon: 'pi pi-refresh', route: '/movements' },
        ],
      },
      {
        title: 'Administración',
        items: [
          { label: 'Departamentos', icon: 'pi pi-sitemap', route: '/departments' },
          { label: 'Usuarios', icon: 'pi pi-user', route: '/users', roles: [UserRole.Administrator] },
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