import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getStatusColor,
  TRANSFER_STATUS_COLORS,
  VEHICLE_STATUS_COLORS,
  DRIVER_STATUS_COLORS,
  MAINTENANCE_STATUS_COLORS
} from '../constants/status.constants';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.css']
})
export class StatusBadgeComponent {
  @Input() set status(value: string) {
    this._status.set(value);
  }
  @Input() set type(value: 'transfer' | 'vehicle' | 'driver' | 'maintenance') {
    this._type.set(value);
  }
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  private _status = signal('');
  private _type = signal<'transfer' | 'vehicle' | 'driver' | 'maintenance'>('transfer');

  statusColor = computed(() => {
    return getStatusColor(this._status(), this._type());
  });

  get statusValue(): string {
    return this._status();
  }

  get sizeClass(): string {
    return `badge-${this.size}`;
  }
}
