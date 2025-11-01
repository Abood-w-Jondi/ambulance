import { Component } from '@angular/core';
import { GlobalVarsService } from '../global-vars.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-side-bar',
  imports: [AsyncPipe],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent {
  header$: Observable<string>;

  constructor(
    private globalVarsService: GlobalVarsService,
    private router: Router
  ) {
    this.header$ = this.globalVarsService.globalHeader$;
    console.log(this.header$);
  }

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeSidebar();
  }

  isActive(path: string): boolean {
    return this.router.isActive(path, false);
  }
}
