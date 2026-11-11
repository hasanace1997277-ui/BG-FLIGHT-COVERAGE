/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CoverageManView } from './components/CoverageManView';
import { LoadControllerTableView } from './components/LoadControllerTableView';
import { LoginScreen } from './components/LoginScreen';
import { NewFlightModal } from './components/NewFlightModal';
import {
  subscribeToFlights,
  seedInitialFlightsIfEmpty,
  reseedDemoFlights,
  createFlightTurn,
  deleteFlight,
} from './services/flightService';
import { testFirestoreConnection } from './lib/firebase';
import { FlightTurn, UserRole } from './types/aviation';
import { Bell } from 'lucide-react';

export default function App() {
  // Starts with login screen or default Coverage Man
  const [currentRole, setCurrentRole] = useState<UserRole | null>('COVERAGE_MAN');
  const [operatorName, setOperatorName] = useState<string>('H. Razak');
  const [staffId, setStaffId] = useState<string>('CM-4082');
  const [flights, setFlights] = useState<FlightTurn[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [isNewFlightModalOpen, setIsNewFlightModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Initialize Firestore and real-time flight subscription
  useEffect(() => {
    testFirestoreConnection();
    seedInitialFlightsIfEmpty();

    const unsubscribeFlights = subscribeToFlights((loadedFlights) => {
      setFlights(loadedFlights);
      if (loadedFlights.length > 0) {
        setSelectedFlightId((prev) => {
          if (prev && loadedFlights.some((f) => f.id === prev)) return prev;
          return loadedFlights[0].id;
        });
      }
    });

    return () => {
      unsubscribeFlights();
    };
  }, []);

  // Handle Login selection with Name and Staff ID
  const handleLogin = (role: UserRole, name: string, id: string) => {
    setCurrentRole(role);
    setOperatorName(name);
    setStaffId(id);
    setToastNotification(`Logged in as ${role === 'COVERAGE_MAN' ? 'Coverage Man' : 'Load Controller'} (${id})`);
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Handle New Flight creation
  const handleCreateFlight = async (
    data: Omit<FlightTurn, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newId = await createFlightTurn(data);
    setSelectedFlightId(newId);
    setToastNotification(`Flight ${data.flightNumber} added to coverage schedule`);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Handle Flight deletion by Coverage Man
  const handleDeleteFlight = async (flightId: string) => {
    try {
      // Optimistically update local selected flight
      setSelectedFlightId((prev) => {
        if (prev === flightId) {
          const remaining = flights.filter((f) => f.id !== flightId);
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return prev;
      });

      await deleteFlight(flightId);
      setToastNotification('Flight successfully deleted from server');
      setTimeout(() => setToastNotification(null), 3000);
    } catch (err) {
      console.error('Error deleting flight:', err);
      setToastNotification('Failed to delete flight');
      setTimeout(() => setToastNotification(null), 3000);
    }
  };

  // Handle Demo Reset
  const handleReseed = async () => {
    await reseedDemoFlights();
    setToastNotification('Demo flights reseeded successfully.');
    setTimeout(() => setToastNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Application Bar */}
      <Header
        currentRole={currentRole}
        operatorName={operatorName}
        staffId={staffId}
        onRoleChange={(role) => setCurrentRole(role)}
        onOpenNewFlight={() => setIsNewFlightModalOpen(true)}
        onReseedData={handleReseed}
      />

      {/* Floating Status Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border-2 border-emerald-500/80 text-white p-3.5 rounded-2xl shadow-2xl flex items-center space-x-2.5 animate-bounce font-mono text-xs">
          <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!currentRole ? (
          <LoginScreen onLogin={handleLogin} />
        ) : currentRole === 'COVERAGE_MAN' ? (
          <CoverageManView
            flights={flights}
            selectedFlightId={selectedFlightId}
            onSelectFlight={setSelectedFlightId}
            onOpenNewFlight={() => setIsNewFlightModalOpen(true)}
            onDeleteFlight={handleDeleteFlight}
          />
        ) : (
          <LoadControllerTableView
            flights={flights}
            controllerName={operatorName}
          />
        )}
      </main>

      {/* New Flight Modal */}
      {isNewFlightModalOpen && (
        <NewFlightModal
          onClose={() => setIsNewFlightModalOpen(false)}
          onSubmit={handleCreateFlight}
        />
      )}
    </div>
  );
}
