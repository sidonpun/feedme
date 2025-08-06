import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  catalogData: CatalogItem[] = [];

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.catalogService.getAll().subscribe(data => (this.catalogData = data));
  }

  /** Добавляет новый товар в каталог */
  addProduct(item: NewProductFormValues): void {
    this.catalogService.create(item).subscribe(created => {
      this.catalogData.push(created);
    });
  }
}
