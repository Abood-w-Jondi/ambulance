import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
    constructor(
        private globalVars: GlobalVarsService,
        private router: Router,
        private authService: AuthService
    ) {
        this.globalVars.setGlobalHeader('الإعدادات');
    }

    navigateTo(path: string): void {
        this.router.navigate([`/admin/settings/${path}`]);
    }

    navigateToUsers(): void {
        this.router.navigate(['/admin/drivers-list']);
    }

    logout(): void {
        this.authService.clearAuthData();  // Synchronous clear
        this.router.navigate(['/login']);
    }
}
