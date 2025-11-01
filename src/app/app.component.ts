import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { SideBarComponent } from './side-bar/side-bar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true, // This component is standalone based on your 'imports'
  imports: [CommonModule, RouterOutlet, SideBarComponent], // CommonModule provides *ngIf
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ambulance';
  
  // Use a simple boolean property to control visibility
  public showSideBar: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      // Filter for the NavigationEnd event, which fires after navigation is complete
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Get the current activated route snapshot
      let currentRoute = this.route.snapshot;
      
      // Traverse down to the last child route (the one being rendered)
      while (currentRoute.firstChild) {
        currentRoute = currentRoute.firstChild;
      }

      // Get the 'path' property from the route configuration (e.g., 'login', '**')
      const path = currentRoute.routeConfig?.path;

      // Set the visibility. Show the sidebar UNLESS the path is 'login' or '**'.
      this.showSideBar = !(path === 'login' || path === '**');
    });
  }
}