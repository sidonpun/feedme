import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  InventoryDocument,
  InventoryService,
  UpsertInventoryPayload,
} from '../../services/inventory.service';

@Injectable({ providedIn: 'root' })
export class InventoryFacade {
  private readonly api = inject(InventoryService);
  private readonly documentsSignal = signal<InventoryDocument[]>([]);
  private readonly loadingSignal = signal(false);

  constructor() {
    void this.refresh();
  }

  documents = () => this.documentsSignal.asReadonly();

  loading = () => this.loadingSignal.asReadonly();

  async refresh(): Promise<InventoryDocument[]> {
    this.loadingSignal.set(true);
    try {
      const documents = await firstValueFrom(this.api.getAll());
      const sorted = this.sortDocuments(documents);
      this.documentsSignal.set(sorted);
      return sorted;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async create(payload: UpsertInventoryPayload): Promise<InventoryDocument> {
    this.loadingSignal.set(true);
    try {
      const created = await firstValueFrom(this.api.create(payload));
      this.documentsSignal.update((documents) =>
        this.sortDocuments([created, ...documents.filter((doc) => doc.id !== created.id)]),
      );
      return created;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async update(id: string, payload: UpsertInventoryPayload): Promise<InventoryDocument> {
    this.loadingSignal.set(true);
    try {
      const updated = await firstValueFrom(this.api.update(id, payload));
      this.documentsSignal.update((documents) =>
        this.sortDocuments(
          documents.map((doc) => (doc.id === updated.id ? updated : doc)),
        ),
      );
      return updated;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(this.api.delete(id));
      this.documentsSignal.update((documents) =>
        documents.filter((doc) => doc.id !== id),
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteMany(ids: readonly string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(ids));
    if (!uniqueIds.length) {
      return;
    }

    this.loadingSignal.set(true);
    try {
      for (const id of uniqueIds) {
        await firstValueFrom(this.api.delete(id));
      }

      this.documentsSignal.update((documents) =>
        documents.filter((doc) => !uniqueIds.includes(doc.id)),
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private sortDocuments(documents: ReadonlyArray<InventoryDocument>): InventoryDocument[] {
    return [...documents].sort((left, right) => {
      const leftTime = this.timestamp(left.startedAt);
      const rightTime = this.timestamp(right.startedAt);

      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return right.number.localeCompare(left.number, 'ru');
    });
  }

  private timestamp(value: string): number {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) {
      return Number.NEGATIVE_INFINITY;
    }
    return time;
  }
}
