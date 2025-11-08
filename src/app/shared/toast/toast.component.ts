import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): void {
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      duration
    };

    this.toasts.update(toasts => [...toasts, toast]);

    setTimeout(() => {
      this.remove(toast.id);
    }, duration);
  }

  remove(id: number): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  getToastClass(type: string): string {
    const baseClasses = 'toast-item';
    switch (type) {
      case 'success':
        return `${baseClasses} toast-success`;
      case 'error':
        return `${baseClasses} toast-error`;
      case 'warning':
        return `${baseClasses} toast-warning`;
      case 'info':
        return `${baseClasses} toast-info`;
      default:
        return baseClasses;
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  }
}
