import { Component, Input } from '@angular/core';
import { GlobalVarsService } from '../global-vars.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-side-bar',
  imports: [AsyncPipe, CommonModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent {
  @Input() showSideBar: boolean = false;
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
    console.log("Toggling sidebar");
    this.sidebarOpen = !this.sidebarOpen;
    console.log("Sidebar open:", this.sidebarOpen);
    console.log("show sidebar:", this.showSideBar);
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  navigateTo(path: string) {
    this.router.navigate([`admin/${path}`]);
    this.closeSidebar();
  }

  isActive(path: string): boolean {
    return this.router.isActive(`admin/${path}`, false);
  }
}
