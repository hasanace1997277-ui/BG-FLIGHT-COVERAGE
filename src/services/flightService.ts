import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  FlightTurn,
  FlightStatus,
  FuelStatus,
  LoadControlStatus,
  OperationalMessage,
  TurnaroundLog,
  FuelData,
} from '../types/aviation';

const FLIGHTS_COLLECTION = 'flights';

// Initial sample flights for airlines turnaround operations
export const SAMPLE_FLIGHTS: Omit<FlightTurn, 'id'>[] = [
  {
    flightNumber: 'BG147/11NOV26',
    aircraftReg: 'S2-ALC',
    captName: 'Capt. Vance',
    crewCount: '2/5',
    crewName: 'Capt. Vance (2/5)',
    flightDate: '2026-11-11',
    aircraftType: 'B777-300ER',
    originAirport: 'DAC',
    destAirport: 'LHR',
    gate: 'B14',
    stand: 'S22',
    status: 'TOUCHED_DOWN',
    scheduledArrival: new Date(Date.now() - 35 * 60000).toISOString(),
    scheduledDeparture: new Date(Date.now() + 45 * 60000).toISOString(),
    targetOffBlockTime: new Date(Date.now() + 45 * 60000).toISOString(),
    minimumGroundTimeMinutes: 60,
    touchDownTime: '2210',
    chocksOnTime: '2220',
    doorOpenTime: '2222',
    pushBackTime: '2350',
    touchDownRecorded: true,
    chocksOnRecorded: false,
    doorOpenRecorded: false,
    pushBackRecorded: false,
    blockFuel: 5000,
    tripFuel: 1000,
    taxiFuel: 400,
    fuelUnit: 'KG',
    arrivalFuel: 12400,
    requestedFuel: 5000,
    upliftFuel: 4000,
    captainFinalFuel: 5000,
    density: 0.803,
    captainSignOff: 'Capt. Vance',
    captainConfirmedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    fuelStatus: 'ENTERED_BY_RAMP',
    loadControlStatus: 'PENDING_FUEL',
    coverageManName: 'H. Razak (Apron Team 3)',
    loadControllerName: 'M. Farooq (CLP Desk 2)',
    delayMinutes: 0,
    paxCount: 312,
    cargoWeight: 14200,
    baggageWeight: 6850,
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    flightNumber: 'EK 029',
    aircraftReg: 'A6-EEO',
    aircraftType: 'A380-800',
    originAirport: 'DXB',
    destAirport: 'LHR',
    gate: 'A03',
    stand: 'A03',
    status: 'TOUCHED_DOWN',
    scheduledArrival: new Date(Date.now() - 10 * 60000).toISOString(),
    scheduledDeparture: new Date(Date.now() + 80 * 60000).toISOString(),
    targetOffBlockTime: new Date(Date.now() + 80 * 60000).toISOString(),
    minimumGroundTimeMinutes: 75,
    touchDownTime: new Date(Date.now() - 8 * 60000).toISOString(),
    fuelUnit: 'KG',
    requestedFuel: 92000,
    fuelStatus: 'PENDING',
    loadControlStatus: 'PENDING_FUEL',
    coverageManName: 'J. Reynolds (Ramp Lead)',
    loadControllerName: 'S. Patel (Load Office)',
    delayMinutes: 0,
    paxCount: 468,
    cargoWeight: 18500,
    baggageWeight: 11200,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    flightNumber: 'BA 884',
    aircraftReg: 'G-EUYL',
    aircraftType: 'A320-200',
    originAirport: 'CDG',
    destAirport: 'LHR',
    gate: 'C21',
    stand: 'C21',
    status: 'BOARDING',
    scheduledArrival: new Date(Date.now() - 50 * 60000).toISOString(),
    scheduledDeparture: new Date(Date.now() + 15 * 60000).toISOString(),
    targetOffBlockTime: new Date(Date.now() + 15 * 60000).toISOString(),
    minimumGroundTimeMinutes: 40,
    touchDownTime: new Date(Date.now() - 48 * 60000).toISOString(),
    chocksOnTime: new Date(Date.now() - 42 * 60000).toISOString(),
    doorOpenTime: new Date(Date.now() - 40 * 60000).toISOString(),
    fuelUnit: 'KG',
    arrivalFuel: 3200,
    requestedFuel: 9800,
    upliftFuel: 6600,
    captainFinalFuel: 9800,
    density: 0.801,
    captainSignOff: 'Capt. Oliver Sterling',
    captainConfirmedAt: new Date(Date.now() - 22 * 60000).toISOString(),
    fuelStatus: 'VERIFIED_BY_LC',
    loadControlStatus: 'LOADSHEET_RELEASED',
    coverageManName: 'D. Clark (Apron 1)',
    loadControllerName: 'E. Davies (CLP Central)',
    delayMinutes: 0,
    paxCount: 164,
    cargoWeight: 2100,
    baggageWeight: 2450,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    flightNumber: 'SQ 318',
    aircraftReg: '9V-SMA',
    aircraftType: 'A350-900',
    originAirport: 'SIN',
    destAirport: 'LHR',
    gate: 'B32',
    stand: 'B32',
    status: 'CHOCKS_ON',
    scheduledArrival: new Date(Date.now() - 28 * 60000).toISOString(),
    scheduledDeparture: new Date(Date.now() + 65 * 60000).toISOString(),
    targetOffBlockTime: new Date(Date.now() + 75 * 60000).toISOString(),
    minimumGroundTimeMinutes: 65,
    touchDownTime: new Date(Date.now() - 26 * 60000).toISOString(),
    chocksOnTime: new Date(Date.now() - 18 * 60000).toISOString(),
    doorOpenTime: new Date(Date.now() - 16 * 60000).toISOString(),
    fuelUnit: 'KG',
    arrivalFuel: 10800,
    requestedFuel: 54000,
    upliftFuel: 42500,
    captainFinalFuel: 53300, // Discrepancy! 10800 + 42500 = 53300 vs 54000
    density: 0.805,
    captainSignOff: 'Capt. Wei Lim',
    captainConfirmedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    fuelStatus: 'DISCREPANCY',
    discrepancyReason: 'Bowser uplift receipt indicates 42,500 KG. Total 53,300 KG is 700 KG below planned 54,000 KG. Captain approved revised burn.',
    loadControlStatus: 'PENDING_FUEL',
    coverageManName: 'K. Tan (Apron 4)',
    loadControllerName: 'A. Kumar (CLP Desk 1)',
    delayMinutes: 10,
    delayReasonCode: '63',
    delayDescription: 'Late fueling equipment repositioning from stand B28',
    paxCount: 285,
    cargoWeight: 11200,
    baggageWeight: 5900,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    flightNumber: 'LH 914',
    aircraftReg: 'D-AIZC',
    aircraftType: 'A320neo',
    originAirport: 'FRA',
    destAirport: 'LHR',
    gate: 'A12',
    stand: 'A12',
    status: 'SCHEDULED',
    scheduledArrival: new Date(Date.now() + 18 * 60000).toISOString(),
    scheduledDeparture: new Date(Date.now() + 70 * 60000).toISOString(),
    targetOffBlockTime: new Date(Date.now() + 70 * 60000).toISOString(),
    minimumGroundTimeMinutes: 40,
    fuelUnit: 'KG',
    requestedFuel: 8400,
    fuelStatus: 'PENDING',
    loadControlStatus: 'PENDING_FUEL',
    coverageManName: 'T. Becker (Ramp 2)',
    loadControllerName: 'M. Farooq (CLP Desk 2)',
    delayMinutes: 0,
    paxCount: 172,
    cargoWeight: 1800,
    baggageWeight: 2600,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

// Subscribe to all flights in real-time
export function subscribeToFlights(callback: (flights: FlightTurn[]) => void): () => void {
  const flightsRef = collection(db, FLIGHTS_COLLECTION);
  const q = query(flightsRef, orderBy('scheduledArrival', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const flights: FlightTurn[] = [];
      snapshot.forEach((docSnap) => {
        flights.push({ id: docSnap.id, ...(docSnap.data() as Omit<FlightTurn, 'id'>) });
      });
      callback(flights);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, FLIGHTS_COLLECTION);
    }
  );
}

// Seed initial operational flights if database is empty
export async function seedInitialFlightsIfEmpty(): Promise<void> {
  try {
    const flightsRef = collection(db, FLIGHTS_COLLECTION);
    const snapshot = await getDocs(flightsRef);
    if (snapshot.empty) {
      for (const flight of SAMPLE_FLIGHTS) {
        const newDocRef = doc(flightsRef);
        await setDoc(newDocRef, flight);
        
        // Add initial system message and audit log
        const messagesRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${newDocRef.id}/messages`));
        await setDoc(messagesRef, {
          flightId: newDocRef.id,
          senderRole: 'SYSTEM',
          senderName: 'AeroTurn OCC Dispatch',
          message: `Flight ${flight.flightNumber} inbound from ${flight.originAirport}. Assigned Gate ${flight.gate} / Stand ${flight.stand}.`,
          messageType: 'MILESTONE_UPDATE',
          timestamp: flight.scheduledArrival,
        });

        const logsRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${newDocRef.id}/logs`));
        await setDoc(logsRef, {
          flightId: newDocRef.id,
          action: 'TURNAROUND_INITIALIZED',
          operatorRole: 'SYSTEM',
          operatorName: 'Dispatch Automation',
          details: `Flight turn scheduled with target ground time ${flight.minimumGroundTimeMinutes}m.`,
          timestamp: flight.createdAt,
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, FLIGHTS_COLLECTION);
  }
}

// Reset/reseed demo data
export async function reseedDemoFlights(): Promise<void> {
  try {
    const flightsRef = collection(db, FLIGHTS_COLLECTION);
    const snapshot = await getDocs(flightsRef);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, FLIGHTS_COLLECTION, docSnap.id));
    }
    await seedInitialFlightsIfEmpty();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, FLIGHTS_COLLECTION);
  }
}

