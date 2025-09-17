import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CatalogItem, CatalogService } from './services/catalog.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  let catalogService: jasmine.SpyObj<CatalogService>;

  beforeEach(async () => {
    catalogService = jasmine.createSpyObj<CatalogService>(
      'CatalogService',
      ['getAll', 'create', 'getById']
    );
    catalogService.getAll.and.returnValue(of([]));
    catalogService.create.and.returnValue(of({} as CatalogItem));
    catalogService.getById.and.returnValue(of({} as CatalogItem));

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: CatalogService, useValue: catalogService }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });
  afterEach(() => {
    // nothing to clean up
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

});