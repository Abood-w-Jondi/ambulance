import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuelHistoryComponent } from './fuel-history.component';

describe('FuelHistoryComponent', () => {
  let component: FuelHistoryComponent;
  let fixture: ComponentFixture<FuelHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuelHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuelHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
