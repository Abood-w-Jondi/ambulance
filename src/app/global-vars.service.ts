import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DriverReference } from './shared/models';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalVarsService {

  constructor() { }
  private globalHeader = new BehaviorSubject<string>('لوحة التحكم');
  public globalHeader$: Observable<string> = this.globalHeader.asObservable();
  private usersImgSubject = new BehaviorSubject<string>('/assets/default-avatar.png');
  public usersImg$: Observable<string> = this.usersImgSubject.asObservable();
  setGlobalHeader(newValue: string): void {
    this.globalHeader.next(newValue);
  }
  getGlobalHeader(): string {
    return this.globalHeader.getValue();
  }
  getCurrrentIMG(): string {
    const currentImg = this.usersImgSubject.getValue();
    if(currentImg === '' || currentImg === '/assets/default-avatar.png'){
      return 'person-placeholder.jpg'; // Assuming 'person-placeholder.jpg' is the final path
    }
    else{return currentImg;}
  }
  public currentImgPath$: Observable<string> = this.usersImgSubject.asObservable().pipe(
    map(img => {
      // Apply the placeholder logic here, so consumers get the correct path
      if (img === '' || img === '/assets/default-avatar.png') {
        return 'person-placeholder.jpg';
      }
      return img;
    })
  );
  
  // 4. Update setCurrentIMG to push the new value to the Subject
 setCurrentIMG(newImg: string): void {
    // This pushes the new image URL into the stream
    this.usersImgSubject.next(newImg);
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
