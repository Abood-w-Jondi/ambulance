import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/**
 * Response interceptor to normalize API response formats
 * Handles different response patterns from backend:
 * 1. { success: true, data: [...] } -> extract data
 * 2. { data: [], total, page, limit, totalPages } -> keep as is (paginated)
 * 3. [...] or {...} -> keep as is (direct response)
 */
export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        const body = event.body;

        // Check if response has success wrapper with data property
        if (
          typeof body === 'object' &&
          'success' in body &&
          'data' in body &&
          body.success === true
        ) {
          // Extract data from success wrapper
          return event.clone({ body: body.data });
        }

        // Keep paginated responses as-is
        if (
          typeof body === 'object' &&
          'data' in body &&
          'total' in body &&
          'page' in body
        ) {
          return event;
        }

        // Keep direct responses as-is
        return event;
      }

      return event;
    })
  );
};
