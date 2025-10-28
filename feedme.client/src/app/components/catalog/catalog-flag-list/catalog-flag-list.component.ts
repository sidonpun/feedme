import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { CatalogItem } from '../../../services/catalog.service';
import { CATALOG_FLAG_FULL_MAP, CATALOG_FLAG_SHORT_MAP } from '../../../constants/catalog-flags';

type CatalogItemFlag = NonNullable<CatalogItem['flags']>[number];

@Component({
  selector: 'app-catalog-flag-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-flag-list.component.html',
  styleUrls: ['./catalog-flag-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogFlagListComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() flags: ReadonlyArray<CatalogItemFlag> | null | undefined;

  @ViewChild('container', { static: true }) private containerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('measureMore', { static: true }) private moreMeasureRef?: ElementRef<HTMLSpanElement>;
  @ViewChildren('measureFlag') private measureFlagElements?: QueryList<ElementRef<HTMLSpanElement>>;

  visibleFlags: readonly CatalogItemFlag[] = [];
  hiddenCount = 0;
  hiddenTooltip = '';

  private resizeObserver?: ResizeObserver;
  private measureSubscription?: Subscription;
  private measureFrame: number | null = null;
  private destroyed = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.observeContainerResize();
    this.measureSubscription = this.measureFlagElements?.changes.subscribe(() => this.scheduleMeasurement());
    this.scheduleMeasurement();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['flags']) {
      this.scheduleMeasurement();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.measureFrame !== null) {
      cancelAnimationFrame(this.measureFrame);
      this.measureFrame = null;
    }

    this.resizeObserver?.disconnect();
    this.measureSubscription?.unsubscribe();
  }

  private observeContainerResize(): void {
    const container = this.containerRef?.nativeElement;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.scheduleMeasurement());
      this.resizeObserver.observe(container);
    });
  }

  private scheduleMeasurement(): void {
    if (this.measureFrame !== null || this.destroyed) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.measureFrame = requestAnimationFrame(() => {
        this.measureFrame = null;
        this.ngZone.run(() => this.updateVisibility());
      });
    });
  }

  private updateVisibility(): void {
    const flags = this.flags ?? [];
    const container = this.containerRef?.nativeElement;
    const measureElements = this.measureFlagElements?.map((ref) => ref.nativeElement) ?? [];

    if (!flags.length || !container || !measureElements.length) {
      this.visibleFlags = [];
      this.hiddenCount = 0;
      this.hiddenTooltip = '';
      this.cdr.markForCheck();
      return;
    }

    const availableWidth = Math.floor(container.clientWidth || container.offsetWidth);
    if (availableWidth <= 0) {
      this.visibleFlags = Array.from(flags);
      this.hiddenCount = 0;
      this.hiddenTooltip = '';
      this.cdr.markForCheck();
      return;
    }

    const gap = this.getGap(container);
    const widths = measureElements.map((element) => Math.ceil(element.offsetWidth));

    let visibleCount = 0;
    let usedWidth = 0;

    for (let index = 0; index < widths.length; index += 1) {
      const width = widths[index];
      const gapBeforeFlag = visibleCount > 0 ? gap : 0;
      const nextUsed = usedWidth + gapBeforeFlag + width;
      const remainingFlags = widths.length - (index + 1);

      let requiredWidth = nextUsed;
      if (remainingFlags > 0) {
        const moreWidth = this.measureMoreWidth(remainingFlags);
        const gapBeforeMore = nextUsed > 0 ? gap : 0;
        requiredWidth = nextUsed + gapBeforeMore + moreWidth;
      }

      if (requiredWidth <= availableWidth) {
        visibleCount += 1;
        usedWidth = nextUsed;
      } else {
        break;
      }
    }

    if (visibleCount === 0) {
      visibleCount = 1;
    }

    const hiddenCount = Math.max(0, flags.length - visibleCount);
    this.visibleFlags = flags.slice(0, visibleCount);
    this.hiddenCount = hiddenCount;
    this.hiddenTooltip = hiddenCount > 0 ? this.buildHiddenTooltip(visibleCount) : '';
    this.cdr.markForCheck();
  }

  private getGap(element: HTMLElement): number {
    const style = getComputedStyle(element);
    const gapValue = style.columnGap || style.gap || '0';
    const parsed = parseFloat(gapValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private measureMoreWidth(count: number): number {
    const element = this.moreMeasureRef?.nativeElement;
    if (!element) {
      return 0;
    }

    element.textContent = `+${count}`;
    return Math.ceil(element.offsetWidth);
  }

  protected resolveFlagShort(flag: CatalogItemFlag | null | undefined): string {
    const code = this.normalizeFlagCode(flag);
    if (code && Object.prototype.hasOwnProperty.call(CATALOG_FLAG_SHORT_MAP, code)) {
      return CATALOG_FLAG_SHORT_MAP[code as keyof typeof CATALOG_FLAG_SHORT_MAP];
    }

    return (flag?.short ?? flag?.name ?? flag?.full ?? '').trim();
  }

  protected resolveFlagFull(flag: CatalogItemFlag | null | undefined): string {
    const code = this.normalizeFlagCode(flag);
    if (code && Object.prototype.hasOwnProperty.call(CATALOG_FLAG_FULL_MAP, code)) {
      return CATALOG_FLAG_FULL_MAP[code as keyof typeof CATALOG_FLAG_FULL_MAP];
    }

    return (flag?.full ?? flag?.name ?? flag?.short ?? '').trim();
  }

  private normalizeFlagCode(flag: CatalogItemFlag | null | undefined): string {
    const code = flag?.code ?? '';
    return typeof code === 'string' ? code.trim() : '';
  }

  private buildHiddenTooltip(visibleCount: number): string {
    return (this.flags ?? [])
      .slice(visibleCount)
      .map((flag) => this.resolveFlagFull(flag))
      .filter((label) => label.length > 0)
      .join(', ');
  }
}
