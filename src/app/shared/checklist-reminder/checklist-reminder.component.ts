import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checklist-reminder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checklist-reminder.component.html',
  styleUrl: './checklist-reminder.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistReminderComponent {
  isOpen = input.required<boolean>();
  vehicleName = input.required<string>();

  openChecklist = output<void>();
  dismiss = output<void>();

  onOpenChecklist(): void {
    this.openChecklist.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}
