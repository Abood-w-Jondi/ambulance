import { Component } from '@angular/core';
import { GlobalVarsService } from '../global-vars.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'app-side-bar',
  imports: [AsyncPipe],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent {
  header$: Observable<string>;

  constructor(private globalVarsService: GlobalVarsService) {
    this.header$ = this.globalVarsService.globalHeader$;
    console.log(this.header$);
  }

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
}
