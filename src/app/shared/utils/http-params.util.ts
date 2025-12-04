import { HttpParams } from '@angular/common/http';

/**
 * Utility function to build HttpParams from query parameters object
 * Filters out undefined, null, empty string, and 'all'/'All' values
 *
 * @param params - Object containing query parameters
 * @returns HttpParams object ready for HTTP requests
 *
 * @example
 * const params = buildHttpParams({ page: 1, status: 'active', search: '' });
 * // Returns HttpParams with only page=1 and status=active
 */
export function buildHttpParams<T extends Record<string, any>>(params?: T): HttpParams {
  let httpParams = new HttpParams();

  if (!params) {
    return httpParams;
  }

  Object.keys(params).forEach(key => {
    const value = params[key];

    // Skip undefined, null, empty string, and filter values 'all'/'All'
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'all' &&
      value !== 'All'
    ) {
      httpParams = httpParams.set(key, value.toString());
    }
  });

  return httpParams;
}
