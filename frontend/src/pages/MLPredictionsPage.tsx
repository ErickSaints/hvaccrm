import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Brain, AlertTriangle, AlertCircle, CheckCircle2,
  Calendar, Wrench, Eye, Filter, Activity, Clock,
} from 'lucide-react';
import api from '../lib/api';
import type { MLPrediction, MLPredictionsResponse } from '../types';

const RISK_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  ALTO: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
  MEDIO: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
  BAJO: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
};

export default function MLPredictionsPage() {
  const [riskFilter, setRiskFilter] = useState<string>('');

  const { data, isLoading } = useQuery<MLPredictionsResponse>({
    queryKey: ['ml-predictions'],
    queryFn: async () => {
      const { data } = await api.get('/ml/predictions');
      return data;
    },
  });

  const filtered = data?.predictions.filter((p) => !riskFilter || p.riskLevel === riskFilter) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary-600" />
            Predicciones ML
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Análisis predictivo de fallas basado en historial de servicio
          </p>
        </div>
        {data?.generatedAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Actualizado: {new Date(data.generatedAt).toLocaleString('es-MX')}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <Activity className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.total ?? '—'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Equipos</p>
        </div>
        <div className="card p-5 text-center border-red-200 dark:border-red-900">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{data?.highRisk ?? '—'}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">Riesgo Alto</p>
        </div>
        <div className="card p-5 text-center border-amber-200 dark:border-amber-900">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{data?.mediumRisk ?? '—'}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Riesgo Medio</p>
        </div>
        <div className="card p-5 text-center border-emerald-200 dark:border-emerald-900">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data?.lowRisk ?? '—'}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Riesgo Bajo</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="">Todos los niveles</option>
              <option value="ALTO">Riesgo Alto</option>
              <option value="MEDIO">Riesgo Medio</option>
              <option value="BAJO">Riesgo Bajo</option>
            </select>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {filtered.length} de {data?.total ?? 0} equipos
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Equipo</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Riesgo</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Prob. Falla</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Días Estimados</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Último Servicio</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Acción</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filtered.map((p: MLPrediction) => {
                  const rc = RISK_COLORS[p.riskLevel] ?? RISK_COLORS.BAJO;
                  const RiskIcon = rc.icon;
                  return (
                    <tr key={p.equipmentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {p.equipmentType}
                            </span>
                            {(p.equipmentBrand || p.equipmentModel) && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {[p.equipmentBrand, p.equipmentModel].filter(Boolean).join(' - ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text}`}>
                          <RiskIcon className="w-3.5 h-3.5" />
                          {p.riskLevel === 'ALTO' ? 'Alto' : p.riskLevel === 'MEDIO' ? 'Medio' : 'Bajo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                p.riskLevel === 'ALTO' ? 'bg-red-500' : p.riskLevel === 'MEDIO' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.round(p.failureProbability * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                            {Math.round(p.failureProbability * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {p.estimatedDaysToFailure}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">días</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {p.lastService
                              ? new Date(p.lastService).toLocaleDateString('es-MX')
                              : 'Sin registro'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate" title={p.recommendedAction}>
                          {p.recommendedAction}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/equipment/${p.equipmentId}`}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                          title="Ver equipo"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              {riskFilter ? 'Sin resultados' : 'No hay predicciones disponibles'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {riskFilter
                ? 'No hay equipos con este nivel de riesgo'
                : 'Registra equipos con historial de servicio para generar predicciones'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
