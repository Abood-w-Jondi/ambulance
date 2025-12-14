import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  employeeId: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.employeeId || !this.password) {
      this.errorMessage = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Use username for login (employeeId field is the username)
    this.authService.login({
      username: this.employeeId,
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
          this.router.navigate(['/user/driver-dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'فشل تسجيل الدخول. الرجاء التحقق من البيانات والمحاولة مرة أخرى.';
      }
    });
  }
}