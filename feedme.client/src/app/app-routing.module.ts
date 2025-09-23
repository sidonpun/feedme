import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogComponent } from './components/catalog/catalog.component';
import { ContentComponent } from './components/content/content.component';

export const appRoutes: Routes = [
  { path: '', component: ContentComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
