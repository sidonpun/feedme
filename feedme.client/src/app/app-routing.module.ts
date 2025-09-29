import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WarehousePageComponent } from './warehouse/warehouse-page.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'warehouse', pathMatch: 'full' },
  { path: 'warehouse', component: WarehousePageComponent },
  { path: '**', redirectTo: 'warehouse', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
