import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { SideBarComponent } from './side-bar/side-bar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BottomBarComponent } from './user/bottom-bar/bottom-bar.component';
import { ToastComponent } from './shared/toast/toast.component';
import { ToastService } from './shared/services/toast.service';
import { VehicleCookieService } from './shared/services/vehicle-cookie.service';

@Component({
  selector: 'app-root',
  standalone: true, // This component is standalone based on your 'imports'
  imports: [CommonModule, RouterOutlet, SideBarComponent, BottomBarComponent, ToastComponent], // CommonModule provides *ngIf
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ambulance';

  // Use a simple boolean property to control visibility
  public showSideBar: boolean = true;
  public showBottomBar: boolean = true;

  @ViewChild(ToastComponent) toastComponent!: ToastComponent;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private vehicleCookieService: VehicleCookieService
  ) {}
dontshowsidebar : boolean = false;
  ngOnInit() {
    this.router.events.pipe(
      // Filter for the NavigationEnd event, which fires after navigation is complete
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // Use the final URL from the NavigationEnd event which contains the full path
      const navEnd = event as NavigationEnd;
      const url = navEnd.urlAfterRedirects || navEnd.url || this.router.url;

      // Set the visibility. Show the sidebar ONLY if the URL starts with '/admin'.
      this.showSideBar = url.startsWith('/admin');
      this.dontshowsidebar = url.endsWith('login')

      // Show bottom bar only for user routes AND when vehicle is selected
      const isUserRoute = url.startsWith('/user');
      const hasVehicle = this.vehicleCookieService.hasSelectedVehicle();
      this.showBottomBar = isUserRoute;
    });

    // Subscribe to toast service
    this.toastService.toast$.subscribe((toast) => {
      if (this.toastComponent) {
        this.toastComponent.show(toast.message, toast.type, toast.duration);
      }
    });
  }
}