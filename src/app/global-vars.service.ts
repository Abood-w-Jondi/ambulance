import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DriverReference } from './shared/models';

@Injectable({
  providedIn: 'root'
})
export class GlobalVarsService {

  constructor() { }
  private globalHeader = new BehaviorSubject<string>('لوحة التحكم');
  public globalHeader$: Observable<string> = this.globalHeader.asObservable();
  setGlobalHeader(newValue: string): void {
    this.globalHeader.next(newValue);
  }
  getGlobalHeader(): string {
    return this.globalHeader.getValue();
  }

  /**
   * Simplified driver list for dropdowns and references
   * Contains only the essential properties needed for display
   * Full driver data with all properties exists in the drivers-list component
   */
  driversList: DriverReference[] = [
    { id: 'd1', name: 'إليانور بينا' },
    { id: 'd2', name: 'كاميرون ويليامسون' },
    { id: 'd3', name: 'جاكوب جونز'},
    { id: 'd4', name: 'ويد وارين' },
  ];
}
