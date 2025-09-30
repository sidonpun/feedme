import { Injectable } from '@angular/core';

import { SupplyItem } from '../models/supply-item.model';

export type SupplyView = 'supplies' | 'stock' | 'catalog';

@Injectable({ providedIn: 'root' })
export class WarehouseSuppliesService {
  private readonly storagePrefix = 'warehouseData_';

  loadSupplies(warehouse: string): SupplyItem[] {
    const raw = localStorage.getItem(this.composeKey(warehouse));
    if (!raw) {
      return [];
    }

    try {
      const parsed: SupplyItem[] = JSON.parse(raw);
      return parsed.map(item => ({ ...item }));
    } catch {
      return [];
    }
  }

  addSupply(warehouse: string, supply: SupplyItem): SupplyItem[] {
    const current = this.loadSupplies(warehouse);
    const updated = [supply, ...current];
    this.persist(warehouse, updated);
    return updated;
  }

  persist(warehouse: string, supplies: SupplyItem[]): void {
    localStorage.setItem(this.composeKey(warehouse), JSON.stringify(supplies));
  }

  private composeKey(warehouse: string): string {
    return `${this.storagePrefix}${warehouse}`;
  }
}