// Subscribe to messages for a specific flight
export function subscribeToMessages(
  flightId: string,
  callback: (messages: OperationalMessage[]) => void
): () => void {
  const path = `${FLIGHTS_COLLECTION}/${flightId}/messages`;
  const messagesRef = collection(db, path);
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: OperationalMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({ id: docSnap.id, ...(docSnap.data() as Omit<OperationalMessage, 'id'>) });
      });
      callback(messages);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Subscribe to audit logs for a flight
export function subscribeToLogs(
  flightId: string,
  callback: (logs: TurnaroundLog[]) => void
): () => void {
  const path = `${FLIGHTS_COLLECTION}/${flightId}/logs`;
  const logsRef = collection(db, path);
  const q = query(logsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: TurnaroundLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<TurnaroundLog, 'id'>) });
      });
      callback(logs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Record a milestone from Ramp Coverage Man
export async function recordFlightMilestone(
  flight: FlightTurn,
  milestone: 'touchDown' | 'chocksOn' | 'doorOpen' | 'doorClose' | 'pushBack',
  customIsoTime: string,
  operatorName: string
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flight.id);
  const updates: Partial<FlightTurn> = {
    updatedAt: new Date().toISOString(),
  };

  let newStatus: FlightStatus = flight.status;
  let actionName = '';
  let detailMessage = '';

  switch (milestone) {
    case 'touchDown':
      updates.touchDownTime = customIsoTime;
      newStatus = 'TOUCHED_DOWN';
      actionName = 'TOUCH_DOWN_RECORDED';
      detailMessage = `Touch Down (ALDT) recorded at ${formatUtcTime(customIsoTime)} by ${operatorName}. Aircraft on runway rollout.`;
      break;

    case 'chocksOn':
      updates.chocksOnTime = customIsoTime;
      newStatus = 'CHOCKS_ON';
      actionName = 'CHOCKS_ON_RECORDED';
      detailMessage = `Chocks On (AIBT) at Stand ${flight.stand} logged at ${formatUtcTime(customIsoTime)}. Ground power and air bridges connecting.`;
      break;

    case 'doorOpen':
      updates.doorOpenTime = customIsoTime;
      newStatus = 'DOOR_OPEN';
      actionName = 'DOOR_OPEN_RECORDED';
      detailMessage = `Passenger & Cargo doors opened at ${formatUtcTime(customIsoTime)}. Deboarding commenced.`;
      break;

    case 'doorClose':
      updates.doorCloseTime = customIsoTime;
      newStatus = 'DOOR_CLOSED';
      actionName = 'DOOR_CLOSE_RECORDED';
      detailMessage = `Passenger and cargo doors secured at ${formatUtcTime(customIsoTime)}. Cabin ready for departure.`;
      break;

    case 'pushBack':
      updates.pushBackTime = customIsoTime;
      newStatus = 'PUSHED_BACK';
      actionName = 'PUSH_BACK_RECORDED';
      detailMessage = `Chocks removed, tug connected. Push Back (AOBT) at ${formatUtcTime(customIsoTime)}. Turnaround finished.`;
      break;
  }

  updates.status = newStatus;
  updates.coverageManName = operatorName;

  try {
    await updateDoc(flightDocRef, updates);

    // Add log
    const logDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/logs`));
    await setDoc(logDocRef, {
      flightId: flight.id,
      action: actionName,
      operatorRole: 'COVERAGE_MAN',
      operatorName,
      details: detailMessage,
      timestamp: customIsoTime,
    });

    // Send operational message to Load Controller
    const msgDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/messages`));
    await setDoc(msgDocRef, {
      flightId: flight.id,
      senderRole: 'COVERAGE_MAN',
      senderName: operatorName,
      message: `⏱️ [MILESTONE] ${actionName.replace('_RECORDED', '')}: ${formatUtcTime(customIsoTime)} (Stand ${flight.stand})`,
      messageType: 'MILESTONE_UPDATE',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flight.id}`);
  }
}

// Submit Captain Fuel Figures from Ramp Coverage Man to Load Controller
export async function submitCaptainFuelFigures(
  flight: FlightTurn,
  fuelData: {
    arrivalFuel: number;
    requestedFuel: number;
    upliftFuel: number;
    captainFinalFuel: number;
    density: number;
    captainSignOff: string;
    fuelUnit: 'KG' | 'LBS';
  },
  operatorName: string
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flight.id);

  const calculatedTotal = fuelData.arrivalFuel + fuelData.upliftFuel;
  const variance = Math.abs(calculatedTotal - fuelData.captainFinalFuel);
  const isDiscrepant = variance > 300; // >300kg or lbs variance threshold

  const fuelStatus: FuelStatus = isDiscrepant ? 'DISCREPANCY' : 'ENTERED_BY_RAMP';
  const discrepancyReason = isDiscrepant
    ? `Discrepancy: Arrival (${fuelData.arrivalFuel}) + Uplift (${fuelData.upliftFuel}) = ${calculatedTotal} ${fuelData.fuelUnit}, differs from Captain figure (${fuelData.captainFinalFuel} ${fuelData.fuelUnit}) by ${variance} ${fuelData.fuelUnit}.`
    : '';

  const nowIso = new Date().toISOString();

  const updates: Partial<FlightTurn> = {
    fuelUnit: fuelData.fuelUnit,
    arrivalFuel: fuelData.arrivalFuel,
    requestedFuel: fuelData.requestedFuel,
    upliftFuel: fuelData.upliftFuel,
    captainFinalFuel: fuelData.captainFinalFuel,
    density: fuelData.density,
    captainSignOff: fuelData.captainSignOff,
    captainConfirmedAt: nowIso,
    fuelStatus,
    discrepancyReason,
    coverageManName: operatorName,
    updatedAt: nowIso,
  };

  try {
    await updateDoc(flightDocRef, updates);

    // Create log
    const logDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/logs`));
    await setDoc(logDocRef, {
      flightId: flight.id,
      action: isDiscrepant ? 'FUEL_DISCREPANCY_FLAGGED' : 'CAPTAIN_FUEL_SUBMITTED',
      operatorRole: 'COVERAGE_MAN',
      operatorName,
      details: `Captain fuel communicated: Final ${fuelData.captainFinalFuel.toLocaleString()} ${fuelData.fuelUnit} (Uplift: ${fuelData.upliftFuel.toLocaleString()}, Remaining: ${fuelData.arrivalFuel.toLocaleString()}, Density: ${fuelData.density}). Signed by ${fuelData.captainSignOff}.`,
      timestamp: nowIso,
    });

    // Send high priority notification message to Load Controller
    const msgDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/messages`));
    await setDoc(msgDocRef, {
      flightId: flight.id,
      senderRole: 'COVERAGE_MAN',
      senderName: operatorName,
      message: `⛽ [FUEL TELEMETRY] Captain ${fuelData.captainSignOff} confirmed FINAL FUEL: ${fuelData.captainFinalFuel.toLocaleString()} ${fuelData.fuelUnit} (Density: ${fuelData.density}, Uplift: ${fuelData.upliftFuel.toLocaleString()} ${fuelData.fuelUnit}). ${isDiscrepant ? '⚠️ DISCREPANCY DETECTED' : 'Awaiting Load Control confirmation.'}`,
      messageType: isDiscrepant ? 'DELAY_WARNING' : 'FUEL_ALERT',
      timestamp: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flight.id}`);
  }
}

