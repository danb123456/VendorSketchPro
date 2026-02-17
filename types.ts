
export type ObjectType = 
  | 'Pagoda'
  | 'Tent'
  | 'Van/Truck'
  | 'Smoker'
  | 'Hot Hold'
  | 'Oven'
  | 'Fridge'
  | 'Freezer'
  | 'Baine Marie'
  | 'Asado'
  | 'Fryer'
  | 'Prep Table'
  | 'Other (Hot)'
  | 'Other (aesthetic)'
  | 'Other (cold)'
  | 'Other (misc)'
  | 'Pitmaster'
  | 'Chef'
  | 'Manager'
  | 'Server'
  | 'Service Point'
  | 'Collection Point'
  | 'Queue Barrier'
  | 'Fire Extinguisher'
  | 'Entry/Exit Point'
  | 'Bench Set'
  | 'Flag';

export interface StandObject {
  id: string;
  type: ObjectType;
  x: number; // in meters relative to boundary top-left
  y: number; // in meters
  width: number; // in meters
  length: number; // in meters
  rotation: number; // in degrees
  color: string;
}

export interface VendorInfo {
  vendorId: string;
  traderName: string;
}

export interface Boundary {
  width: number; // in meters
  length: number; // in meters
}

export const OBJECT_DEFAULTS: Record<ObjectType, { width: number, length: number, color: string, transparent: boolean, ignoreCollision: boolean }> = {
  'Pagoda': { width: 3, length: 3, color: 'rgba(59, 130, 246, 0.3)', transparent: true, ignoreCollision: true },
  'Tent': { width: 6, length: 10, color: 'rgba(148, 163, 184, 0.3)', transparent: true, ignoreCollision: true },
  'Van/Truck': { width: 2.5, length: 6, color: 'rgba(107, 114, 128, 0.3)', transparent: true, ignoreCollision: true },
  'Smoker': { width: 1.2, length: 1, color: 'rgba(31, 41, 55, 1)', transparent: false, ignoreCollision: false },
  'Hot Hold': { width: 0.8, length: 0.8, color: 'rgba(239, 68, 68, 1)', transparent: false, ignoreCollision: false },
  'Oven': { width: 0.9, length: 0.9, color: 'rgba(249, 115, 22, 1)', transparent: false, ignoreCollision: false },
  'Fridge': { width: 0.7, length: 0.7, color: 'rgba(14, 165, 233, 1)', transparent: false, ignoreCollision: false },
  'Freezer': { width: 0.7, length: 0.7, color: 'rgba(2, 132, 199, 1)', transparent: false, ignoreCollision: false },
  'Baine Marie': { width: 1.2, length: 0.6, color: 'rgba(245, 158, 11, 1)', transparent: false, ignoreCollision: false },
  'Asado': { width: 1.5, length: 1, color: 'rgba(185, 28, 28, 1)', transparent: false, ignoreCollision: false },
  'Fryer': { width: 0.6, length: 0.8, color: 'rgba(234, 179, 8, 1)', transparent: false, ignoreCollision: false },
  'Prep Table': { width: 2, length: 1, color: 'rgba(148, 163, 184, 1)', transparent: false, ignoreCollision: false },
  'Other (Hot)': { width: 1, length: 1, color: 'rgba(153, 27, 27, 1)', transparent: false, ignoreCollision: false },
  'Other (aesthetic)': { width: 0.5, length: 0.5, color: 'rgba(16, 185, 129, 1)', transparent: false, ignoreCollision: false },
  'Other (cold)': { width: 1, length: 1, color: 'rgba(56, 189, 248, 1)', transparent: false, ignoreCollision: false },
  'Other (misc)': { width: 1, length: 1, color: 'rgba(148, 163, 184, 1)', transparent: false, ignoreCollision: false },
  'Pitmaster': { width: 0.5, length: 0.5, color: 'rgba(220, 38, 38, 1)', transparent: false, ignoreCollision: false },
  'Chef': { width: 0.5, length: 0.5, color: 'rgba(255, 255, 255, 1)', transparent: false, ignoreCollision: false },
  'Manager': { width: 0.5, length: 0.5, color: 'rgba(30, 41, 59, 1)', transparent: false, ignoreCollision: false },
  'Server': { width: 0.5, length: 0.5, color: 'rgba(79, 70, 229, 1)', transparent: false, ignoreCollision: false },
  'Service Point': { width: 2, length: 0.6, color: 'rgba(16, 185, 129, 1)', transparent: false, ignoreCollision: false },
  'Collection Point': { width: 1, length: 0.6, color: 'rgba(139, 92, 246, 1)', transparent: false, ignoreCollision: false },
  'Queue Barrier': { width: 2, length: 0.1, color: 'rgba(100, 116, 139, 1)', transparent: false, ignoreCollision: true },
  'Fire Extinguisher': { width: 0.4, length: 0.4, color: 'rgba(220, 38, 38, 1)', transparent: false, ignoreCollision: true },
  'Entry/Exit Point': { width: 1.2, length: 0.2, color: 'rgba(34, 197, 94, 1)', transparent: false, ignoreCollision: true },
  'Bench Set': { width: 2, length: 1.5, color: 'rgba(120, 113, 108, 1)', transparent: false, ignoreCollision: false },
  'Flag': { width: 0.4, length: 0.4, color: 'rgba(244, 63, 94, 1)', transparent: false, ignoreCollision: true },
};
