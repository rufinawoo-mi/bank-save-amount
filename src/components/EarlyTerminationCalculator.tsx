import React, { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw, Import, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  CalculationInput,
  EarlyTerminationInput,
  calculateEarlyTermination,
  formatKRW,
  formatKoreanUnit,
  formatNumberWithCommas,
} from '../utils/interestCalculator';

interface EarlyTerminationCalculatorProps {
  depositSourceInput: CalculationInput;
}

const DEFAULT_EARLY_INPUT: EarlyTerminationInput = {
  principal: 10_000_000,
  totalMonths: 12,
  elapsedMonths: 3,
  previousRate: 3.0,
  earlyPenaltyRate: 0.5,
  currentRate: 4.5,
  reinvestInterest: true,
  interestMethod: 'simple',
};

const QUICK_PENALTY_PRESETS = [
  { label: '0.3%', getValue: () => 0.3 },
  { label: '0.5%', getValue: () => 0.5 },
  { label: '1.0%', getValue: () => 1.0 },
  { label: '약정의 50%', getValue: (prev: number) => Math.round(prev * 0.5 * 100) / 100 },
];

export const EarlyTerminationCalculator: React.FC<EarlyTerminationCalculatorProps> = ({
  depositSourceInput,
}) => {
  const [earlyInput, setEarlyInput] = useState<EarlyTerminationInput>(DEFAULT_EARLY_INPUT);

  const result = useMemo(() => calculateEarlyTermination(earlyInput), [earlyInput]);

  // Sensitivity rows: compare net difference across possible elapsed months (1 ~ totalMonths - 1)
  const sensitivityRows = useMemo(() => {
    const maxM = Math.max(2, earlyInput.totalMonths);
    const step = maxM <= 12 ? 1 : maxM <= 24 ? 2 : Math.ceil(maxM / 12);
    const monthsList: number[] = [];
    for (let m = 1; m < maxM; m += step) {
      monthsList.push(m);
    }
    if (!monthsList.includes(earlyInput.elapsedMonths) && earlyInput.elapsedMonths < maxM) {
      monthsList.push(earlyInput.elapsedMonths);
      monthsList.sort((a, b) => a - b);
    }
    return monthsList.map((m) => {
      const sim = calculateEarlyTermination({ ...earlyInput, elapsedMonths: m });
      return {
        elapsedMonths: m,
        remainingMonths: maxM - m,
        keepNetMaturity: sim.keep.netMaturityAmount,
        switchNetMaturity: sim.switchTotal.netMaturityAmount,
        netDiff: sim.diff.netInterestDiff,
        breakEvenRate: sim.diff.breakEvenRate,
      };
    });
  }, [earlyInput]);

  const handlePrincipalChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    const parsed = digits === '' ? 0 : Math.min(100_000_000_000, parseInt(digits, 10));
    setEarlyInput((prev) => ({ ...prev, principal: parsed }));
  };

  const handleTotalMonthsChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    const parsed = digits === '' ? 2 : Math.max(2, Math.min(600, parseInt(digits, 10)));
    setEarlyInput((prev) => ({
      ...prev,
      totalMonths: parsed,
      elapsedMonths: Math.min(prev.elapsedMonths, parsed - 1),
    }));
  };

  const handleElapsedMonthsChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    const parsed =
      digits === ''
        ? 1
        : Math.max(1, Math.min(earlyInput.totalMonths - 1, parseInt(digits, 10)));
    setEarlyInput((prev) => ({ ...prev, elapsedMonths: parsed }));
  };

  const parseRateInput = (raw: string): number => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    const parsed = normalized === '' || normalized === '.' ? 0 : parseFloat(normalized);
    return Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 0));
  };

  const handleImportFromDeposit = () => {
    const importedAmount =
      depositSourceInput.productType === 'deposit'
        ? depositSourceInput.amount
        : depositSourceInput.amount * depositSourceInput.months;
    const importedMonths = Math.max(2, depositSourceInput.months);
    setEarlyInput((prev) => ({
      ...prev,
      principal: importedAmount,
      totalMonths: importedMonths,
      elapsedMonths: Math.min(prev.elapsedMonths, Math.max(1, importedMonths - 1)),
      previousRate: depositSourceInput.annualRate,
      interestMethod: depositSourceInput.interestMethod,
    }));
  };

  const handleReset = () => {
    setEarlyInput(DEFAULT_EARLY_INPUT);
  };

  const diffSign = result.diff.netInterestDiff > 0 ? '+' : '';
  const rateSpreadSign = result.rateSpread > 0 ? '+' : '';

  return (
    <div className="space-y-8">
      {/* Main 12-column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 5 cols: Early Termination Inputs */}
        <section
          aria-label="예금 중도해지 및 금리 비교 조건 입력"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">기존 예금 · 갈아타기 조건</h2>
              <button
                type="button"
                onClick={handleImportFromDeposit}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Import className="w-3.5 h-3.5" />
                <span>계산기 예치금 불러오기</span>
              </button>
            </div>

            {/* 예치금액 */}
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <label htmlFor="early-principal" className="text-sm font-semibold text-slate-800">
                  기존 예치금액
                </label>
                <span className="text-xs font-medium text-blue-700 font-mono-num">
                  {formatKoreanUnit(earlyInput.principal)}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="early-principal"
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithCommas(earlyInput.principal)}
                  onChange={(e) => handlePrincipalChange(e.target.value)}
                  className="w-full min-h-[44px] pl-4 pr-10 py-2 text-right text-base font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
                />
                <span className="absolute right-3.5 text-sm font-medium text-slate-500 pointer-events-none">
                  원
                </span>
              </div>
            </div>

            {/* 약정 개월수 & 경과 개월수 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="early-total-months"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  총 약정 개월수
                </label>
                <div className="relative flex items-center">
                  <input
                    id="early-total-months"
                    type="number"
                    min={2}
                    max={600}
                    value={earlyInput.totalMonths}
                    onChange={(e) => handleTotalMonthsChange(e.target.value)}
                    className="w-full min-h-[42px] pl-3 pr-12 py-2 text-right text-base font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  />
                  <span className="absolute right-3 text-xs font-medium text-slate-500 pointer-events-none">
                    개월
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="early-elapsed-months"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  경과 개월수 (잔여 {result.remainingMonths}개월)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="early-elapsed-months"
                    type="number"
                    min={1}
                    max={Math.max(1, earlyInput.totalMonths - 1)}
                    value={earlyInput.elapsedMonths}
                    onChange={(e) => handleElapsedMonthsChange(e.target.value)}
                    className="w-full min-h-[42px] pl-3 pr-12 py-2 text-right text-base font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  />
                  <span className="absolute right-3 text-xs font-medium text-slate-500 pointer-events-none">
                    개월
                  </span>
                </div>
              </div>
            </div>

            <div>
              <input
                type="range"
                min={1}
                max={Math.max(1, earlyInput.totalMonths - 1)}
                step={1}
                value={earlyInput.elapsedMonths}
                onChange={(e) =>
                  setEarlyInput((prev) => ({
                    ...prev,
                    elapsedMonths: parseInt(e.target.value, 10),
                  }))
                }
                aria-label="경과 개월수 조절 슬라이더"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono-num mt-1">
                <span>1개월 경과</span>
                <span>중도해지 시점: {earlyInput.elapsedMonths}개월</span>
                <span>잔여 {result.remainingMonths}개월</span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 이전 이율 vs 현재 이율 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="previous-rate"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  이전 이율 (기존 약정)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="previous-rate"
                    type="number"
                    step="0.05"
                    min={0}
                    max={100}
                    value={earlyInput.previousRate}
                    onChange={(e) =>
                      setEarlyInput((prev) => ({
                        ...prev,
                        previousRate: parseRateInput(e.target.value),
                      }))
                    }
                    className="w-full min-h-[44px] pl-3 pr-8 py-2 text-right text-base font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  />
                  <span className="absolute right-3 text-xs font-medium text-slate-500 pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="current-rate"
                  className="block text-xs font-semibold text-blue-800 mb-1.5"
                >
                  현재 이율 (새 상품)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="current-rate"
                    type="number"
                    step="0.05"
                    min={0}
                    max={100}
                    value={earlyInput.currentRate}
                    onChange={(e) =>
                      setEarlyInput((prev) => ({
                        ...prev,
                        currentRate: parseRateInput(e.target.value),
                      }))
                    }
                    className="w-full min-h-[44px] pl-3 pr-8 py-2 text-right text-base font-semibold text-blue-900 font-mono-num bg-blue-50/40 border border-blue-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  />
                  <span className="absolute right-3 text-xs font-medium text-blue-600 pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* 중도해지 적용 이율 */}
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <label
                  htmlFor="penalty-rate"
                  className="text-xs font-semibold text-slate-700"
                >
                  중도해지 적용 이율 (경과분)
                </label>
                <span className="text-[11px] text-slate-500">
                  해지 시 기존 예금에 적용되는 연율
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="penalty-rate"
                  type="number"
                  step="0.05"
                  min={0}
                  max={100}
                  value={earlyInput.earlyPenaltyRate}
                  onChange={(e) =>
                    setEarlyInput((prev) => ({
                      ...prev,
                      earlyPenaltyRate: parseRateInput(e.target.value),
                    }))
                  }
                  className="w-full min-h-[42px] pl-3 pr-8 py-2 text-right text-base font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
                <span className="absolute right-3 text-xs font-medium text-slate-500 pointer-events-none">
                  %
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {QUICK_PENALTY_PRESETS.map((preset) => {
                  const val = preset.getValue(earlyInput.previousRate);
                  const active = Math.abs(earlyInput.earlyPenaltyRate - val) < 0.001;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setEarlyInput((prev) => ({ ...prev, earlyPenaltyRate: val }))
                      }
                      className={`min-h-[34px] px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 font-mono-num focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 재예치 방식 & 이자 계산 방식 */}
            <div className="pt-2 space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-600">해지 후 재예치 금액</span>
                <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() =>
                      setEarlyInput((prev) => ({ ...prev, reinvestInterest: true }))
                    }
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      earlyInput.reinvestInterest
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    원금+해지이자
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEarlyInput((prev) => ({ ...prev, reinvestInterest: false }))
                    }
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      !earlyInput.reinvestInterest
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    원금만 재예치
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-600">이자 계산 방식</span>
                <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() =>
                      setEarlyInput((prev) => ({ ...prev, interestMethod: 'simple' }))
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      earlyInput.interestMethod === 'simple'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    단리
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEarlyInput((prev) => ({ ...prev, interestMethod: 'compound' }))
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      earlyInput.interestMethod === 'compound'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    월복리
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full min-h-[42px] px-4 py-2 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span>기본 조건으로 초기화</span>
          </button>
        </section>

        {/* Right 7 cols: Early Termination Comparison Result */}
        <section
          aria-label="중도해지 및 이율 차액 비교 결과"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6"
        >
          <div className="space-y-5">
            {/* Metadata Line */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700">동일 총 기간 {earlyInput.totalMonths}개월 기준</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">
                  이전 {earlyInput.previousRate.toFixed(2)}% → 현재{' '}
                  {earlyInput.currentRate.toFixed(2)}%
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">
                  금리차 {rateSpreadSign}
                  {result.rateSpread.toFixed(2)}%p
                </span>
              </div>
              <span className="font-mono-num text-slate-600">일반과세 15.4% 반영</span>
            </div>

            {/* Focal Anchor: Net Diff */}
            <div className="pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                {result.diff.netInterestDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                ) : result.diff.netInterestDiff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-rose-700" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-600" />
                )}
                <p className="text-sm font-semibold text-slate-700">
                  {result.diff.netInterestDiff > 0
                    ? '지금 중도해지 후 새 이율로 갈아타는 것이 유리합니다'
                    : result.diff.netInterestDiff < 0
                    ? '중도해지 손실이 커서 기존 예금을 만기까지 유지하는 것이 유리합니다'
                    : '기존 예금 유지와 갈아타기의 세후 수령액이 동일합니다'}
                </p>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2
                  className={`text-3xl sm:text-4xl font-bold tracking-tight font-mono-num ${
                    result.diff.netInterestDiff > 0
                      ? 'text-emerald-700'
                      : result.diff.netInterestDiff < 0
                      ? 'text-rose-700'
                      : 'text-slate-900'
                  }`}
                >
                  {diffSign}
                  {formatKRW(result.diff.netInterestDiff)}
                </h2>
                <span className="text-sm font-medium text-slate-500">
                  (세후 실수령 차액 · {formatKoreanUnit(result.diff.netInterestDiff)})
                </span>
              </div>

              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                손익분기 금리는{' '}
                <strong className="font-mono-num text-slate-900">
                  연 {result.diff.breakEvenRate.toFixed(2)}%
                </strong>
                입니다. 남은 {result.remainingMonths}개월 동안 새 예금 금리가 연{' '}
                {result.diff.breakEvenRate.toFixed(2)}%를 초과해야 중도해지 손실을 만회하고 이득이 됩니다.
              </p>
            </div>

            {/* Side-by-Side Comparison Columns (Clean hairline grid, no nested card clutter) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-slate-100">
              {/* Scenario A: Keep */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">A. 기존 예금 만기 유지</h3>
                  <span className="text-xs font-mono-num text-slate-500">
                    연 {earlyInput.previousRate.toFixed(2)}% · {earlyInput.totalMonths}개월
                  </span>
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">만기 예상 금액 (세전)</dt>
                    <dd className="font-mono-num font-medium text-slate-800">
                      {formatKRW(earlyInput.principal + result.keep.grossInterest)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">세전 이자</dt>
                    <dd className="font-mono-num text-slate-700">
                      +{formatKRW(result.keep.grossInterest)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">세금 (15.4%)</dt>
                    <dd className="font-mono-num text-amber-700">
                      -{formatKRW(result.keep.taxAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                    <dt className="font-semibold text-slate-700">실제 받을 금액 (세후)</dt>
                    <dd className="font-mono-num font-bold text-slate-900">
                      {formatKRW(result.keep.netMaturityAmount)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Scenario B: Switch */}
              <div className="space-y-3 sm:border-l sm:border-slate-100 sm:pl-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">B. 중도해지 후 갈아타기</h3>
                  <span className="text-xs font-mono-num text-blue-700 font-semibold">
                    연 {earlyInput.currentRate.toFixed(2)}% · 잔여 {result.remainingMonths}개월
                  </span>
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">
                      1단계 중도해지 이자 ({earlyInput.elapsedMonths}개월·{earlyInput.earlyPenaltyRate.toFixed(2)}%)
                    </dt>
                    <dd className="font-mono-num text-slate-700">
                      +{formatKRW(result.earlyExit.netInterest)} (세후)
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">
                      2단계 새 예금 이자 ({result.remainingMonths}개월·{earlyInput.currentRate.toFixed(2)}%)
                    </dt>
                    <dd className="font-mono-num text-slate-700">
                      +{formatKRW(result.reinvest.netInterest)} (세후)
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">합산 세금 (15.4%)</dt>
                    <dd className="font-mono-num text-amber-700">
                      -{formatKRW(result.switchTotal.taxAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                    <dt className="font-semibold text-slate-700">합산 실제 수령액 (세후)</dt>
                    <dd
                      className={`font-mono-num font-bold ${
                        result.diff.isSwitchBetter ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {formatKRW(result.switchTotal.netMaturityAmount)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Direct Breakdown of Rate & Penalty Impact */}
            <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-2.5 flex items-center justify-between gap-4">
                <dt className="text-slate-600">
                  경과 {earlyInput.elapsedMonths}개월 중도해지로 인한 기존 이자 감소분 (세전)
                </dt>
                <dd className="font-mono-num font-semibold text-rose-700 text-right">
                  -{formatKRW(result.earlyExit.penaltyLossGross)}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-4">
                <dt className="text-slate-600">
                  세전 총 이자 차액 (갈아타기 - 만기유지)
                </dt>
                <dd className="font-mono-num font-semibold text-slate-900 text-right">
                  {result.diff.grossInterestDiff > 0 ? '+' : ''}
                  {formatKRW(result.diff.grossInterestDiff)}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-4">
                <dt className="text-slate-600">세금(15.4%) 차액</dt>
                <dd className="font-mono-num font-medium text-slate-700 text-right">
                  {result.diff.taxDiff > 0 ? '+' : ''}
                  {formatKRW(result.diff.taxDiff)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Step-by-step Flow Indicator */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-mono-num">
              <span>원금 {formatKRW(earlyInput.principal)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span>해지시 수령 {formatKRW(result.earlyExit.payoutAtExit)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">
                최종 {formatKRW(result.switchTotal.netMaturityAmount)}
              </span>
            </div>
            <span className="text-slate-500">
              {earlyInput.reinvestInterest ? '해지이자 포함 재예치 기준' : '원금만 재예치 기준'}
            </span>
          </div>
        </section>
      </div>

      {/* Bottom Full-Width Sensitivity Table: Elapsed Month vs Net Difference */}
      <section
        aria-label="해지 시점별 유불리 및 손익분기 금리표"
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div>
          <h3 className="text-base font-bold text-slate-900">
            경과 개월별 중도해지 차액 및 손익분기 금리표
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            해지 시점(경과 개월수)이 달라질 때 이전 이율({earlyInput.previousRate.toFixed(2)}%) 유지 대비 현재 이율({earlyInput.currentRate.toFixed(2)}%) 갈아타기 세후 차액과 손익분기 금리를 비교합니다. 행을 클릭하면 해당 경과 개월수로 바로 적용됩니다.
          </p>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 whitespace-nowrap">해지 시점</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">남은 기간</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">만기 유지 (세후)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">갈아타기 (세후)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">세후 이자 차액</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">손익분기 새 이율</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">판정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] font-mono-num">
                {sensitivityRows.map((row) => {
                  const isCurrent = row.elapsedMonths === earlyInput.elapsedMonths;
                  const isBetter = row.netDiff > 0;
                  return (
                    <tr
                      key={row.elapsedMonths}
                      onClick={() =>
                        setEarlyInput((prev) => ({
                          ...prev,
                          elapsedMonths: row.elapsedMonths,
                        }))
                      }
                      className={`h-[40px] cursor-pointer transition-colors ${
                        isCurrent ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-4 text-slate-800 whitespace-nowrap">
                        {row.elapsedMonths}개월 경과{isCurrent ? ' (선택됨)' : ''}
                      </td>
                      <td className="py-2 px-4 text-slate-600 whitespace-nowrap">
                        {row.remainingMonths}개월
                      </td>
                      <td className="py-2 px-4 text-right text-slate-800 whitespace-nowrap">
                        {formatKRW(row.keepNetMaturity)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-900 whitespace-nowrap">
                        {formatKRW(row.switchNetMaturity)}
                      </td>
                      <td
                        className={`py-2 px-4 text-right font-semibold whitespace-nowrap ${
                          isBetter
                            ? 'text-emerald-700'
                            : row.netDiff < 0
                            ? 'text-rose-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {row.netDiff > 0 ? '+' : ''}
                        {formatKRW(row.netDiff)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-700 whitespace-nowrap">
                        연 {row.breakEvenRate.toFixed(2)}%
                      </td>
                      <td
                        className={`py-2 px-4 text-right font-sans text-xs font-semibold whitespace-nowrap ${
                          isBetter
                            ? 'text-emerald-700'
                            : row.netDiff < 0
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {isBetter ? '갈아타기 유리' : row.netDiff < 0 ? '유지 유리' : '동일'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
