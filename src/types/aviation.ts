export type FlightStatus =
  | 'SCHEDULED'
  | 'TOUCHED_DOWN'
  | 'CHOCKS_ON'
  | 'DOOR_OPEN'
  | 'BOARDING'
  | 'DOOR_CLOSED'
  | 'PUSHED_BACK'
  | 'DEPARTED'
  | 'CANCELLED';

export type FuelStatus = 'PENDING' | 'ENTERED_BY_RAMP' | 'VERIFIED_BY_LC' | 'DISCREPANCY';

export type LoadControlStatus =
  | 'PENDING_FUEL'
  | 'FUEL_CONFIRMED'
  | 'LOADSHEET_GENERATING'
  | 'LOADSHEET_RELEASED'
  | 'TRIM_COMPLETED';

export type FuelUnit = 'KG' | 'LBS';

export type UserRole = 'COVERAGE_MAN' | 'LOAD_CONTROLLER' | 'ANALYST' | 'FLIGHT_BOARD';

export interface FuelData {
  fuelUnit: FuelUnit;
  arrivalFuel?: number;       // Remaining fuel upon landing/in-block
  requestedFuel?: number;     // Planned ramp fuel requested from dispatch
  upliftFuel?: number;        // Actual fuel delivered by bowser/hydrant
  captainFinalFuel?: number;  // Final total fuel confirmed by Captain
  density?: number;           // Specific gravity e.g. 0.804 kg/l
  captainSignOff?: string;    // Captain's name/ID
  captainConfirmedAt?: string;// Timestamp of captain sign-off
  fuelStatus: FuelStatus;
  discrepancyReason?: string;
  variance?: number;          // Difference between (Arrival + Uplift) and Captain figure
}

export interface FlightTurn {
  id: string;
  flightNumber: string;
  aircraftReg: string;
  captName?: string;          // Captain name e.g. "Capt. Vance"
  crewCount?: string;         // Crew count ratio e.g. "2/5"
  crewName?: string;          // Crew / Captain name
  flightDate?: string;        // YYYY-MM-DD for date filtering & XLSX export
  aircraftType: string;
  originAirport: string;
  destAirport: string;
  gate: string;
  stand: string;
  status: FlightStatus;
  
  // Scheduled & Target Timestamps (ISO string)
  scheduledArrival: string;
  scheduledDeparture: string;
  targetOffBlockTime: string;  // TOBT
  minimumGroundTimeMinutes: number; // MGT (e.g. 40 min)
  
  // Actual Recorded Milestone Timestamps (ISO string or HHmm 4-digit)
  touchDownTime?: string;     // ALDT - Actual Landing Time e.g. "2210"
  chocksOnTime?: string;      // AIBT - Actual In-Block Time e.g. "2220"
  doorOpenTime?: string;      // Doors open e.g. "2222"
  doorCloseTime?: string;     // Doors closed
  pushBackTime?: string;      // AOBT - Pushback e.g. "2350"

  touchDownRecorded?: boolean;
  chocksOnRecorded?: boolean;
  doorOpenRecorded?: boolean;
  pushBackRecorded?: boolean;

  // Simple direct fuel figures from Coverage Man to Load Controller
  blockFuel?: number;         // e.g. 5000
  tripFuel?: number;          // e.g. 1000
  taxiFuel?: number;          // e.g. 400
  fuelSentAt?: string;

  // Fuel telemetry
  fuelUnit: FuelUnit;
  arrivalFuel?: number;
  requestedFuel?: number;
  upliftFuel?: number;
  captainFinalFuel?: number;
  density?: number;
  captainSignOff?: string;
  captainConfirmedAt?: string;
  fuelStatus: FuelStatus;
  discrepancyReason?: string;

  // Load Control telemetry
  loadControlStatus: LoadControlStatus;
  loadControllerNotes?: string;
  coverageManNotes?: string;
  coverageManName?: string;
  loadControllerName?: string;
  
  // Performance & Delays
  delayMinutes?: number;
  delayReasonCode?: string;    // Standard IATA Delay Code
  delayDescription?: string;
  paxCount?: number;
  cargoWeight?: number;        // kg
  baggageWeight?: number;      // kg

  createdAt: string;
  updatedAt: string;
}

export interface OperationalMessage {
  id: string;
  flightId: string;
  senderRole: 'COVERAGE_MAN' | 'LOAD_CONTROLLER' | 'SYSTEM';
  senderName: string;
  message: string;
  messageType: 'FUEL_ALERT' | 'MILESTONE_UPDATE' | 'DELAY_WARNING' | 'CHAT' | 'LOADSHEET_ACK';
  timestamp: string;
}

export interface TurnaroundLog {
  id: string;
  flightId: string;
  action: string;
  operatorRole: string;
  operatorName: string;
  details: string;
  timestamp: string;
}

export interface TurnaroundMetrics {
  totalFlights: number;
  activeTurnarounds: number;
  completedTurns: number;
  onTimePerformanceRate: number; // Percentage (e.g. 88.5%)
  averageGroundTimeMinutes: number;
  averageTaxiInMinutes: number;
  averageDoorOpenLatencyMinutes: number;
  averageTurnDurationMinutes: number;
  fuelDiscrepancyCount: number;
  delayCodeDistribution: Record<string, number>;
}
