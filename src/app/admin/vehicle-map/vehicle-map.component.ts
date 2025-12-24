import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed, HostListener , Inject, PLATFORM_ID} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService, VehicleLocation } from '../../shared/services/vehicle.service';
import { ToastService } from '../../shared/services/toast.service';
import { GlobalVarsService } from '../../global-vars.service';
//import * as L from 'leaflet';

@Component({
  selector: 'app-vehicle-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-map.component.html',
  styleUrls: ['./vehicle-map.component.css']
})
export class VehicleMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private L: any;
  private map!: any;
  private markers: Map<string,any> = new Map();
  private refreshInterval: any;
  public isMobileView = false;
  isBrowser : boolean = false;

  // Signals
  vehicles = signal<VehicleLocation[]>([]);
  searchText = signal<string>('');
  isLoading = signal(false);
  lastUpdate = signal<Date | null>(null);
  selectedVehicle = signal<VehicleLocation | null>(null);
  isSidebarOpen = signal(true); // Control sidebar visibility

  // Filter Logic
  filteredVehicles = computed(() => {
    const text = this.searchText().toLowerCase();
    const all = this.vehicles();
    if (!text) return all;
    return all.filter(v => 
      v.vehicleName.toLowerCase().includes(text) || 
      (v.driverName && v.driverName.toLowerCase().includes(text))
    );
  });

  filteredVehiclesWithLocation = computed(() => 
    this.filteredVehicles().filter(v => v.latitude && v.longitude)
  );

  filteredVehiclesWithoutLocation = computed(() => 
    this.filteredVehicles().filter(v => !v.latitude || !v.longitude)
  );

  private readonly PALESTINE_CENTER: any = [31.5, 35.0];
  private readonly DEFAULT_ZOOM = 9;

  // Status Colors
  private readonly STATUS_COLORS: Record<string, string> = {
    'متاحة': '#28a745',          
    'في الطريق للمريض': '#e2af19ff', 
    'في الموقع': '#17a2b8',        
    'في الطريق للمستشفى': '#fd7e14', 
    'في الوجهة': '#6f42c1',        
    'خارج الخدمة': '#dc3545',      
    'إنهاء الخدمة': '#6c757d',     
    'صيانة': '#343a40'            
  };

  constructor(
    private vehicleService: VehicleService,
    private toastService: ToastService,
    private globalVars: GlobalVarsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.globalVars.setGlobalHeader('خريطة المركبات');
    if (this.isBrowser) {
    this.checkScreenSize();
  }
  }

  ngOnInit(): void {}
async ngAfterViewInit(): Promise<void> {
  if (this.isBrowser) {
    this.L = await import('leaflet'); // Dynamically load the library
    this.initMap();
    this.loadVehicleLocations();
    
    // Add the manual listener here
    window.addEventListener('resize', () => this.checkScreenSize());
    
    this.refreshInterval = setInterval(() => {
      this.loadVehicleLocations();
    }, 30000);
  }
}

ngOnDestroy(): void {
  if (this.isBrowser) {
    window.removeEventListener('resize', () => this.checkScreenSize()); // Cleanup
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.map) this.map.remove();
  }
}

/*
@HostListener('window:resize', ['$event'])
onResize() {
  this.checkScreenSize();
}
*/

  private checkScreenSize() {
  if (this.isBrowser) {
    this.isMobileView = window.innerWidth <= 768;
  }
}

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  private initMap(): void {
    this.map = this.L.map('vehicle-map', {
      center: this.PALESTINE_CENTER,
      zoom: this.DEFAULT_ZOOM,
      zoomControl: false 
    });

    // Zoom control on Left (since layout is RTL)
    this.L.control.zoom({ position: 'topleft' }).addTo(this.map);

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20
    }).addTo(this.map);
  }

  loadVehicleLocations(): void {
    this.isLoading.set(true);
    this.vehicleService.getAllVehicleLocations().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.updateMarkers(data);
        this.lastUpdate.set(new Date());
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('فشل تحميل مواقع المركبات');
        this.isLoading.set(false);
      }
    });
  }

  private updateMarkers(vehicles: VehicleLocation[]): void {
    const currentIds = new Set(vehicles.map(v => v.id));

    this.markers.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    });

    vehicles.forEach(vehicle => {
      if (!vehicle.latitude || !vehicle.longitude) return;

      const latLng: any = [vehicle.latitude, vehicle.longitude];
      const isSelected = this.selectedVehicle()?.id === vehicle.id;

      if (this.markers.has(vehicle.id)) {
        const marker = this.markers.get(vehicle.id)!;
        marker.setLatLng(latLng);
        marker.setIcon(this.createModernIcon(vehicle, isSelected));
        // Ensure z-index is higher if selected
        marker.setZIndexOffset(isSelected ? 1000 : 0);
      } else {
        const marker = this.L.marker(latLng, { 
          icon: this.createModernIcon(vehicle, false) 
        }).addTo(this.map);

        marker.on('click', () => {
          this.centerOnVehicle(vehicle);
        });

        this.markers.set(vehicle.id, marker);
      }
    });
  }

  private createModernIcon(vehicle: VehicleLocation, isSelected: boolean): any {
    const color = this.STATUS_COLORS[vehicle.status] || '#6c757d';
    const pulseHtml = isSelected ? `<div class="marker-pulse" style="background-color: ${color}"></div>` : '';

    return this.L.divIcon({
      className: 'custom-marker-wrapper',
      html: `
        <div style="position: relative;">
          ${pulseHtml}
          <div class="marker-pin-modern" style="color: ${color}; border-color: white;">
            <i class="fas fa-ambulance" style="font-size: 1.5rem;"></i>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
  }

  
  centerOnVehicle(vehicle: VehicleLocation): void {
    if (vehicle.latitude && vehicle.longitude) {
      this.selectedVehicle.set(vehicle);
      
      // On mobile, maybe we want to auto-close the sidebar to show the map?
      if (this.isMobileView) {
        this.isSidebarOpen.set(false);
      }

      this.map.flyTo([vehicle.latitude, vehicle.longitude], 15, {
        duration: 1.5
      });
      this.updateMarkers(this.vehicles());
    }
  }

  centerOnPalestine(): void {
    this.map.flyTo(this.PALESTINE_CENTER, this.DEFAULT_ZOOM, { duration: 1 });
    this.selectedVehicle.set(null);
    this.searchText.set('');
    this.updateMarkers(this.vehicles());
  }

  getStatusColor(status: string): string {
    return this.STATUS_COLORS[status] || '#6c757d';
  }

  getVehiclesWithLocation(): VehicleLocation[] {
    return this.vehicles().filter(v => v.latitude && v.longitude);
  }

  formatLastUpdate(): string {
    return this.lastUpdate()?.toLocaleTimeString('ar-EG') || '';
  }
}