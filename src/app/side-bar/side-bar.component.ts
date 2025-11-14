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
    
  }

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
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

  logout() {
    // TODO: Implement logout logic (clear auth tokens, session, etc.)
    this.router.navigate(['/login']);
    this.closeSidebar();
  }
}
