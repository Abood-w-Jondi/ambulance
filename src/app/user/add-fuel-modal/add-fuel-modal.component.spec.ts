import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFuelModalComponent } from './add-fuel-modal.component';

describe('AddFuelModalComponent', () => {
  let component: AddFuelModalComponent;
  let fixture: ComponentFixture<AddFuelModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFuelModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFuelModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
