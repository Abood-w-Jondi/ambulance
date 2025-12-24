import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
/**
 * Global error interceptor for handling HTTP errors consistently
 * Provides user-friendly error messages in Arabic
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';

      if ( typeof ErrorEvent !== 'undefined' &&  error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `خطأ في الاتصال: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'طلب غير صالح';
            break;
          case 401:
            errorMessage = error.error?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
            break;
          case 403:
            errorMessage = 'ليس لديك صلاحية للوصول';
            break;
          case 404:
            errorMessage = 'المورد المطلوب غير موجود';
            break;
          case 409:
            errorMessage = error.error?.message || 'تعارض في البيانات';
            break;
          case 422:
            errorMessage = error.error?.message || 'البيانات المدخلة غير صحيحة';
            break;
          case 500:
            errorMessage = 'خطأ في الخادم، يرجى المحاولة لاحقاً';
            break;
          case 503:
            errorMessage = 'الخدمة غير متاحة حالياً';
            break;
          default:
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
        }
      }

      if(error.status === 403){
         router.navigate(['/user/dashboard']);
      }
      // Show error toast (except for 401 which is handled by auth interceptor)
      if (error.status !== 401) {
        toastService.error(errorMessage);
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: error.url,
        error: error.error
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};
