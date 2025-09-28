import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogComponent } from './components/catalog/catalog.component';
import { ContentComponent } from './components/content/content.component';
import { WarehousePageComponent } from './warehouse/warehouse-page.component';

export const appRoutes: Routes = [
  { path: '', component: ContentComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'warehouse', component: WarehousePageComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
