import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class AcceptTripsComponent implements OnInit {
  pendingTrips: PendingTrip[] = [];
  acceptedTrips: PendingTrip[] = [];
  
  selectedTab: 'pending' | 'accepted' = 'pending';
  isLoading: boolean = false;
  
  selectedTrip: PendingTrip | null = null;
  showDetailsModal: boolean = false;
  
  // Sound notification
  notificationSound: HTMLAudioElement | null = null;

  constructor() { }

  ngOnInit(): void {
    this.loadTrips();
    this.startAutoRefresh();
    this.initNotificationSound();
  }

  ngOnDestroy(): void {
    // Stop auto refresh when component is destroyed
  }

  loadTrips(): void {
    this.isLoading = true;
    // TODO: Load trips from service
    setTimeout(() => {
      this.pendingTrips = this.generateMockPendingTrips();
      this.acceptedTrips = this.generateMockAcceptedTrips();
      this.isLoading = false;
    }, 500);
  }

  startAutoRefresh(): void {
    // TODO: Implement auto-refresh every 30 seconds
    setInterval(() => {
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

  acceptTrip(trip: PendingTrip): void {
    // TODO: Call service to accept trip
    console.log('قبول الرحلة:', trip.id);
    
    trip.status = 'مقبول';
    this.pendingTrips = this.pendingTrips.filter(t => t.id !== trip.id);
    this.acceptedTrips.unshift(trip);
    
    // Show success message
    alert('تم قبول الرحلة بنجاح!');
  }

  rejectTrip(trip: PendingTrip): void {
    // TODO: Call service to reject trip
    console.log('رفض الرحلة:', trip.id);
    
    trip.status = 'مرفوض';
    this.pendingTrips = this.pendingTrips.filter(t => t.id !== trip.id);
    
    // Show info message
    alert('تم رفض الرحلة.');
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