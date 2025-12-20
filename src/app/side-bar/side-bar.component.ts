import { Component, computed, Input } from '@angular/core';
import { GlobalVarsService } from '../global-vars.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import{ ToastService } from '../shared/services/toast.service';
import { map} from 'rxjs'
@Component({
  selector: 'app-side-bar',
  imports: [AsyncPipe, CommonModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent {
  @Input() showSideBar: boolean = false;
  header$: Observable<string>;
img$: Observable<string>;
  constructor(
    private globalVarsService: GlobalVarsService,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.header$ = this.globalVarsService.globalHeader$;
    // 5. Initialize the new Observable
    this.img$ = this.globalVarsService.usersImg$;
    this.img$ = this.globalVarsService.currentImgPath$;
  }
  isAdmin = computed(() => this.authService.isAdmin());
  
  sidebarOpen = false;
  
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  closeSidebar() {
    this.sidebarOpen = false;
  }
  
  navigateTo(path: string) {
    if(path === 'profile'){
      this.router.navigate([`user/${path}`]);
      return;
    }
    this.router.navigate([`admin/${path}`]);
    this.closeSidebar();
  }
  navigateToUser(){
    this.router.navigate(['/user/driver-dashboard']);
    this.closeSidebar();
  }
  
  isActive(path: string): boolean {
    return this.router.isActive(`admin/${path}`, false);
  }
  
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.toastService.success('تم تسجيل الخروج بنجاح'),
      error: () => {
        this.toastService.error('فشل تسجيل الخروج');
      }
    });
  }
  returnToAdmin(): void {
    this.router.navigate(['/admin/admin-dashboard']);
  }
}
