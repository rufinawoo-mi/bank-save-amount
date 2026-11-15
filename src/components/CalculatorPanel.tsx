import React from 'react';
import { RotateCcw, Plus, Minus, BookmarkPlus } from 'lucide-react';
import {
  CalculationInput,
  InterestMethod,
  ProductType,
  formatKoreanUnit,
  formatNumberWithCommas,
} from '../utils/interestCalculator';

interface CalculatorPanelProps {
  input: CalculationInput;
  onChange: (next: CalculationInput) => void;
  onSaveScenario: () => void;
  onReset: () => void;
}

const DEPOSIT_QUICK_AMOUNTS = [
  { label: '+100만', value: 1_000_000 },
  { label: '+500만', value: 5_000_000 },
  { label: '+1,000만', value: 10_000_000 },
  { label: '+5,000만', value: 50_000_000 },
];

const SAVINGS_QUICK_AMOUNTS = [
  { label: '+10만', value: 100_000 },
  { label: '+30만', value: 300_000 },
  { label: '+50만', value: 500_000 },
  { label: '+100만', value: 1_000_000 },
];

const QUICK_MONTHS = [6, 12, 24, 36];

export const CalculatorPanel: React.FC<CalculatorPanelProps> = ({
  input,
  onChange,
  onSaveScenario,
  onReset,
}) => {
  const isDeposit = input.productType === 'deposit';
  const quickAmounts = isDeposit ? DEPOSIT_QUICK_AMOUNTS : SAVINGS_QUICK_AMOUNTS;

  const handleProductChange = (productType: ProductType) => {
    if (productType === input.productType) return;
    const defaultAmount = productType === 'deposit' ? 10_000_000 : 500_000;
    const defaultRate = productType === 'deposit' ? 3.5 : 4.0;
    onChange({
      ...input,
      productType,
      amount: defaultAmount,
      annualRate: defaultRate,
    });
  };

  const handleAmountTextChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    const parsed = digits === '' ? 0 : Math.min(100_000_000_000, parseInt(digits, 10));
    onChange({ ...input, amount: parsed });
  };

  const handleMonthsChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits === '') {
      onChange({ ...input, months: 1 });
      return;
    }
    const parsed = Math.max(1, Math.min(600, parseInt(digits, 10)));
    onChange({ ...input, months: parsed });
  };

  const handleRateChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    const parsed = normalized === '' || normalized === '.' ? 0 : parseFloat(normalized);
    const clamped = Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 0));
    onChange({ ...input, annualRate: clamped });
  };

  const adjustRate = (delta: number) => {
    const next = Math.max(0, Math.min(100, Math.round((input.annualRate + delta) * 100) / 100));
    onChange({ ...input, annualRate: next });
  };

  const handleMethodChange = (interestMethod: InterestMethod) => {
    onChange({ ...input, interestMethod });
  };

  return (
    <section
      aria-label="예금 및 적금 조건 입력"
      className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6"
    >
      <div className="space-y-6">
        {/* Product Type Switcher */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2">
            상품 구분
          </label>
          <div
            role="tablist"
            aria-label="금융 상품 선택"
            className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isDeposit}
              onClick={() => handleProductChange('deposit')}
              className={`min-h-[42px] px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isDeposit
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              정기예금
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isDeposit}
              onClick={() => handleProductChange('savings')}
              className={`min-h-[42px] px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                !isDeposit
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              정기적금
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {isDeposit
              ? '목돈을 한 번에 예치하고 만기 시 이자를 받는 방식입니다.'
              : '매달 일정 금액을 적립하여 만기 시 목돈을 모으는 방식입니다.'}
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Amount Input: 예치금액 (예금) vs 매달 입금액 (적금) */}
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <label htmlFor="amount-input" className="text-sm font-semibold text-slate-800">
              {isDeposit ? '예치금액' : '매달 입금액'}
            </label>
            <span className="text-xs font-medium text-blue-700 font-mono-num">
              {formatKoreanUnit(input.amount)}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              id="amount-input"
              type="text"
              inputMode="numeric"
              value={formatNumberWithCommas(input.amount)}
              onChange={(e) => handleAmountTextChange(e.target.value)}
              aria-label={isDeposit ? '예치금액 입력 (원)' : '매달 입금액 입력 (원)'}
              className="w-full min-h-[48px] pl-4 pr-12 py-2.5 text-right text-lg font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
            />
            <span className="absolute right-4 text-sm font-medium text-slate-500 pointer-events-none">
              원
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-2.5">
            {quickAmounts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onChange({ ...input, amount: input.amount + item.value })}
                className="min-h-[36px] px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap shrink-0 font-mono-num focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Months Input: 개월수 */}
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <label htmlFor="months-input" className="text-sm font-semibold text-slate-800">
              개월수
            </label>
            <span className="text-xs text-slate-500 tabular-nums">
              {input.months >= 12
                ? `${Math.floor(input.months / 12)}년 ${input.months % 12 > 0 ? `${input.months % 12}개월` : ''}`
                : `${input.months}개월`}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              id="months-input"
              type="number"
              min={1}
              max={600}
              value={input.months}
              onChange={(e) => handleMonthsChange(e.target.value)}
              aria-label="예치 기간 개월수"
              className="w-full min-h-[46px] pl-4 pr-14 py-2 text-right text-lg font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
            />
            <span className="absolute right-4 text-sm font-medium text-slate-500 pointer-events-none">
              개월
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-2.5">
            {QUICK_MONTHS.map((m) => {
              const active = input.months === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ ...input, months: m })}
                  className={`min-h-[36px] px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 font-mono-num focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {m}개월
                </button>
              );
            })}
          </div>
        </div>

        {/* Interest Rate Input: 이율 */}
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <label htmlFor="rate-input" className="text-sm font-semibold text-slate-800">
              연 이율
            </label>
            <span className="text-xs text-slate-500">세전 기준 연율</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustRate(-0.1)}
              aria-label="이율 0.1% 감소"
              className="min-w-[44px] min-h-[46px] flex items-center justify-center border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="relative flex-1 flex items-center">
              <input
                id="rate-input"
                type="number"
                step="0.05"
                min={0}
                max={100}
                value={input.annualRate}
                onChange={(e) => handleRateChange(e.target.value)}
                aria-label="연 이율 (%)"
                className="w-full min-h-[46px] pl-4 pr-10 py-2 text-right text-lg font-semibold text-slate-900 font-mono-num bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
              />
              <span className="absolute right-4 text-sm font-medium text-slate-500 pointer-events-none">
                %
              </span>
            </div>
            <button
              type="button"
              onClick={() => adjustRate(0.1)}
              aria-label="이율 0.1% 증가"
              className="min-w-[44px] min-h-[46px] flex items-center justify-center border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3">
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.1}
              value={Math.min(10, Math.max(0.5, input.annualRate))}
              onChange={(e) =>
                onChange({ ...input, annualRate: parseFloat(e.target.value) })
              }
              aria-label="연 이율 슬라이더"
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono-num mt-1">
              <span>0.5%</span>
              <span>3.5%</span>
              <span>7.0%</span>
              <span>10.0%</span>
            </div>
          </div>
        </div>

        {/* Interest Method & Tax Info */}
        <div className="pt-2 space-y-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-600">이자 계산 방식</span>
            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200/70">
              <button
                type="button"
                onClick={() => handleMethodChange('simple')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  input.interestMethod === 'simple'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                단리
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('compound')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  input.interestMethod === 'compound'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                월복리
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>적용 이자과세</span>
            <span className="font-medium text-slate-700 font-mono-num">
              일반과세 15.4% (소득세 14% · 지방소득세 1.4%)
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={onSaveScenario}
          className="flex-1 min-h-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <BookmarkPlus className="w-4 h-4" />
          <span>비교 목록에 저장</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] px-4 py-2.5 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <RotateCcw className="w-4 h-4" />
          <span>초기화</span>
        </button>
      </div>
    </section>
  );
};
