import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { SideBarComponent } from './side-bar/side-bar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BottomBarComponent } from './user/bottom-bar/bottom-bar.component';

@Component({
  selector: 'app-root',
  standalone: true, // This component is standalone based on your 'imports'
  imports: [CommonModule, RouterOutlet, SideBarComponent, BottomBarComponent], // CommonModule provides *ngIf
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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
    ).subscribe((event) => {
      // Use the final URL from the NavigationEnd event which contains the full path
      const navEnd = event as NavigationEnd;
      const url = navEnd.urlAfterRedirects || navEnd.url || this.router.url;

      // Set the visibility. Show the sidebar ONLY if the URL starts with '/admin'.
      this.showSideBar = url.startsWith('/admin');
    });
  }
}