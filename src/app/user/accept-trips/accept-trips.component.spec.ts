import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptTripsComponent } from './accept-trips.component';

describe('AcceptTripsComponent', () => {
  let component: AcceptTripsComponent;
  let fixture: ComponentFixture<AcceptTripsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptTripsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
