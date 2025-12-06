export interface VehicleDriverSession {
  sessionId: string;
  vehicleId: string;
  vehicleName: string;
  driverId: string;
  checklistRequired: boolean;
  checklistCompleted: boolean;
  sessionStart: string;
  lastDismissed?: string;
  canShowReminder: boolean;
}

export interface ChecklistItem {
  name: string;
  category: string;
  order: number;
  isAvailable: boolean;
  quantity: number | null;
  notes: string;
}

export interface VehicleChecklist {
  id?: string;
  sessionId: string;
  vehicleId: string;
  vehicleName?: string;
  driverId: string;
  driverName?: string;
  completedAt?: string;
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  generalNotes: string;
  items: ChecklistItem[];
}

export interface ChecklistReminderStatus {
  shouldShowReminder: boolean;
  minutesSinceLastDismissal?: number;
  checklistCompleted: boolean;
}

// Complete list of 65 checklist items from the JSON
export const CHECKLIST_ITEMS: Omit<ChecklistItem, 'isAvailable' | 'quantity' | 'notes'>[] = [
  { name: 'Normal saline 0,9%', category: 'IV Fluids', order: 1 },
  { name: 'D\\W 5%', category: 'IV Fluids', order: 2 },
  { name: 'Ringer lactate', category: 'IV Fluids', order: 3 },
  { name: 'Non sterile gloves', category: 'Personal Protection', order: 4 },
  { name: 'Crep Bandage', category: 'Wound Care', order: 5 },
  { name: 'Arterial Tourniquet', category: 'Trauma Equipment', order: 6 },
  { name: 'Delivery Kit', category: 'Obstetric Equipment', order: 7 },
  { name: 'Quick cold', category: 'Miscellaneous', order: 8 },
  { name: 'Syringes 5cc', category: 'Syringes & Needles', order: 9 },
  { name: 'syringes 10cc', category: 'Syringes & Needles', order: 10 },
  { name: 'needles', category: 'Syringes & Needles', order: 11 },
  { name: 'I.V set', category: 'Syringes & Needles', order: 12 },
  { name: 'Triangular Bandage', category: 'Wound Care', order: 13 },
  { name: 'I.V cannnula G 14', category: 'Syringes & Needles', order: 14 },
  { name: 'I.V cannnula G 16', category: 'Syringes & Needles', order: 15 },
  { name: 'I.V cannnula G 18', category: 'Syringes & Needles', order: 16 },
  { name: 'I.V cannnula G 20', category: 'Syringes & Needles', order: 17 },
  { name: 'I.V cannnula G 22', category: 'Syringes & Needles', order: 18 },
  { name: 'Plaster Roll', category: 'Wound Care', order: 19 },
  { name: 'Urinal Bottle', category: 'Patient Care', order: 20 },
  { name: 'Kidney Receiver', category: 'Patient Care', order: 21 },
  { name: 'Metal Splints', category: 'Splints & Immobilization', order: 22 },
  { name: 'Oral air way', category: 'Airway Management', order: 23 },
  { name: 'O2 Nasal cannula Adult', category: 'Oxygen Equipment', order: 24 },
  { name: 'O2 Nasal cannula child', category: 'Oxygen Equipment', order: 25 },
  { name: 'O2 Nasal face mask Adult', category: 'Oxygen Equipment', order: 26 },
  { name: 'O2 Nasal face mask child', category: 'Oxygen Equipment', order: 27 },
  { name: 'E.T tube', category: 'Airway Management', order: 28 },
  { name: 'Field Bandage', category: 'Wound Care', order: 29 },
  { name: 'Gauze Pad', category: 'Wound Care', order: 30 },
  { name: 'Gauze roll', category: 'Wound Care', order: 31 },
  { name: 'Alcohol swap', category: 'Wound Care', order: 32 },
  { name: 'Alcohol solution 70%', category: 'Wound Care', order: 33 },
  { name: 'Thermometer', category: 'Diagnostic Equipment', order: 34 },
  { name: 'Sharp Container', category: 'Miscellaneous', order: 35 },
  { name: 'Cotton', category: 'Wound Care', order: 36 },
  { name: 'O2 cylinder S', category: 'Oxygen Equipment', order: 37 },
  { name: 'suction tube', category: 'Airway Management', order: 38 },
  { name: 'Long board', category: 'Patient Transport', order: 39 },
  { name: 'Non rebreathing o2 mask (A)', category: 'Oxygen Equipment', order: 40 },
  { name: 'Tongue Depressor', category: 'Airway Management', order: 41 },
  { name: 'Poston splint', category: 'Splints & Immobilization', order: 42 },
  { name: 'Bed cover', category: 'Patient Transport', order: 43 },
  { name: 'Emergency Blanket', category: 'Patient Transport', order: 44 },
  { name: 'Stethoscope', category: 'Diagnostic Equipment', order: 45 },
  { name: 'Short Board', category: 'Patient Transport', order: 46 },
  { name: 'Scissor', category: 'Miscellaneous', order: 47 },
  { name: 'Neck collars M', category: 'Splints & Immobilization', order: 48 },
  { name: 'neck collars L', category: 'Splints & Immobilization', order: 49 },
  { name: 'neck collars S', category: 'Splints & Immobilization', order: 50 },
  { name: 'Pocket Mask', category: 'Airway Management', order: 51 },
  { name: 'Ambo Bag A', category: 'Airway Management', order: 52 },
  { name: 'Ambo Bag C', category: 'Airway Management', order: 53 },
  { name: 'Ambo Bag infant', category: 'Airway Management', order: 54 },
  { name: 'Traction Splint', category: 'Splints & Immobilization', order: 55 },
  { name: 'manual sphygmomanometer', category: 'Diagnostic Equipment', order: 56 },
  { name: 'arterial Tourniquet rubber', category: 'Trauma Equipment', order: 57 },
  { name: 'laryngal mask', category: 'Airway Management', order: 58 }
];
