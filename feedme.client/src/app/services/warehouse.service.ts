import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private suppliesKey(tab: string) { return `warehouseSupplies_${tab}`; }
  private stockKey(tab: string) { return `warehouseStock_${tab}`; }
  private catalogKey = 'catalogData';

  getSupplies(tab: string): any[] {
    return JSON.parse(localStorage.getItem(this.suppliesKey(tab)) || '[]');
  }

  addSupply(tab: string, item: any): void {
    const arr = this.getSupplies(tab);
    arr.push(item);
    localStorage.setItem(this.suppliesKey(tab), JSON.stringify(arr));
  }

  getStock(tab: string): any[] {
    return JSON.parse(localStorage.getItem(this.stockKey(tab)) || '[]');
  }

  addStock(tab: string, item: any): void {
    const arr = this.getStock(tab);
    arr.push(item);
    localStorage.setItem(this.stockKey(tab), JSON.stringify(arr));
  }

  getCatalog(): any[] {
    return JSON.parse(localStorage.getItem(this.catalogKey) || '[]');
  }

  addCatalog(item: any): void {
    const arr = this.getCatalog();
    arr.push(item);
    localStorage.setItem(this.catalogKey, JSON.stringify(arr));
  }
}
