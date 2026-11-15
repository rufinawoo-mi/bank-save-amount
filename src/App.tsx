/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, useEffect } from 'react';
import { CalculatorPanel } from './components/CalculatorPanel';
import { ResultSummaryPanel } from './components/ResultSummaryPanel';
import { MonthlyScheduleSection } from './components/MonthlyScheduleSection';
import { SavedComparisonsSection } from './components/SavedComparisonsSection';
import { EarlyTerminationCalculator } from './components/EarlyTerminationCalculator';
import {
  CalculationInput,
  SavedScenario,
  calculateInterest,
  formatKRW,
} from './utils/interestCalculator';

const DEFAULT_DEPOSIT_INPUT: CalculationInput = {
  productType: 'deposit',
  amount: 10_000_000,
  months: 12,
  annualRate: 3.5,
  interestMethod: 'simple',
};

const STORAGE_KEY = 'bank_interest_saved_scenarios_v1';

function createInitialScenarios(): SavedScenario[] {
  const sampleDeposit: CalculationInput = {
    productType: 'deposit',
    amount: 10_000_000,
    months: 12,
    annualRate: 3.5,
    interestMethod: 'simple',
  };
  const sampleSavings: CalculationInput = {
    productType: 'savings',
    amount: 500_000,
    months: 12,
    annualRate: 4.0,
    interestMethod: 'simple',
  };

  return [
    {
      ...sampleDeposit,
      id: 'sample-deposit-1',
      label: '정기예금 1,000만원 · 12개월',
      result: calculateInterest(sampleDeposit),
      createdAt: Date.now() - 1000,
    },
    {
      ...sampleSavings,
      id: 'sample-savings-1',
      label: '정기적금 월 50만원 · 12개월',
      result: calculateInterest(sampleSavings),
      createdAt: Date.now(),
    },
  ];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'standard' | 'early-termination'>('standard');
  const [input, setInput] = useState<CalculationInput>(DEFAULT_DEPOSIT_INPUT);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedScenario[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return createInitialScenarios();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch {
      // Ignore storage write errors
    }
  }, [scenarios]);

  const result = useMemo(() => calculateInterest(input), [input]);

  const handleSaveScenario = () => {
    const typeLabel = input.productType === 'deposit' ? '정기예금' : '정기적금';
    const amountLabel =
      input.productType === 'deposit'
        ? formatKRW(input.amount)
        : `월 ${formatKRW(input.amount)}`;
    const newScenario: SavedScenario = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: `${typeLabel} ${amountLabel} · ${input.months}개월`,
      result,
      createdAt: Date.now(),
    };
    setScenarios((prev) => [newScenario, ...prev]);
    setSavedFeedback('비교 목록에 저장되었습니다.');
    window.setTimeout(() => {
      setSavedFeedback((current) =>
        current === '비교 목록에 저장되었습니다.' ? null : current
      );
    }, 2200);
  };

  const handleReset = () => {
    if (input.productType === 'deposit') {
      setInput({
        productType: 'deposit',
        amount: 10_000_000,
        months: 12,
        annualRate: 3.5,
        interestMethod: 'simple',
      });
    } else {
      setInput({
        productType: 'savings',
        amount: 500_000,
        months: 12,
        annualRate: 4.0,
        interestMethod: 'simple',
      });
    }
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    setInput({
      productType: scenario.productType,
      amount: scenario.amount,
      months: scenario.months,
      annualRate: scenario.annualRate,
      interestMethod: scenario.interestMethod,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setScenarios([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar: Strict 3-zone contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#calculator"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            은행 이자 계산기
          </a>

          <nav
            aria-label="페이지 섹션 탐색"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#calculator"
              onClick={() => setActiveTab('standard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'standard' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              예금·적금 계산
            </a>
            <a
              href="#calculator"
              onClick={() => setActiveTab('early-termination')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'early-termination' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              중도해지 금리비교
            </a>
            <a
              href="#schedule"
              onClick={() => setActiveTab('standard')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              월별 이자 추이
            </a>
            <a
              href="#comparisons"
              onClick={() => setActiveTab('standard')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              조건 비교표
            </a>
            <a
              href="#formula-guide"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              계산 기준 안내
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'standard' ? (
              <button
                type="button"
                onClick={handleSaveScenario}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                현재 조건 저장
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('standard')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                만기 계산기 보기
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page Heading & Workspace Mode Switcher */}
        <div id="calculator" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                {activeTab === 'standard'
                  ? '예금 · 적금 만기 수령액 계산'
                  : '예금 중도해지 · 금리 갈아타기 비교'}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {activeTab === 'standard'
                  ? '예치금액 또는 매달 입금액, 개월수, 연 이율을 입력하면 만기 예상 금액과 이자소득세 15.4%를 제외한 실제 수령액을 즉시 계산합니다.'
                  : '기존 예금을 중도에 해지하고 현재 이율의 새 예금으로 갈아탈 때, 세금 15.4% 공제 후 실제 차액과 손익분기 금리를 비교합니다.'}
              </p>
            </div>
            {savedFeedback && activeTab === 'standard' && (
              <p
                role="status"
                aria-live="polite"
                className="text-xs font-semibold text-emerald-700 shrink-0"
              >
                {savedFeedback}
              </p>
            )}
          </div>

          <div
            role="tablist"
            aria-label="계산기 기능 전환"
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg border border-slate-200"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'standard'}
              onClick={() => setActiveTab('standard')}
              className={`min-h-[38px] px-4 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeTab === 'standard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              예금·적금 만기 계산
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'early-termination'}
              onClick={() => setActiveTab('early-termination')}
              className={`min-h-[38px] px-4 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeTab === 'early-termination'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              예금 중도해지 · 금리 비교
            </button>
          </div>
        </div>

        {activeTab === 'standard' ? (
          <>
            {/* Core Calculator Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 flex flex-col">
                <CalculatorPanel
                  input={input}
                  onChange={setInput}
                  onSaveScenario={handleSaveScenario}
                  onReset={handleReset}
                />
              </div>
              <div className="lg:col-span-7 flex flex-col">
                <ResultSummaryPanel input={input} result={result} />
              </div>
            </div>

            {/* Monthly Schedule Ledger & Bar Chart */}
            <MonthlyScheduleSection input={input} schedule={result.schedule} />

            {/* Saved Scenarios Comparison Table */}
            <SavedComparisonsSection
              scenarios={scenarios}
              onLoadScenario={handleLoadScenario}
              onDeleteScenario={handleDeleteScenario}
              onClearAll={handleClearAll}
              onSaveCurrent={handleSaveScenario}
            />
          </>
        ) : (
          <EarlyTerminationCalculator depositSourceInput={input} />
        )}

        {/* Transparent Calculation Reference */}
        <section
          id="formula-guide"
          aria-label="계산 기준 및 세율 안내"
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-3">이자 및 세금 계산 기준 안내</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">정기예금 계산 방식</p>
              <p>
                단리 기준 세전 이자는 <span className="font-mono-num text-slate-800">예치금액 × 연이율 × (개월수 ÷ 12)</span>로 계산되며, 월복리는 매월 이자가 원금에 합산됩니다.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">정기적금 계산 방식</p>
              <p>
                매월 정액 적립 시 단리 세전 이자는{' '}
                <span className="font-mono-num text-slate-800">
                  월입금액 × 연이율 × 개월수 × (개월수+1) ÷ 24
                </span>
                로 각 회차별 예치 기간을 반영합니다.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">일반과세 15.4% 공제</p>
              <p>
                발생한 세전 이자에 이자소득세 14%와 지방소득세 1.4%를 합산한 총 15.4%의 세금이 원천징수되며, 원단위 미만은 절사됩니다.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>은행 이자 계산기 · 일반과세 15.4% 기준 시뮬레이션</span>
          <span>실제 금융기관 상품 가입 시 약관 및 일할 계산 방식에 따라 원 단위 차이가 발생할 수 있습니다.</span>
        </div>
      </footer>
    </div>
  );
}
