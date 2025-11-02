import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMaintenanceModalComponent } from './add-maintenance-modal.component';

describe('AddMaintenanceModalComponent', () => {
  let component: AddMaintenanceModalComponent;
  let fixture: ComponentFixture<AddMaintenanceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMaintenanceModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMaintenanceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
