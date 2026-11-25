import React from 'react';
import { BarChart3, Info, CheckCircle2, Scale } from 'lucide-react';
import type { ImpactStats } from '../../../shared/types.ts';

interface ImpactViewProps {
  impact: ImpactStats | null;
}

export const ImpactView: React.FC<ImpactViewProps> = ({ impact }) => {
  if (!impact) {
    return (
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-8 text-center font-mono-num text-xs uppercase text-[#5A6475]">
        LOADING IMPACT METRICS...
      </div>
    );
  }

  const maxKg = Math.max(
    1,
    ...impact.categoryBreakdown.map((c) => c.estimatedKgDiverted)
  );

  return (
    <div className="space-y-6">
      {/* Header & Honesty Note */}
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[2px] bg-[#060B18] text-[#F8FAFC] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-[#0052FF]" />
          </div>
          <div>
            <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF] mb-0.5">
              ( 06 ) VERIFIED TELEMETRY
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#0B0F19]">
              CIRCULAR <span className="text-[#0052FF]">IMPACT</span> LEDGER
            </h1>
            <p className="text-xs sm:text-sm text-[#5A6475] mt-1">
              Every figure below is computed directly from SQLite exchange records. Actual counts
              and estimated material weights are explicitly separated.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE] text-xs text-[#5A6475] flex items-start gap-2">
          <Info className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#0B0F19] font-mono-num text-[11px] uppercase">
              Actual vs. Estimated Methodology:
            </strong>{' '}
            {impact.methodologyNote}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="bg-[#F5F6F8] border border-[#E2E6EE] p-4 rounded-[2px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5">
          <div className="flex items-center justify-between font-mono-num text-[10px] uppercase text-[#5A6475] mb-1.5">
            <span>EXCHANGES COMPLETED</span>
            <span className="px-2 py-0.5 rounded-sm bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-semibold">
              ACTUAL
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#0B0F19]">
            {impact.totalCompletedExchanges}
          </div>
          <div className="font-mono-num text-[10px] uppercase text-[#8A94A6] mt-1.5">
            {impact.liveCompletedExchanges} LIVE USER · {impact.sampleCompletedExchanges} SAMPLE
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5">
          <div className="flex items-center justify-between font-mono-num text-[10px] uppercase text-[#5A6475] mb-1.5">
            <span>RESOURCES REUSED</span>
            <span className="px-2 py-0.5 rounded-sm bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-semibold">
              ACTUAL
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#0B0F19]">
            {impact.totalResourcesReused}
          </div>
          <div className="font-mono-num text-[10px] uppercase text-[#8A94A6] mt-1.5">
            VERIFIED COMPLETED HANDOVERS
          </div>
        </div>

        <div className="bg-[#060B18] rounded-[2px] border border-[#1D2740] p-5 text-[#F8FAFC]">
          <div className="flex items-center justify-between font-mono-num text-[10px] uppercase text-[#8A94A6] mb-1.5">
            <span>MATERIAL DIVERTED</span>
            <span className="px-2 py-0.5 rounded-sm bg-[#0E1528] text-[#C7DBFF] border border-[#0052FF] font-semibold">
              ESTIMATED
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#0052FF]">
            {impact.totalEstimatedKgDiverted} kg
          </div>
          <div className="font-mono-num text-[10px] uppercase text-[#8A94A6] mt-1.5">
            {impact.liveEstimatedKgDiverted} KG FROM LIVE EXCHANGES
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5">
          <div className="flex items-center justify-between font-mono-num text-[10px] uppercase text-[#5A6475] mb-1.5">
            <span>SUPPLY / OPEN NEEDS</span>
            <span className="px-2 py-0.5 rounded-sm bg-[#EEF4FF] text-[#0052FF] border border-[#C7DBFF] font-semibold">
              ACTUAL
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#0B0F19]">
            {impact.activeAvailableResources} / {impact.openNeedsCount}
          </div>
          <div className="font-mono-num text-[10px] uppercase text-[#8A94A6] mt-1.5">
            AVAILABLE VS OPEN NEEDS
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E6EE]">
          <h2 className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0B0F19] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#0052FF]" />
            Category-Wise Reuse &amp; Active Supply
          </h2>
          <span className="font-mono-num text-[10px] uppercase text-[#8A94A6]">
            COMPLETED VS AVAILABLE
          </span>
        </div>

        <div className="space-y-3.5">
          {impact.categoryBreakdown.map((cat) => {
            const pct = Math.round((cat.estimatedKgDiverted / maxKg) * 100);
            return (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#0B0F19]">{cat.category}</span>
                  <span className="text-[#5A6475] font-mono-num text-[11px]">
                    {cat.completedExchanges} completed ({cat.actualUnitsReused} units · est.{' '}
                    {cat.estimatedKgDiverted} kg) · {cat.activeListings} active
                  </span>
                </div>
                <div className="h-2 rounded-none bg-[#F5F6F8] border border-[#E2E6EE] overflow-hidden">
                  <div
                    className="h-full bg-[#0052FF] transition-all"
                    style={{ width: `${cat.estimatedKgDiverted > 0 ? Math.max(4, pct) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[#E2E6EE] flex items-center gap-2 text-xs text-[#047857] font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Complete a dual-OTP handover in the Exchanges tab to watch these live SQLite metrics
          increment in real time.
        </div>
      </div>
    </div>
  );
};
