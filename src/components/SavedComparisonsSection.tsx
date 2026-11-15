import React from 'react';
import { Trash2, ArrowUpRight, BookmarkPlus } from 'lucide-react';
import { SavedScenario, formatKRW } from '../utils/interestCalculator';

interface SavedComparisonsSectionProps {
  scenarios: SavedScenario[];
  onLoadScenario: (scenario: SavedScenario) => void;
  onDeleteScenario: (id: string) => void;
  onClearAll: () => void;
  onSaveCurrent: () => void;
}

export const SavedComparisonsSection: React.FC<SavedComparisonsSectionProps> = ({
  scenarios,
  onLoadScenario,
  onDeleteScenario,
  onClearAll,
  onSaveCurrent,
}) => {
  return (
    <section
      id="comparisons"
      aria-label="저장된 예금 적금 조건 비교표"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">조건별 이자 비교표</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            예금과 적금 조건을 여러 개 저장하여 만기 예상 금액과 실제 수령액을 한눈에 비교하세요.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {scenarios.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              전체 비우기
            </button>
          )}
          <button
            type="button"
            onClick={onSaveCurrent}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>현재 조건 추가</span>
          </button>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className="py-10 px-6 border border-dashed border-slate-200 rounded-lg text-center space-y-3 bg-slate-50/40">
          <p className="text-sm font-medium text-slate-700">
            저장된 비교 조건이 아직 없습니다.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            상단 계산기에서 예금 또는 적금 조건을 입력한 뒤 비교 목록에 저장하면 세전 만기 금액과 15.4% 세금, 세후 실수령액을 나란히 비교할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={onSaveCurrent}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>현재 조건으로 첫 비교 추가</span>
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4 whitespace-nowrap">상품 구분</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">납입 조건</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">총 원금</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">만기 예상 금액(세전)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">세금(15.4%)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">실제 받을 금액(세후)</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {scenarios.map((item) => {
                  const isDeposit = item.productType === 'deposit';
                  return (
                    <tr key={item.id} className="h-[44px] hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {isDeposit ? '정기예금' : '정기적금'}
                        <span className="ml-1.5 text-xs font-normal text-slate-500">
                          ({item.interestMethod === 'simple' ? '단리' : '월복리'})
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono-num whitespace-nowrap">
                        {isDeposit ? formatKRW(item.amount) : `월 ${formatKRW(item.amount)}`} ·{' '}
                        {item.months}개월 · {item.annualRate.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-mono-num whitespace-nowrap">
                        {formatKRW(item.result.principal)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700 font-mono-num whitespace-nowrap">
                        {formatKRW(item.result.grossMaturityAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-amber-700 font-mono-num whitespace-nowrap">
                        -{formatKRW(item.result.taxAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-700 font-semibold font-mono-num whitespace-nowrap">
                        {formatKRW(item.result.netMaturityAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onLoadScenario(item)}
                            title="이 조건을 계산기에 불러오기"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            <span>불러오기</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteScenario(item.id)}
                            aria-label="비교 항목 삭제"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
