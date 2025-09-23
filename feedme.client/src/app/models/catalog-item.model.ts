export interface CatalogItem {
  id: string;
  category: string;
  name: string;
  stockQuantity: number;
  stockUnit: string;
  unitPrice: number;
  warehouse: string;
  expiryDate: string;
  supplier: string;
  totalCost?: number;
}
