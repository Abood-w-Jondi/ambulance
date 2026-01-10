import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService, VehicleLocation } from '../../shared/services/vehicle.service';
import { ToastService } from '../../shared/services/toast.service';
import { GlobalVarsService } from '../../global-vars.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-vehicle-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-map.component.html',
  styleUrls: ['./vehicle-map.component.css']
})
export class VehicleMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private refreshInterval: any;
  public isMobileView = false;

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

  private readonly PALESTINE_CENTER: L.LatLngExpression = [31.5, 35.0];
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
    private globalVars: GlobalVarsService
  ) {
    this.globalVars.setGlobalHeader('خريطة المركبات');
    this.checkScreenSize();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadVehicleLocations();
    
    this.refreshInterval = setInterval(() => {
      this.loadVehicleLocations();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.map) this.map.remove();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobileView = window.innerWidth <= 768;
    // Optional: Auto-close on mobile load if you want
    // if (this.isMobileView) this.isSidebarOpen.set(false);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

 private initMap(): void {
  this.map = L.map('vehicle-map', {
    center: this.PALESTINE_CENTER,
    zoom: this.DEFAULT_ZOOM,
    zoomControl: false 
  });

  L.control.zoom({ position: 'topleft' }).addTo(this.map);

  // Define multiple base layers
  const baseLayers = {
    'الخريطة الأساسية': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20
    }),
    'عرض تفصيلي': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }),
    'الخدمات الطبية': L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors, HOT',
      maxZoom: 20
    }),
    'صور القمر الصناعي': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18
    })
  };

  // Add default layer
  baseLayers['عرض تفصيلي'].addTo(this.map);

  // Add layer control to switch between them
  L.control.layers(baseLayers, {}, { position: 'topleft' }).addTo(this.map);
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

      const latLng: L.LatLngExpression = [vehicle.latitude, vehicle.longitude];
      const isSelected = this.selectedVehicle()?.id === vehicle.id;

      if (this.markers.has(vehicle.id)) {
        const marker = this.markers.get(vehicle.id)!;
        marker.setLatLng(latLng);
        marker.setIcon(this.createModernIcon(vehicle, isSelected));
        // Ensure z-index is higher if selected
        marker.setZIndexOffset(isSelected ? 1000 : 0);
      } else {
        const marker = L.marker(latLng, { 
          icon: this.createModernIcon(vehicle, false) 
        }).addTo(this.map);

        marker.on('click', () => {
          this.centerOnVehicle(vehicle);
        });

        this.markers.set(vehicle.id, marker);
      }
    });
  }

  private createModernIcon(vehicle: VehicleLocation, isSelected: boolean): L.DivIcon {
    const color = this.STATUS_COLORS[vehicle.status] || '#6c757d';
    const pulseHtml = isSelected ? `<div class="marker-pulse" style="background-color: ${color}"></div>` : '';

    return L.divIcon({
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