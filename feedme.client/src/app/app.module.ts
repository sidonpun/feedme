import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  // ваши маршруты, например:
  // { path: '', component: ContentComponent },
  // { path: 'catalog', component: CatalogComponent },
  // { path: '**', redirectTo: '' }
];

@NgModule({
  // оставляем здесь только провайдер роутинга
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppModule { }
