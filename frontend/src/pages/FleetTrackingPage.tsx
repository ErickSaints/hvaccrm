import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { io, Socket } from 'socket.io-client';

interface TechnicianLocation {
  id: number;
  technicianId: number;
  name: string;
  role: string;
  latitude: number;
  longitude: number;
  lastUpdate: string;
  status: 'ACTIVE' | 'INACTIVE';
  serviceOrderNumber?: string;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace unos segundos';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return new Date(dateStr).toLocaleDateString('es-MX');
}

function isActive(lastUpdate: string): boolean {
  if (!lastUpdate) return false;
  return Date.now() - new Date(lastUpdate).getTime() < 5 * 60 * 1000;
}

export default function FleetTrackingPage() {
  const queryClient = useQueryClient();
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const { data: initialLocations, isLoading } = useQuery<TechnicianLocation[]>({
    queryKey: ['fleet'],
    queryFn: () => api.get('/fleet').then(r => r.data),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (initialLocations) {
      setLocations(prev => {
        const merged = [...initialLocations];
        prev.forEach(loc => {
          const idx = merged.findIndex(m => m.technicianId === loc.technicianId);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...loc };
          } else {
            merged.push(loc);
          }
        });
        return merged;
      });
    }
  }, [initialLocations]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
    });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('technician-location', (data: TechnicianLocation) => {
      setLocations(prev => {
        const idx = prev.findIndex(l => l.technicianId === data.technicianId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const activeLocations = locations.filter(l => isActive(l.lastUpdate));
  const onRouteCount = locations.filter(l =>
    l.status === 'ACTIVE' && l.serviceOrderNumber
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Flotilla en Vivo</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ubicación en tiempo real de tus técnicos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {socketConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-gray-500 dark:text-gray-400">
              {socketConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['fleet'] })}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{locations.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Técnicos totales</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{activeLocations.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Activos ahora</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{onRouteCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">En ruta</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        className="relative bg-[#0f172a] rounded-xl overflow-hidden h-[400px] border border-gray-200 dark:border-gray-700"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(59,130,246,0.12) 1px, transparent 1px),
            linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px, 60px 60px, 60px 60px',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No hay técnicos disponibles</p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid labels */}
            <div className="absolute bottom-2 left-3 text-[10px] text-gray-500 font-mono">0°</div>
            <div className="absolute bottom-2 right-3 text-[10px] text-gray-500 font-mono">180°</div>
            <div className="absolute top-2 left-3 text-[10px] text-gray-500 font-mono">90°N</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-mono">Ecuador</div>

            {/* Technician dots */}
            {locations.map(loc => {
              const active = isActive(loc.lastUpdate);
              const left = ((loc.longitude + 180) / 360) * 100;
              const top = ((90 - loc.latitude) / 180) * 100;

              return (
                <div
                  key={loc.id || loc.technicianId}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <div
                    className={`w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                      active
                        ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                        : 'bg-gray-500'
                    }`}
                    title={`${loc.name} (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`}
                  />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-gray-300 bg-gray-900/80 px-1.5 py-0.5 rounded">
                    {loc.name}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Legend + Tech Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Legend */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Leyenda</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Activo (&lt;5 min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Inactivo</span>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total técnicos</span>
                <span className="font-medium">{locations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Activos ahora</span>
                <span className="font-medium text-green-600">{activeLocations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">En ruta</span>
                <span className="font-medium text-amber-600">{onRouteCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Inactivos</span>
                <span className="font-medium text-gray-500">{locations.length - activeLocations.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Cards */}
        <div className="lg:col-span-3 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : locations.length === 0 ? (
            <div className="card text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No hay técnicos registrados</p>
            </div>
          ) : (
            [...locations]
              .sort((a, b) => {
                const aActive = isActive(a.lastUpdate);
                const bActive = isActive(b.lastUpdate);
                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;
                return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
              })
              .map(loc => {
                const active = isActive(loc.lastUpdate);
                return (
                  <div key={loc.id || loc.technicianId} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                            active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {loc.name}
                            </h3>
                            <span className="text-xs text-gray-400">{loc.role}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {timeAgo(loc.lastUpdate)}
                            </span>
                          </div>
                          {loc.serviceOrderNumber && (
                            <Link
                              to={`/service-orders/${loc.serviceOrderNumber}`}
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1"
                            >
                              <Navigation className="w-3 h-3" />
                              OS: {loc.serviceOrderNumber}
                            </Link>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {active ? (
                          <><Wifi className="w-3 h-3" /> Activo</>
                        ) : (
                          <><WifiOff className="w-3 h-3" /> Inactivo</>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
