import React, { useEffect, useMemo, useState } from "react";
import { BuildingOffice2Icon } from "@heroicons/react/24/solid";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import useUserStore from "../../../../../store/UserDataStore";
import PDFReportGeneratorByTower from "./PDFReportGeneratorByTower";
import PDFReportMaintenanceByTower from "./PDFReportMaintenanceByTower";
import { formatCurrency } from "../../../../../utils/curreyncy";

type TowerStat = {
  tower: string;
  condominiumsCount: number;
  charges: number;
  income: number;
  pending: number;
  complianceRate: number;
};

const ALL_TOWERS = "__all__";
const NO_TOWER = "Sin torre";

const normalizeTowerLabel = (value?: string) => {
  const trimmed = String(value || "").trim();
  return trimmed.length > 0 ? trimmed : NO_TOWER;
};

const normalizeCondoNumber = (value: unknown) => String(value || "").trim();

const TowerIncomeSummary: React.FC = () => {
  const [selectedTower, setSelectedTower] = useState<string>(ALL_TOWERS);

  const { detailed, selectedYear, loading } = usePaymentSummaryStore((state) => ({
    detailed: state.detailed,
    selectedYear: state.selectedYear,
    loading: state.loading,
  }));

  const { fetchCondominiumsUsers, condominiumsUsers } = useUserStore((state) => ({
    fetchCondominiumsUsers: state.fetchCondominiumsUsers,
    condominiumsUsers: state.condominiumsUsers,
  }));

  useEffect(() => {
    fetchCondominiumsUsers().catch((error) => {
      console.error("Error loading users for tower analytics:", error);
    });
  }, [fetchCondominiumsUsers]);

  const towerByCondominiumNumber = useMemo(() => {
    const map = new Map<string, string>();
    condominiumsUsers.forEach((user) => {
      const number = normalizeCondoNumber(user.number);
      if (!number) return;
      const nextTower = normalizeTowerLabel(user.tower);
      const currentTower = map.get(number);
      // Si ya existe una torre distinta, preservamos la primera no vacía para mantener consistencia.
      if (!currentTower || currentTower === NO_TOWER) {
        map.set(number, nextTower);
      }
    });
    return map;
  }, [condominiumsUsers]);

  const towerOptions = useMemo(() => {
    const recordTowerValues = Object.values(detailed)
      .flat()
      .map((record) => normalizeTowerLabel(record.towerSnapshot))
      .filter((tower) => tower !== NO_TOWER);
    const values = Array.from(
      new Set(
        [
          ...Array.from(towerByCondominiumNumber.values()).filter(
            (tower) => tower !== NO_TOWER
          ),
          ...recordTowerValues,
        ]
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return values;
  }, [towerByCondominiumNumber, detailed]);

  const hasConfiguredTowers = towerOptions.length > 0;

  const towerStats = useMemo(() => {
    const base = new Map<
      string,
      {
        condominiumNumbers: Set<string>;
        charges: number;
        amountPaid: number;
        creditGenerated: number;
        creditUsed: number;
        pending: number;
      }
    >();

    const ensureTower = (tower: string) => {
      if (!base.has(tower)) {
        base.set(tower, {
          condominiumNumbers: new Set<string>(),
          charges: 0,
          amountPaid: 0,
          creditGenerated: 0,
          creditUsed: 0,
          pending: 0,
        });
      }
      return base.get(tower)!;
    };

    towerByCondominiumNumber.forEach((tower, number) => {
      const entry = ensureTower(tower);
      entry.condominiumNumbers.add(number);
    });

    Object.entries(detailed).forEach(([numberCondominium, records]) => {
      const number = normalizeCondoNumber(numberCondominium);
      records.forEach((record) => {
        const recordTower = normalizeTowerLabel(
          record.towerSnapshot || towerByCondominiumNumber.get(number) || ""
        );
        const entry = ensureTower(recordTower);
        entry.condominiumNumbers.add(number);
        entry.charges += Number(record.referenceAmount || 0);
        entry.amountPaid += Number(record.amountPaid || 0);
        entry.creditGenerated += Math.max(0, Number(record.creditBalance || 0));
        entry.creditUsed += Math.max(0, Number(record.creditUsed || 0));
        entry.pending += Number(record.amountPending || 0);
      });
    });

    const rows: TowerStat[] = Array.from(base.entries()).map(([tower, data]) => {
      const income = data.amountPaid + data.creditGenerated - data.creditUsed;
      const complianceRate =
        data.charges > 0
          ? Math.max(0, Math.min(100, ((data.charges - data.pending) / data.charges) * 100))
          : 0;
      return {
        tower,
        condominiumsCount: data.condominiumNumbers.size,
        charges: data.charges,
        income,
        pending: data.pending,
        complianceRate,
      };
    });

    const filtered =
      selectedTower === ALL_TOWERS
        ? rows
        : rows.filter((row) => row.tower === selectedTower);

    return filtered.sort((a, b) => b.income - a.income);
  }, [detailed, selectedTower, towerByCondominiumNumber]);

  const totals = useMemo(() => {
    return towerStats.reduce(
      (acc, row) => {
        acc.condominiumsCount += row.condominiumsCount;
        acc.charges += row.charges;
        acc.income += row.income;
        acc.pending += row.pending;
        return acc;
      },
      { condominiumsCount: 0, charges: 0, income: 0, pending: 0 }
    );
  }, [towerStats]);

  const activeTowerForReports =
    selectedTower === ALL_TOWERS ? "" : selectedTower;

  if (!hasConfiguredTowers) {
    return (
      <div className="rounded-xl border border-indigo-200/70 bg-white p-5 dark:border-indigo-900/50 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <BuildingOffice2Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Análisis por torre no disponible
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Este condominio no tiene torres configuradas en los perfiles de
              condóminos. Cuando exista al menos una torre (campo `tower`), se
              habilitará esta vista y los reportes filtrados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-900/50 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Vista por torres
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Compara cobranza, cargos y saldo pendiente por torre.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTower}
              onChange={(event) => setSelectedTower(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value={ALL_TOWERS}>Todas las torres</option>
              {towerOptions.map((tower) => (
                <option key={tower} value={tower}>
                  Torre {tower}
                </option>
              ))}
              <option value={NO_TOWER}>Sin torre</option>
            </select>

            <PDFReportGeneratorByTower
              year={selectedYear}
              tower={activeTowerForReports}
              renderButton={(onClick) => (
                <button
                  onClick={onClick}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  PDF Ingresos
                </button>
              )}
            />

            <PDFReportMaintenanceByTower
              year={selectedYear}
              tower={activeTowerForReports}
              renderButton={(onClick) => (
                <button
                  onClick={onClick}
                  className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                >
                  PDF Mantenimiento
                </button>
              )}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-900/50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Condóminos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {totals.condominiumsCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-900/50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Cargos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(totals.charges)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-900/50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(totals.income)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-900/50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(totals.pending)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-900/50 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Torre
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Condóminos
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Cargos
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Ingresos
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Pendiente
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Cumplimiento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {towerStats.map((row) => (
              <tr key={row.tower} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.tower === NO_TOWER ? NO_TOWER : `Torre ${row.tower}`}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                  {row.condominiumsCount}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                  {formatCurrency(row.charges)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                  {formatCurrency(row.income)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                  {formatCurrency(row.pending)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  {row.complianceRate.toFixed(2)}%
                </td>
              </tr>
            ))}
            {!loading && towerStats.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No hay datos disponibles para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TowerIncomeSummary;
