import React from 'react';
import {
  CalculationInput,
  CalculationResult,
  formatKRW,
  formatKoreanUnit,
} from '../utils/interestCalculator';

interface ResultSummaryPanelProps {
  input: CalculationInput;
  result: CalculationResult;
}

export const ResultSummaryPanel: React.FC<ResultSummaryPanelProps> = ({
  input,
  result,
}) => {
  const isDeposit = input.productType === 'deposit';
  const totalForRatio = Math.max(1, result.grossMaturityAmount);
  const principalPct = (result.principal / totalForRatio) * 100;
  const netInterestPct = (result.netInterest / totalForRatio) * 100;
  const taxPct = (result.taxAmount / totalForRatio) * 100;

  return (
    <section
      aria-label="만기 이자 및 실수령액 계산 결과"
      className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6"
    >
      {/* Primary Focal Anchor: 실제 받을 금액 */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {isDeposit ? '정기예금' : '정기적금'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{input.months}개월</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">연 {input.annualRate.toFixed(2)}%</span>
            <span aria-hidden="true">·</span>
            <span>{input.interestMethod === 'simple' ? '단리' : '월복리'}</span>
          </div>
          <span className="font-mono-num text-emerald-700 font-semibold">
            세후 수익률 +{result.effectiveReturnRate.toFixed(2)}%
          </span>
        </div>

        <div className="pt-1 pb-5 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-600 mb-1.5">
            실제 받을 금액 (세후 만기 수령액)
          </p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-mono-num">
              {formatKRW(result.netMaturityAmount)}
            </h2>
            <span className="text-sm font-medium text-slate-500">
              ({formatKoreanUnit(result.netMaturityAmount)})
            </span>
          </div>
        </div>

        {/* Core Breakdown Ledger */}
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <dt className="font-medium text-slate-700">
                {isDeposit ? '예치 원금' : '총 납입 원금'}
              </dt>
              {!isDeposit && (
                <dd className="text-xs text-slate-500 mt-0.5 font-mono-num">
                  월 {formatKRW(input.amount)} × {input.months}개월
                </dd>
              )}
            </div>
            <dd className="text-base font-semibold text-slate-900 font-mono-num text-right">
              {formatKRW(result.principal)}
            </dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <dt className="font-medium text-slate-700">세전 이자</dt>
            <dd className="text-base font-semibold text-slate-900 font-mono-num text-right">
              +{formatKRW(result.grossInterest)}
            </dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4 bg-slate-50/70 -mx-6 px-6">
            <div>
              <dt className="font-semibold text-slate-800">만기 예상 금액 (세전)</dt>
              <dd className="text-xs text-slate-500 mt-0.5">
                원금과 세전 이자를 합산한 세금 공제 전 금액
              </dd>
            </div>
            <dd className="text-lg font-bold text-slate-900 font-mono-num text-right">
              {formatKRW(result.grossMaturityAmount)}
            </dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <dt className="font-medium text-slate-700">이자과세 (15.4%)</dt>
              <dd className="text-xs text-slate-500 mt-0.5 font-mono-num">
                소득세 14% ({formatKRW(result.incomeTax)}) · 지방소득세 1.4% (
                {formatKRW(result.localTax)})
              </dd>
            </div>
            <dd className="text-base font-semibold text-amber-700 font-mono-num text-right">
              -{formatKRW(result.taxAmount)}
            </dd>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <dt className="font-medium text-slate-700">세후 실수령 이자</dt>
            <dd className="text-base font-semibold text-emerald-700 font-mono-num text-right">
              +{formatKRW(result.netInterest)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Composition Bar */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">만기 금액 구성 비율</span>
          <span className="font-mono-num">세전 합계 {formatKRW(result.grossMaturityAmount)}</span>
        </div>

        <div
          className="h-3 w-full rounded-full overflow-hidden bg-slate-100 flex"
          role="img"
          aria-label={`원금 ${principalPct.toFixed(1)}%, 세후 이자 ${netInterestPct.toFixed(1)}%, 세금 ${taxPct.toFixed(1)}%`}
        >
          <div
            style={{ width: `${principalPct}%` }}
            className="bg-slate-800 transition-all duration-200"
          />
          <div
            style={{ width: `${netInterestPct}%` }}
            className="bg-emerald-600 transition-all duration-200"
          />
          <div
            style={{ width: `${taxPct}%` }}
            className="bg-amber-500 transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 shrink-0" />
              <span>원금</span>
            </div>
            <p className="font-semibold text-slate-900 font-mono-num">
              {principalPct.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0" />
              <span>세후 이자</span>
            </div>
            <p className="font-semibold text-emerald-700 font-mono-num">
              {netInterestPct.toFixed(2)}%
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0" />
              <span>세금 (15.4%)</span>
            </div>
            <p className="font-semibold text-amber-700 font-mono-num">
              {taxPct.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
