import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContentComponent } from './components/content/content.component';
import { CatalogComponent } from './components/catalog/catalog.component';

const routes: Routes = [
  { path: '', component: ContentComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
