import { TestBed } from '@angular/core/testing';
import { firstValueFrom, skip, take } from 'rxjs';

import { CreateReceipt, ReceiptService } from './receipt.service';

describe('ReceiptService (in-memory)', () => {
  let service: ReceiptService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReceiptService],
    });

    service = TestBed.inject(ReceiptService);
  });

  function createPayload(overrides: Partial<CreateReceipt> = {}): CreateReceipt {
    const base: CreateReceipt = {
      number: 'RCPT-100',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      responsible: 'Не назначен',
      receivedAt: '2024-04-15T00:00:00.000Z',
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150,
          expiryDate: '2024-04-25T00:00:00.000Z',
          status: 'warning',
        },
      ],
    };

    return { ...base, ...overrides };
  }

  it('creates receipts in memory and exposes them through the stream', async () => {
    const payload = createPayload();
    const emissionPromise = firstValueFrom(service.getAll().pipe(skip(1), take(1)));

    const created = await firstValueFrom(service.saveReceipt(payload));
    const receipts = await emissionPromise;

    expect(created.totalAmount).toBeCloseTo(750, 5);
    expect(created.items[0].totalCost).toBeCloseTo(750, 5);
    expect(receipts).toEqual([created]);
  });

  it('updates existing receipts by identifier', async () => {
    const initial = await firstValueFrom(service.saveReceipt(createPayload({ number: 'RCPT-101' })));
    const updatedPayload = createPayload({
      number: 'RCPT-101-UPDATED',
      warehouse: 'Бар',
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 3,
          unit: 'кг',
          unitPrice: 200,
          expiryDate: '2024-04-30T00:00:00.000Z',
          status: 'ok',
        },
      ],
    });

    const updated = await firstValueFrom(service.updateReceipt(initial.id, updatedPayload));

    expect(updated.id).toBe(initial.id);
    expect(updated.number).toBe('RCPT-101-UPDATED');
    expect(updated.warehouse).toBe('Бар');
    expect(updated.totalAmount).toBe(600);

    const receipts = await firstValueFrom(service.getAll().pipe(take(1)));
    expect(receipts[0]).toEqual(updated);
  });

  it('removes receipts and keeps stream consistent', async () => {
    const first = await firstValueFrom(service.saveReceipt(createPayload({ number: 'RCPT-201' })));
    const second = await firstValueFrom(service.saveReceipt(createPayload({ number: 'RCPT-202' })));

    await firstValueFrom(service.deleteReceipt(first.id));

    const receipts = await firstValueFrom(service.getAll().pipe(take(1)));
    expect(receipts).toEqual([second]);
  });
});
