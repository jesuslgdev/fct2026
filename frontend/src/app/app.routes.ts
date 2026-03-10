import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'legal',
		loadChildren: () => import('@features/legal/legal.routes').then(m => m.LEGAL_ROUTES),
	},
	{
		path: '',
		redirectTo: 'legal',
		pathMatch: 'full',
	},
];
