import { Component, OnInit, signal, computed, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChecklistService } from '../../shared/services/checklist.service';
import { ToastService } from '../../shared/services/toast.service';
import { VehicleCookieService } from '../../shared/services/vehicle-cookie.service';
import { ChecklistItem, CHECKLIST_ITEMS, VehicleChecklist } from '../../shared/models/checklist.model';
import { GlobalVarsService } from '../../global-vars.service';
import { ConfirmationModalComponent , ConfirmationModalConfig} from '../../shared/confirmation-modal/confirmation-modal.component';
@Component({
  selector: 'app-vehicle-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './vehicle-checklist.component.html',
  styleUrl: './vehicle-checklist.component.css'
})
export class VehicleChecklistComponent implements OnInit {
  loading = signal(false);
  sessionId = signal<string | null>(null);
  vehicleName = signal<string>('');

  items = signal<ChecklistItem[]>([]);
  generalNotes = signal('');

  // Track which category is expanded in accordion
  expandedCategory = signal<string | null>(null);

  //conformation modal

  isCancelModalOpen = signal(false);
  cancelModalConfig: ConfirmationModalConfig = {
    type: 'delete',
    title: 'تأكيد الإلغاء',
    message: 'هل أنت متأكد من إلغاء الفحص؟ سيتم إلغاء جميع التغييرات وستظهر قائمة الفحص مرة أخرى كتذكير.',
    confirmButtonText: 'نعم، إلغاء',
    cancelButtonText: 'إبقاء الشاشة',
    highlightedText: 'إلغاء جميع التغييرات' // Optional highlight
  };

  
  // Group items by category
  categories = computed(() => {
    const items = this.items();
    const grouped = new Map<string, ChecklistItem[]>();

    items.forEach(item => {
      if (!grouped.has(item.category)) {
        grouped.set(item.category, []);
      }
      grouped.get(item.category)!.push(item);
    });

    return Array.from(grouped.entries()).map(([category, items]) => ({
      name: category,
      items: items.sort((a, b) => a.order - b.order)
    }));
  });

  // Validation - check if all items have availability selected
  allItemsChecked = computed(() => {
    return this.items().every(item =>
      item.isAvailable === true || item.isAvailable === false
    );
  });

  // Summary statistics
  availableCount = computed(() =>
    this.items().filter(item => item.isAvailable === true).length
  );

  unavailableCount = computed(() =>
    this.items().filter(item => item.isAvailable === false).length
  );

  uncheckedCount = computed(() =>
    this.items().filter(item => item.isAvailable !== true && item.isAvailable !== false).length
  );

  constructor(
    private checklistService: ChecklistService,
    private toastService: ToastService,
    private router: Router,
    private vehicleCookieService: VehicleCookieService,
    public globalVars: GlobalVarsService


  ) {
    this.globalVars.setGlobalHeader(' قائمة فحص المركبة ');
  }

  ngOnInit(): void {
    this.loadSession();
    this.initializeItems();
  }

  loadSession(): void {
    // Get vehicle ID from cookie
    const vehicleId = this.vehicleCookieService.getSelectedVehicleId();

    if (!vehicleId) {
      this.toastService.error('لم يتم تحديد المركبة');
      this.router.navigate(['/user/driver-dashboard']);
      return;
    }

    this.checklistService.getCurrentSession(vehicleId).subscribe({
      next: (response : any) => {
        if (response) {
          console.log('Loaded session info:', response); // DEBUG
          this.sessionId.set(response.sessionId);
          this.vehicleName.set(response.vehicleName);

          if (response.checklistCompleted) {
            this.toastService.warning('تم إكمال الفحص مسبقاً');
            this.router.navigate(['/user/driver-dashboard']);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load session:', err);
        this.toastService.error('فشل تحميل معلومات الجلسة');
      }
    });
  }

  initializeItems(): void {
    const initialItems: ChecklistItem[] = CHECKLIST_ITEMS.map(template => ({
      ...template,
      isAvailable: null as boolean | null, // Will be set by user
      quantity: null as number | null,
      notes: ''
    }));
    this.items.set(initialItems);
  }

 toggleCategory(categoryName: string): void {
    const isCurrentlyExpanded = this.expandedCategory() === categoryName;
    
    // 1. Update the expanded state immediately
    if (isCurrentlyExpanded) {
      this.expandedCategory.set(null);
    } else {
      this.expandedCategory.set(categoryName);
    }

    // 2. Add a small delay to allow Angular and Bootstrap's collapse transition
    // to complete and update the DOM before scrolling.
    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        // Find the accordion button element
        const headerElement = document.getElementById('header-' + categoryName);
        if (headerElement) {
          // Find the actual button inside the header
          const buttonElement = headerElement.querySelector('button');
          if (buttonElement) {
            // Scroll the button into view, aligning it to the top.
            buttonElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' // Aligns the top of the element to the top of the viewport
            });
          }
        }
      },50); // A slight delay (e.g., 350ms) to ensure the collapse transition finishes
    }
  }

  isCategoryExpanded(categoryName: string): boolean {
    return this.expandedCategory() === categoryName;
  }

  updateItemAvailability(index: number, isAvailable: boolean): void {
    this.items.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], isAvailable };
      return updated;
    });
  }

  updateItemQuantity(index: number, quantity: string): void {
    const numQuantity = quantity ? parseInt(quantity, 10) : null;
    this.items.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], quantity: numQuantity };
      return updated;
    });
  }

  updateItemNotes(index: number, notes: string): void {
    this.items.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], notes };
      return updated;
    });
  }

  submitChecklist(): void {
    if (!this.allItemsChecked()) {
      this.toastService.error('يجب فحص جميع العناصر (متوفر/غير متوفر) قبل الإرسال');
      return;
    }

    const sessionId = this.sessionId();
    if (!sessionId) {
      this.toastService.error('معلومات الجلسة غير متوفرة');
      return;
    }

    this.loading.set(true);

    const checklist: VehicleChecklist = {
      sessionId,
      vehicleId: '', // Will be filled from session on backend
      driverId: '', // Will be filled from auth on backend
      totalItems: this.items().length,
      availableItems: this.availableCount(),
      unavailableItems: this.unavailableCount(),
      generalNotes: this.generalNotes(),
      items: this.items()
    };

    this.checklistService.submitChecklist(checklist).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response) {
          this.toastService.success('تم حفظ قائمة الفحص بنجاح');
          this.router.navigate(['/user/driver-dashboard']);
        }
      },
      error: (err) => {
        console.error('Failed to submit checklist:', err);
        this.toastService.error('فشل حفظ قائمة الفحص');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    // Open the confirmation modal instead of using window.confirm
    this.isCancelModalOpen.set(true);
  }
  handleCancelConfirmation(confirmed: boolean): void {
    this.isCancelModalOpen.set(false); // Close the modal

    if (confirmed) {
      // Logic for confirmed cancellation
      this.toastService.info('تم إلغاء الفحص');
      this.router.navigate(['/user/driver-dashboard']);
    }
    // If not confirmed, do nothing (keep the user on the checklist page)
  }
}
