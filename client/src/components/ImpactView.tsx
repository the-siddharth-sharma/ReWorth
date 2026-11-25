import React from 'react';
import { BarChart3, Info, CheckCircle2, Scale } from 'lucide-react';
import type { ImpactStats } from '../../../shared/types.ts';

interface ImpactViewProps {
  impact: ImpactStats | null;
}

export const ImpactView: React.FC<ImpactViewProps> = ({ impact }) => {
  if (!impact) {
    return (
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-8 text-center text-sm text-[#5C6460]">
        Loading impact metrics...
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
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F3EC] text-[#1B4332] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B4332]">Circular Impact Dashboard</h1>
            <p className="text-xs sm:text-sm text-[#5C6460] mt-1">
              Every figure below is computed directly from SQLite exchange records. Actual counts
              and estimated material weights are explicitly separated.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4DFD7] text-xs text-[#5C6460] flex items-start gap-2">
          <Info className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#1D2420]">Actual vs. Estimated Methodology:</strong>{' '}
            {impact.methodologyNote}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5">
          <div className="flex items-center justify-between text-xs text-[#5C6460] mb-1">
            <span>Exchanges Completed</span>
            <span className="px-2 py-0.5 rounded bg-[#E8F3EC] text-[#1B4332] font-semibold text-[10px]">
              ACTUAL
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#1B4332]">
            {impact.totalCompletedExchanges}
          </div>
          <div className="text-[11px] text-[#5C6460] mt-1">
            {impact.liveCompletedExchanges} live user · {impact.sampleCompletedExchanges} sample demo
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5">
          <div className="flex items-center justify-between text-xs text-[#5C6460] mb-1">
            <span>Distinct Resources Reused</span>
            <span className="px-2 py-0.5 rounded bg-[#E8F3EC] text-[#1B4332] font-semibold text-[10px]">
              ACTUAL
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#1B4332]">
            {impact.totalResourcesReused}
          </div>
          <div className="text-[11px] text-[#5C6460] mt-1">
            Verified completed handovers
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5">
          <div className="flex items-center justify-between text-xs text-[#5C6460] mb-1">
            <span>Material Diverted (kg)</span>
            <span className="px-2 py-0.5 rounded bg-[#F6EFE8] text-[#9C6B43] font-semibold text-[10px]">
              ESTIMATED
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#9C6B43]">
            {impact.totalEstimatedKgDiverted} kg
          </div>
          <div className="text-[11px] text-[#5C6460] mt-1">
            {impact.liveEstimatedKgDiverted} kg from live exchanges
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5">
          <div className="flex items-center justify-between text-xs text-[#5C6460] mb-1">
            <span>Active Supply / Needs</span>
            <span className="px-2 py-0.5 rounded bg-[#E8F3EC] text-[#1B4332] font-semibold text-[10px]">
              ACTUAL
            </span>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#1D2420]">
            {impact.activeAvailableResources} / {impact.openNeedsCount}
          </div>
          <div className="text-[11px] text-[#5C6460] mt-1">
            Available listings vs open needs
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#1D2420] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#2D6A4F]" />
            Category-Wise Reuse &amp; Active Supply
          </h2>
          <span className="text-xs text-[#5C6460]">Completed vs Available</span>
        </div>

        <div className="space-y-3.5">
          {impact.categoryBreakdown.map((cat) => {
            const pct = Math.round((cat.estimatedKgDiverted / maxKg) * 100);
            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#1D2420]">{cat.category}</span>
                  <span className="text-[#5C6460] font-mono-num">
                    {cat.completedExchanges} completed ({cat.actualUnitsReused} units · est.{' '}
                    {cat.estimatedKgDiverted} kg) · {cat.activeListings} active
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#F3EFEA] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2D6A4F] transition-all"
                    style={{ width: `${cat.estimatedKgDiverted > 0 ? Math.max(4, pct) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[#E4DFD7] flex items-center gap-2 text-xs text-[#2D6A4F]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Complete an exchange in the Exchanges tab to watch these live SQLite metrics increment
          in real time.
        </div>
      </div>
    </div>
  );
};