// Verify Fuel and update Load Control Status
export async function verifyFuelByLoadController(
  flight: FlightTurn,
  controllerName: string,
  approved: boolean,
  notes?: string
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flight.id);
  const nowIso = new Date().toISOString();

  const updates: Partial<FlightTurn> = {
    fuelStatus: approved ? 'VERIFIED_BY_LC' : 'DISCREPANCY',
    loadControlStatus: approved ? 'FUEL_CONFIRMED' : 'PENDING_FUEL',
    loadControllerName: controllerName,
    loadControllerNotes: notes || (approved ? 'Fuel figures reconciled against flight plan.' : 'Fuel figures require recalculation.'),
    updatedAt: nowIso,
  };

  try {
    await updateDoc(flightDocRef, updates);

    // Audit Log
    const logDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/logs`));
    await setDoc(logDocRef, {
      flightId: flight.id,
      action: approved ? 'FUEL_VERIFIED_BY_LOAD_CONTROL' : 'FUEL_REJECTED_BY_LOAD_CONTROL',
      operatorRole: 'LOAD_CONTROLLER',
      operatorName: controllerName,
      details: approved
        ? `Fuel figure ${flight.captainFinalFuel?.toLocaleString()} ${flight.fuelUnit} approved for Zero Fuel Weight & Trim calculation.`
        : `Fuel figure rejected: ${notes}`,
      timestamp: nowIso,
    });

    // Operational Message back to Ramp Coverage Man
    const msgDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/messages`));
    await setDoc(msgDocRef, {
      flightId: flight.id,
      senderRole: 'LOAD_CONTROLLER',
      senderName: controllerName,
      message: approved
        ? `✅ [LOAD CONTROL] Fuel figures confirmed (${flight.captainFinalFuel?.toLocaleString()} ${flight.fuelUnit}). Generating final loadsheet.`
        : `❌ [LOAD CONTROL WARNING] Fuel mismatch noted: ${notes}`,
      messageType: approved ? 'LOADSHEET_ACK' : 'DELAY_WARNING',
      timestamp: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flight.id}`);
  }
}

// Release Load Sheet
export async function releaseLoadsheetByLoadController(
  flight: FlightTurn,
  controllerName: string
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flight.id);
  const nowIso = new Date().toISOString();

  const updates: Partial<FlightTurn> = {
    loadControlStatus: 'LOADSHEET_RELEASED',
    loadControllerName: controllerName,
    updatedAt: nowIso,
  };

  try {
    await updateDoc(flightDocRef, updates);

    // Log
    const logDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/logs`));
    await setDoc(logDocRef, {
      flightId: flight.id,
      action: 'LOADSHEET_EDITION_1_RELEASED',
      operatorRole: 'LOAD_CONTROLLER',
      operatorName: controllerName,
      details: `Edition 1 Load Sheet transmitted to Captain via ACARS / Ramp handover. CG & Trim within safe envelope.`,
      timestamp: nowIso,
    });

    // Message
    const msgDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flight.id}/messages`));
    await setDoc(msgDocRef, {
      flightId: flight.id,
      senderRole: 'LOAD_CONTROLLER',
      senderName: controllerName,
      message: `📋 [LOADSHEET RELEASED] Final Load Sheet (Ed 1) transmitted. Captain sign-off and pushback authorized upon door closure.`,
      messageType: 'LOADSHEET_ACK',
      timestamp: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flight.id}`);
  }
}

