import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { TripService } from '../../shared/services/trip.service';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trip } from '../../shared/models/trip.model';

interface PendingTrip {
  id: string;
  patientName: string;
  patientAge: number;
  diagnosis: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: Date;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedEarnings: number;
  priority: 'عادي' | 'عاجل' | 'طارئ';
  status: 'معلق' | 'مقبول' | 'مرفوض';
  requestedAt: Date;
}

@Component({
  selector: 'app-accept-trips',
  imports: [FormsModule, CommonModule],
  templateUrl: './accept-trips.component.html',
  styleUrls: ['./accept-trips.component.css']
})
export class AcceptTripsComponent implements OnInit, OnDestroy {
  pendingTrips: any[] = [];  // Changed to use real Trip data
  acceptedTrips: PendingTrip[] = [];

  selectedTab: 'pending' | 'accepted' = 'pending';
  isLoading: boolean = false;

  selectedTrip: any | null = null;
  showDetailsModal: boolean = false;

  // Sound notification
  notificationSound: HTMLAudioElement | null = null;
  refreshInterval: any = null;

  constructor(
    private toastService: ToastService,
    private tripService: TripService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadTrips();
    this.startAutoRefresh();
    this.initNotificationSound();
  }

  ngOnDestroy(): void {
    // Stop auto refresh when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadTrips(): void {
    this.isLoading = true;
    const driverId = this.authService.currentUser()?.id;

    if (!driverId) {
      this.toastService.error('Driver ID not found');
      this.isLoading = false;
      return;
    }

    this.tripService.getAvailableTrips(driverId).subscribe({
      next: (trips) => {
        this.pendingTrips = trips;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load available trips:', error);
        this.toastService.error('فشل تحميل الرحلات المتاحة');
        this.isLoading = false;
      }
    });
  }

  startAutoRefresh(): void {
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadTrips();
    }, 30000);
  }

  initNotificationSound(): void {
    // TODO: Initialize notification sound
    // this.notificationSound = new Audio('assets/sounds/notification.mp3');
  }

  playNotificationSound(): void {
    if (this.notificationSound) {
      this.notificationSound.play();
    }
  }

  acceptTrip(trip: any): void {
    const driverId = this.authService.currentUser()?.id;

    if (!driverId) {
      this.toastService.error('Driver ID not found');
      return;
    }

    this.tripService.acceptTrip(trip.id, driverId).subscribe({
      next: () => {
        this.toastService.success(`تم قبول الرحلة للمريض ${trip.patientName}`);
        this.loadTrips();  // Reload trips to update the list
      },
      error: (error) => {
        console.error('Failed to accept trip:', error);
        this.toastService.error(error.error?.message || 'فشل قبول الرحلة');
      }
    });
  }

  rejectTrip(trip: any): void {
    // Note: Rejection logic may need to be implemented on backend
    console.log('رفض الرحلة:', trip.id);
    this.pendingTrips = this.pendingTrips.filter(t => t.id !== trip.id);
    this.toastService.info(`تم رفض الرحلة للمريض ${trip.patientName}`);
  }

  viewTripDetails(trip: PendingTrip): void {
    this.selectedTrip = trip;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTrip = null;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'عادي': 'bg-secondary',
      'عاجل': 'bg-warning',
      'طارئ': 'bg-danger'
    };
    return classes[priority] || 'bg-secondary';
  }

  getPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      'عادي': 'fa-info-circle',
      'عاجل': 'fa-exclamation-circle',
      'طارئ': 'fa-exclamation-triangle'
    };
    return icons[priority] || 'fa-info-circle';
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getTimeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'الآن';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }

  private generateMockPendingTrips(): PendingTrip[] {
    const priorities: Array<'عادي' | 'عاجل' | 'طارئ'> = ['عادي', 'عاجل', 'طارئ'];
    const pickupLocations = [
      'مستشفى الملك فيصل',
      'مستشفى الجامعة',
      'مركز صحي الروضة',
      'عيادة النخيل',
      'منزل - حي السلام'
    ];
    const dropoffLocations = [
      'مستشفى الملك خالد',
      'مستشفى القوات المسلحة',
      'مستشفى الحرس الوطني',
      'المستشفى التخصصي',
      'منزل - حي النهضة'
    ];
    const diagnoses = [
      'كسر في الساق',
      'آلام في الصدر',
      'حالة طارئة - ضيق تنفس',
      'جراحة مجدولة',
      'متابعة دورية'
    ];

    const mockTrips: PendingTrip[] = [];
    for (let i = 1; i <= 5; i++) {
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const requestedAt = new Date(Date.now() - Math.random() * 3600000); // Within last hour
      
      mockTrips.push({
        id: `pending_${i}`,
        patientName: `مريض ${i}`,
        patientAge: Math.floor(Math.random() * 70) + 10,
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        pickupLocation: pickupLocations[Math.floor(Math.random() * pickupLocations.length)],
        dropoffLocation: dropoffLocations[Math.floor(Math.random() * dropoffLocations.length)],
        pickupTime: new Date(Date.now() + Math.random() * 7200000), // Within next 2 hours
        estimatedDistance: Math.floor(Math.random() * 50) + 5,
        estimatedDuration: Math.floor(Math.random() * 60) + 15,
        estimatedEarnings: Math.floor(Math.random() * 200) + 50,
        priority: priority,
        status: 'معلق',
        requestedAt: requestedAt
      });
    }
    
    return mockTrips.sort((a, b) => {
      // Sort by priority first (طارئ > عاجل > عادي), then by request time
      const priorityOrder = { 'طارئ': 0, 'عاجل': 1, 'عادي': 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.requestedAt.getTime() - a.requestedAt.getTime();
    });
  }

  private generateMockAcceptedTrips(): PendingTrip[] {
    const mockTrips: PendingTrip[] = [];
    for (let i = 1; i <= 2; i++) {
      mockTrips.push({
        id: `accepted_${i}`,
        patientName: `مريض مقبول ${i}`,
        patientAge: Math.floor(Math.random() * 70) + 10,
        diagnosis: 'كسر في الذراع',
        pickupLocation: 'مستشفى الملك فيصل',
        dropoffLocation: 'مستشفى الجامعة',
        pickupTime: new Date(Date.now() + Math.random() * 3600000),
        estimatedDistance: Math.floor(Math.random() * 50) + 5,
        estimatedDuration: Math.floor(Math.random() * 60) + 15,
        estimatedEarnings: Math.floor(Math.random() * 200) + 50,
        priority: 'عادي',
        status: 'مقبول',
        requestedAt: new Date(Date.now() - Math.random() * 7200000)
      });
    }
    return mockTrips;
  }
}