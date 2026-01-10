import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private audio = new Audio('alert.mp3');
constructor() {
    this.audio.loop = true; // Keep ringing until acted upon
  }
async initNotificationSystem() {
    // 1. Request Permission
    const permission = await Notification.requestPermission();
    
    // 2. "Unlock" audio context (Browsers require a user gesture like Login)
    this.audio.play().then(() => {
      this.audio.pause();
      this.audio.currentTime = 0;
    }).catch(e => console.log("Audio ready for later"));
  }

  playIncomingAlert() {
    this.audio.play().catch(e => console.error("Audio failed", e));
  }

  stopAlert() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  showNotification(patientName: string) {
    if (Notification.permission === 'granted') {
      const n = new Notification("رحلة جديدة", {
        body: `مريض: ${patientName}`,
        icon: 'assets/icons/logo.png',
        tag: 'new-trip', // Ensures only one notification shows
        requireInteraction: true // Keeps it on screen until clicked
      });

      n.onclick = () => {
        this.stopAlert();
        window.focus();
      };
    }
  }
}