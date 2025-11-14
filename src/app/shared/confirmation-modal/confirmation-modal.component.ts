import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfirmationModalType = 'delete' | 'warning' | 'info' | 'success';

export interface ConfirmationModalConfig {
    type: ConfirmationModalType;
    title: string;
    message: string;
    confirmButtonText: string;
    cancelButtonText: string;
    highlightedText?: string;
}

@Component({
    selector: 'app-confirmation-modal',
    imports: [CommonModule],
    templateUrl: './confirmation-modal.component.html',
    styleUrl: './confirmation-modal.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationModalComponent {
    // Input signals
    isOpen = input.required<boolean>();
    config = input.required<ConfirmationModalConfig>();

    // Output events
    confirmed = output<void>();
    cancelled = output<void>();

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
    }

    getHeaderClass(): string {
        const type = this.config().type;
        switch (type) {
            case 'delete':
                return 'bg-danger text-white';
            case 'warning':
                return 'bg-warning text-dark';
            case 'info':
                return 'bg-info text-white';
            case 'success':
                return 'bg-success text-white';
            default:
                return 'bg-secondary text-white';
        }
    }

    getConfirmButtonClass(): string {
        const type = this.config().type;
        switch (type) {
            case 'delete':
                return 'btn-danger';
            case 'warning':
                return 'btn-warning';
            case 'info':
                return 'btn-info';
            case 'success':
                return 'btn-success';
            default:
                return 'btn-secondary';
        }
    }

    getHighlightClass(): string {
        const type = this.config().type;
        switch (type) {
            case 'delete':
                return 'fw-bold text-danger';
            case 'warning':
                return 'fw-bold text-warning';
            case 'info':
                return 'fw-bold text-info';
            case 'success':
                return 'fw-bold text-success';
            default:
                return 'fw-bold';
        }
    }

    getMessageWithHighlight(): string {
        const config = this.config();
        if (config.highlightedText) {
            const highlightClass = this.getHighlightClass();
            return config.message.replace(
                config.highlightedText,
                `<span class="${highlightClass}">${config.highlightedText}</span>`
            );
        }
        return config.message;
    }
}
