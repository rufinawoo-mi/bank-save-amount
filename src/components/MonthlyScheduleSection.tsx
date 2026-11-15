import React, { useState } from 'react';
import { Download, Table, BarChart3 } from 'lucide-react';
import {
  CalculationInput,
  MonthlyScheduleRow,
  formatKRW,
} from '../utils/interestCalculator';

interface MonthlyScheduleSectionProps {
  input: CalculationInput;
  schedule: MonthlyScheduleRow[];
}

export const MonthlyScheduleSection: React.FC<MonthlyScheduleSectionProps> = ({
  input,
  schedule,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyScheduleRow | null>(null);

  const maxGrossTotal = schedule.length > 0 ? schedule[schedule.length - 1].grossTotal : 1;

  // Sample rows for chart if months > 36 so bars stay legible
  const chartRows =
    schedule.length <= 36
      ? schedule
      : schedule.filter(
          (row, idx) =>
            idx === 0 ||
            idx === schedule.length - 1 ||
            (row.month % Math.ceil(schedule.length / 24) === 0)
        );

  const handleDownloadCSV = () => {
    const headers = [
      '회차(개월)',
      '누적원금(원)',
      '당월이자_세전(원)',
      '누적이자_세전(원)',
      '예상세금_15.4%(원)',
      '만기예상금액_세전(원)',
      '실제받을금액_세후(원)',
    ];
    const rows = schedule.map((r) => [
      r.month,
      r.cumulativePrincipal,
      r.monthlyGrossInterest,
      r.cumulativeGrossInterest,
      r.cumulativeTax,
      r.grossTotal,
      r.netTotal,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const typeLabel = input.productType === 'deposit' ? '정기예금' : '정기적금';
    link.download = `${typeLabel}_${input.months}개월_연${input.annualRate}%_이자내역.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="schedule"
      aria-label="월별 이자 및 잔액 추이"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">월별 누적 이자 및 실수령액 추이</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            매월 경과 시점 기준 누적 원금과 15.4% 세금 공제 후 예상 금액을 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>상세 표</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'chart'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>누적 그래프</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 저장</span>
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-[380px] overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 whitespace-nowrap">경과 기간</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">누적 원금</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">당월 이자(세전)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">누적 이자(세전)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">예상 세금(15.4%)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">세후 실수령액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] font-mono-num">
                {schedule.map((row) => {
                  const isFinal = row.month === schedule.length;
                  return (
                    <tr
                      key={row.month}
                      className={`h-[40px] transition-colors ${
                        isFinal
                          ? 'bg-blue-50/50 font-semibold'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2 px-4 text-slate-700 whitespace-nowrap">
                        {row.month}개월{isFinal ? ' (만기)' : ''}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-900 whitespace-nowrap">
                        {formatKRW(row.cumulativePrincipal)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-600 whitespace-nowrap">
                        +{formatKRW(row.monthlyGrossInterest)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-900 whitespace-nowrap">
                        +{formatKRW(row.cumulativeGrossInterest)}
                      </td>
                      <td className="py-2 px-4 text-right text-amber-700 whitespace-nowrap">
                        -{formatKRW(row.cumulativeTax)}
                      </td>
                      <td className="py-2 px-4 text-right text-emerald-700 font-semibold whitespace-nowrap">
                        {formatKRW(row.netTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Interactive Hover Readout */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
            <div className="font-semibold text-slate-800">
              {hoveredMonth
                ? `${hoveredMonth.month}개월 시점`
                : `만기 (${schedule[schedule.length - 1]?.month ?? 0}개월) 시점`}
            </div>
            <div className="flex flex-wrap items-center gap-4 font-mono-num">
              <span className="text-slate-600">
                원금{' '}
                <strong className="text-slate-900">
                  {formatKRW(
                    (hoveredMonth ?? schedule[schedule.length - 1])?.cumulativePrincipal ?? 0
                  )}
                </strong>
              </span>
              <span className="text-emerald-700">
                세후이자{' '}
                <strong>
                  +{formatKRW(
                    (hoveredMonth ?? schedule[schedule.length - 1])?.cumulativeNetInterest ?? 0
                  )}
                </strong>
              </span>
              <span className="text-amber-700">
                세금{' '}
                <strong>
                  -{formatKRW(
                    (hoveredMonth ?? schedule[schedule.length - 1])?.cumulativeTax ?? 0
                  )}
                </strong>
              </span>
              <span className="text-slate-900">
                실수령액{' '}
                <strong>
                  {formatKRW(
                    (hoveredMonth ?? schedule[schedule.length - 1])?.netTotal ?? 0
                  )}
                </strong>
              </span>
            </div>
          </div>

          {/* Stacked Bar Visualization */}
          <div
            className="h-64 flex items-end gap-1.5 pt-4 pb-2 px-2 border border-slate-200 rounded-lg bg-slate-50/40"
            onMouseLeave={() => setHoveredMonth(null)}
          >
            {chartRows.map((row) => {
              const principalHeight = (row.cumulativePrincipal / maxGrossTotal) * 100;
              const netIntHeight = (row.cumulativeNetInterest / maxGrossTotal) * 100;
              const taxHeight = (row.cumulativeTax / maxGrossTotal) * 100;
              const isSelected = hoveredMonth?.month === row.month;

              return (
                <div
                  key={row.month}
                  onMouseEnter={() => setHoveredMonth(row)}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                >
                  <div
                    className={`w-full max-w-[32px] flex flex-col-reverse rounded-t-sm overflow-hidden transition-opacity ${
                      hoveredMonth && !isSelected ? 'opacity-55' : 'opacity-100'
                    }`}
                    style={{
                      height: `${Math.max(4, principalHeight + netIntHeight + taxHeight)}%`,
                    }}
                  >
                    <div
                      style={{
                        height: `${
                          (principalHeight /
                            Math.max(0.01, principalHeight + netIntHeight + taxHeight)) *
                          100
                        }%`,
                      }}
                      className="w-full bg-slate-800"
                    />
                    <div
                      style={{
                        height: `${
                          (netIntHeight /
                            Math.max(0.01, principalHeight + netIntHeight + taxHeight)) *
                          100
                        }%`,
                      }}
                      className="w-full bg-emerald-600"
                    />
                    <div
                      style={{
                        height: `${
                          (taxHeight /
                            Math.max(0.01, principalHeight + netIntHeight + taxHeight)) *
                          100
                        }%`,
                      }}
                      className="w-full bg-amber-500"
                    />
                  </div>
                  <span className="mt-1.5 text-[10px] text-slate-500 font-mono-num whitespace-nowrap">
                    {row.month}M
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
