/**
 * Vehicle Document Interface
 * Represents the master vehicle record (one per VIN)
 */
export interface VehicleDocument {
  id: string;
  vin: string; // Partition key - globally unique
  make: string;
  model: string;
  trim: string;
  year: number;
  bodyStyle: string;
  specification: VehicleSpecification;
  battery: VehicleBattery;
  performance: VehiclePerformance;
  features: VehicleFeatures;
  sync: VehicleSync;
  metadata: VehicleMetadata;
}

/**
 * Vehicle Specification
 */
export interface VehicleSpecification {
  exteriorColor: string;
  interiorColor: string;
  seatConfiguration: string;
  doors: number;
  seats: number;
  steeringWheel: "Round" | "Yoke";
}

/**
 * Vehicle Battery Information
 */
export interface VehicleBattery {
  capacityKWh: number;
  rangeEPA: number;
  batteryHealth: "Excellent" | "Good" | "Average" | "Fair" | "Poor";
  charging: VehicleCharging;
}

/**
 * Vehicle Charging Information
 */
export interface VehicleCharging {
  chargerType: string; // e.g., "Supercharger", "Destination Charger"
  chargingPort: string; // e.g., "Type 2", "CCS", "NACS"
  chargeTimeHrs: number;
  quickChargeTimeMins: number;
}

/**
 * Vehicle Performance Information
 */
export interface VehiclePerformance {
  enginePowerHP: number;
  acceleration: string; // e.g., "0-60 in 3.8s"
  driveTrain: string; // e.g., "AWD", "RWD"
  transmission: string; // e.g., "1-speed automatic"
  topSpeedMph: number;
}

/**
 * Vehicle Features
 */
export interface VehicleFeatures {
  autopilot: string; // e.g., "AP1", "AP2", "AP2.5", "AP3"
  hasAutopilot: boolean;
  hasWarranty: boolean;
  IsFullSelfDriving: boolean;
  premiumPackage: boolean;
  wheels: string; // e.g., "22\" Turbine Wheels"
  satNav: boolean;
  cruiseControl: boolean;
  extras: string[];
}

/**
 * Vehicle Sync Information
 */
export interface VehicleSync {
  externalRefs: VehicleExternalRefs;
  isDuplicate: boolean;
}

/**
 * Vehicle External References
 */
export interface VehicleExternalRefs {
  carfaxId: string | null;
  autotraderId: string | null;
}

/**
 * Vehicle Metadata
 */
export interface VehicleMetadata {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
