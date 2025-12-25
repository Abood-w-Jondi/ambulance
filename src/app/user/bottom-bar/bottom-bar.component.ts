import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Define a structure for our navigation items
interface NavItem {
  label: string;
  icon: string;
  route: string;
}
@Component({
  selector: 'app-bottom-bar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-bar.component.html',
  styleUrl: './bottom-bar.component.css'
})
export class BottomBarComponent {

  // Your navigation links defined in one place
  navItems: NavItem[] = [
    { label: 'لوحة القيادة', icon: 'fa-solid fa-gauge', route: '/user/driver-dashboard' },
    { label: 'الحالة', icon: 'fa-solid fa-arrows-rotate', route: '/user/status-update' },
    { label: 'رحلاتي', icon: 'fa-solid fa-list-ul', route: '/user/my-trips' },
    { label: 'الملف الشخصي', icon: 'fa-solid fa-user-circle', route: '/user/profile' }
  ];

}