// Send instant radio / chat operational message
export async function sendOperationalMessage(
  flightId: string,
  senderRole: 'COVERAGE_MAN' | 'LOAD_CONTROLLER' | 'SYSTEM',
  senderName: string,
  message: string,
  messageType: OperationalMessage['messageType'] = 'CHAT'
): Promise<void> {
  const path = `${FLIGHTS_COLLECTION}/${flightId}/messages`;
  try {
    const msgDocRef = doc(collection(db, path));
    await setDoc(msgDocRef, {
      flightId,
      senderRole,
      senderName,
      message,
      messageType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Create new flight turnaround
export async function createFlightTurn(
  newFlight: Omit<FlightTurn, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const path = FLIGHTS_COLLECTION;
  try {
    const flightsRef = collection(db, path);
    const newDocRef = doc(flightsRef);
    const nowIso = new Date().toISOString();

    const fullData: FlightTurn = {
      ...newFlight,
      id: newDocRef.id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await setDoc(newDocRef, fullData);

    // Initial log
    const logDocRef = doc(collection(db, `${path}/${newDocRef.id}/logs`));
    await setDoc(logDocRef, {
      flightId: newDocRef.id,
      action: 'FLIGHT_CREATED',
      operatorRole: 'SYSTEM',
      operatorName: 'Dispatch Center',
      details: `Flight ${newFlight.flightNumber} added to active ramp schedule at Gate ${newFlight.gate}.`,
      timestamp: nowIso,
    });

    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Utility: Strictly format timing to 4-digit 0000 format (e.g. 2200) without any date or suffixes
export function formatFourDigitTime(val?: string): string {
  if (!val) return '--';
  const trimmed = String(val).trim();
  if (!trimmed || trimmed === '--') return '--';

  // If already 4 digits like "2210" or "2200"
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // If format "22:10"
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const parts = trimmed.split(':');
    return `${parts[0].padStart(2, '0')}${parts[1]}`;
  }

  // If ISO string like "2026-11-11T22:10:00.000Z"
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}${mins}`;
    }
  } catch {
    // fallback
  }

  return trimmed;
}

// Utility: Format ISO string or 4-digit HHmm to 4 digits format "0000" in Local Time
export function formatUtcTime(isoString?: string): string {
  return formatFourDigitTime(isoString);
}

// Delete a flight from server
export async function deleteFlight(flightId: string): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flightId);
  try {
    await deleteDoc(flightDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${FLIGHTS_COLLECTION}/${flightId}`);
  }
}

// Utility: Format ISO string to date + UTC time string e.g. "11 Nov 14:25Z"
export function formatUtcDateTime(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';
    const day = d.getUTCDate();
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}Z`;
  } catch {
    return '--';
  }
}

// Calculate turnaround metrics from list of flights
export function computeTurnaroundMetrics(flights: FlightTurn[]) {
  const totalFlights = flights.length;
  const activeTurnarounds = flights.filter(
    (f) => f.status !== 'PUSHED_BACK' && f.status !== 'DEPARTED' && f.status !== 'CANCELLED'
  ).length;
  const completedTurns = flights.filter(
    (f) => f.status === 'PUSHED_BACK' || f.status === 'DEPARTED'
  ).length;

  // OTP: flights pushed back within 15 mins of scheduled departure (D15)
  let onTimeCount = 0;
  let evaluatedPunctualityCount = 0;
  let totalGroundMinutes = 0;
  let groundCount = 0;

  let totalTaxiInMinutes = 0;
  let taxiInCount = 0;

  let totalDoorOpenDelayMinutes = 0;
  let doorOpenCount = 0;

  let fuelDiscrepancyCount = 0;
  const delayCodeDistribution: Record<string, number> = {};

  flights.forEach((f) => {
    if (f.fuelStatus === 'DISCREPANCY') {
      fuelDiscrepancyCount++;
    }

    if (f.delayReasonCode) {
      delayCodeDistribution[f.delayReasonCode] = (delayCodeDistribution[f.delayReasonCode] || 0) + 1;
    }

    // Taxi In: Touchdown to Chocks On
    if (f.touchDownTime && f.chocksOnTime) {
      const td = new Date(f.touchDownTime).getTime();
      const co = new Date(f.chocksOnTime).getTime();
      const diffMins = Math.round((co - td) / 60000);
      if (diffMins >= 0 && diffMins < 60) {
        totalTaxiInMinutes += diffMins;
        taxiInCount++;
      }
    }

    // Door Open delay: Chocks On to Door Open
    if (f.chocksOnTime && f.doorOpenTime) {
      const co = new Date(f.chocksOnTime).getTime();
      const doTime = new Date(f.doorOpenTime).getTime();
      const diffMins = Math.round((doTime - co) / 60000);
      if (diffMins >= 0 && diffMins < 45) {
        totalDoorOpenDelayMinutes += diffMins;
        doorOpenCount++;
      }
    }

    // Ground Time: Chocks On to Push Back
    if (f.chocksOnTime && f.pushBackTime) {
      const co = new Date(f.chocksOnTime).getTime();
      const pb = new Date(f.pushBackTime).getTime();
      const diffMins = Math.round((pb - co) / 60000);
      if (diffMins > 0) {
        totalGroundMinutes += diffMins;
        groundCount++;
      }

      // Check D15
      const schedDep = new Date(f.scheduledDeparture).getTime();
      const delay = (pb - schedDep) / 60000;
      if (delay <= 15) {
        onTimeCount++;
      }
      evaluatedPunctualityCount++;
    }
  });

  const onTimePerformanceRate = evaluatedPunctualityCount > 0
    ? Math.round((onTimeCount / evaluatedPunctualityCount) * 100)
    : 92;

  const averageGroundTimeMinutes = groundCount > 0 ? Math.round(totalGroundMinutes / groundCount) : 48;
  const averageTaxiInMinutes = taxiInCount > 0 ? Math.round(totalTaxiInMinutes / taxiInCount) : 7;
  const averageDoorOpenLatencyMinutes = doorOpenCount > 0 ? Math.round(totalDoorOpenDelayMinutes / doorOpenCount) : 3;

  return {
    totalFlights,
    activeTurnarounds,
    completedTurns,
    onTimePerformanceRate,
    averageGroundTimeMinutes,
    averageTaxiInMinutes,
    averageDoorOpenLatencyMinutes,
    averageTurnDurationMinutes: averageGroundTimeMinutes,
    fuelDiscrepancyCount,
    delayCodeDistribution,
  };
}

// Helper to get 4-digit HHmm formatted string in Local Time (e.g. 2200)
export function getCurrentHhmm(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}${minutes}`;
}

// Simple milestone update directly from Coverage Man
export async function updateFlightTimingSimple(
  flightId: string,
  milestoneKey: 'touchDown' | 'chocksOn' | 'doorOpen' | 'pushBack',
  timingValue: string
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flightId);
  const nowIso = new Date().toISOString();

  const updates: Partial<FlightTurn> = {
    updatedAt: nowIso,
  };

  let actionName = '';

  switch (milestoneKey) {
    case 'touchDown':
      updates.touchDownTime = timingValue;
      updates.touchDownRecorded = true;
      updates.status = 'TOUCHED_DOWN';
      actionName = 'TOUCH DOWN';
      break;
    case 'chocksOn':
      updates.chocksOnTime = timingValue;
      updates.chocksOnRecorded = true;
      updates.status = 'CHOCKS_ON';
      actionName = 'CHOCKS ON';
      break;
    case 'doorOpen':
      updates.doorOpenTime = timingValue;
      updates.doorOpenRecorded = true;
      updates.status = 'DOOR_OPEN';
      actionName = 'DOOR OPEN';
      break;
    case 'pushBack':
      updates.pushBackTime = timingValue;
      updates.pushBackRecorded = true;
      updates.status = 'PUSHED_BACK';
      actionName = 'PUSH BACK';
      break;
  }

  try {
    await updateDoc(flightDocRef, updates);

    // Save message for Load Controller
    const msgDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flightId}/messages`));
    await setDoc(msgDocRef, {
      flightId,
      senderRole: 'COVERAGE_MAN',
      senderName: 'Coverage Man (Apron)',
      message: `⏱️ [TIMING TRANSMITTED] ${actionName}: ${timingValue}`,
      messageType: 'MILESTONE_UPDATE',
      timestamp: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flightId}`);
  }
}

