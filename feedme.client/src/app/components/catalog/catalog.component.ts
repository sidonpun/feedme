import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, take } from 'rxjs';
import { FilterPipe } from '../../pipes/filter.pipe';
import { NewProductFormValues } from '../catalog-new-product-popup/catalog-new-product-popup.component';
import { CatalogService, CatalogItem } from '../../services/catalog.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  activeTab: 'info' | 'logistics' = 'info';
  filter = '';

  private readonly catalogDataSubject = new BehaviorSubject<CatalogItem[]>([]);
  readonly catalogData$ = this.catalogDataSubject.asObservable();

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.catalogService
      .getAll()
      .pipe(take(1))
      .subscribe(data => this.catalogDataSubject.next(data));
  }

  /** Добавляет новый товар в каталог */
  addProduct(item: NewProductFormValues): void {
    this.catalogService
      .create(item)
      .pipe(take(1))
      .subscribe(created => {
        const updated = [...this.catalogDataSubject.value, created];
        this.catalogDataSubject.next(updated);
      });
  }
}