// Simple Fuel sender directly to Load Controller
export async function sendFuelFiguresSimple(
  flightId: string,
  blockFuel: number,
  tripFuel: number,
  taxiFuel: number
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flightId);
  const nowIso = new Date().toISOString();

  const updates: Partial<FlightTurn> = {
    blockFuel,
    tripFuel,
    taxiFuel,
    captainFinalFuel: blockFuel,
    requestedFuel: blockFuel,
    fuelStatus: 'ENTERED_BY_RAMP',
    fuelSentAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await updateDoc(flightDocRef, updates);

    // Send operational message to Load Controller
    const msgDocRef = doc(collection(db, `${FLIGHTS_COLLECTION}/${flightId}/messages`));
    await setDoc(msgDocRef, {
      flightId,
      senderRole: 'COVERAGE_MAN',
      senderName: 'Coverage Man (Apron)',
      message: `⛽ [FUEL FIGURES SENT] Block Fuel: ${blockFuel.toLocaleString()}, Trip Fuel: ${tripFuel.toLocaleString()}, Taxi: ${taxiFuel.toLocaleString()} KG. Transmitted to Load Controller.`,
      messageType: 'FUEL_ALERT',
      timestamp: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flightId}`);
  }
}

// Update Flight Number (e.g. BG147/11NOV26)
export async function updateFlightNumberSimple(
  flightId: string,
  flightNumber: string
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flightId);
  try {
    await updateDoc(flightDocRef, {
      flightNumber: flightNumber.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flightId}`);
  }
}

// Update Flight Details (Flight No, Aircraft Reg, Capt, Crew, Date)
export async function updateFlightDetailsSimple(
  flightId: string,
  details: {
    flightNumber?: string;
    aircraftReg?: string;
    captName?: string;
    crewCount?: string;
    crewName?: string;
    flightDate?: string;
  }
): Promise<void> {
  const flightDocRef = doc(db, FLIGHTS_COLLECTION, flightId);
  try {
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };
    if (details.flightNumber !== undefined) updates.flightNumber = details.flightNumber.trim().toUpperCase();
    if (details.aircraftReg !== undefined) updates.aircraftReg = details.aircraftReg.trim().toUpperCase();
    if (details.captName !== undefined) updates.captName = details.captName.trim();
    if (details.crewCount !== undefined) updates.crewCount = details.crewCount.trim();
    if (details.crewName !== undefined) updates.crewName = details.crewName.trim();
    if (details.flightDate !== undefined) updates.flightDate = details.flightDate;

    await updateDoc(flightDocRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FLIGHTS_COLLECTION}/${flightId}`);
  }
}

