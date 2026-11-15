export type ProductType = 'deposit' | 'savings';
export type InterestMethod = 'simple' | 'compound';

export interface CalculationInput {
  productType: ProductType;
  amount: number; // 예금: 예치금액, 적금: 매달 입금액
  months: number; // 개월수
  annualRate: number; // 연 이율 (%)
  interestMethod: InterestMethod; // 단리 vs 월복리
}

export interface MonthlyScheduleRow {
  month: number;
  cumulativePrincipal: number;
  monthlyGrossInterest: number;
  cumulativeGrossInterest: number;
  cumulativeTax: number;
  cumulativeNetInterest: number;
  grossTotal: number;
  netTotal: number;
}

export interface CalculationResult {
  principal: number; // 총 원금
  grossInterest: number; // 세전 이자
  grossMaturityAmount: number; // 만기 예상 금액 (세전)
  taxAmount: number; // 세금 합계 (15.4%)
  incomeTax: number; // 소득세 (14%)
  localTax: number; // 지방소득세 (1.4%)
  netInterest: number; // 세후 이자
  netMaturityAmount: number; // 실제 받을 금액 (세후)
  effectiveReturnRate: number; // 원금 대비 세후 수익률 (%)
  schedule: MonthlyScheduleRow[];
}

export interface SavedScenario extends CalculationInput {
  id: string;
  label: string;
  result: CalculationResult;
  createdAt: number;
}

export const TAX_RATE = 0.154;
export const INCOME_TAX_RATE = 0.14;

export function calculateInterest(input: CalculationInput): CalculationResult {
  const safeAmount = Math.max(0, Math.floor(Number.isFinite(input.amount) ? input.amount : 0));
  const safeMonths = Math.max(1, Math.min(600, Math.floor(Number.isFinite(input.months) ? input.months : 1)));
  const safeRate = Math.max(0, Math.min(100, Number.isFinite(input.annualRate) ? input.annualRate : 0));

  const annualDecimal = safeRate / 100;
  const monthlyDecimal = annualDecimal / 12;

  const schedule: MonthlyScheduleRow[] = [];
  let prevCumGrossInterest = 0;

  for (let m = 1; m <= safeMonths; m++) {
    let cumPrincipal = 0;
    let cumGrossInterest = 0;

    if (input.productType === 'deposit') {
      cumPrincipal = safeAmount;
      if (input.interestMethod === 'simple') {
        cumGrossInterest = Math.floor(safeAmount * annualDecimal * (m / 12));
      } else {
        cumGrossInterest = Math.floor(safeAmount * (Math.pow(1 + monthlyDecimal, m) - 1));
      }
    } else {
      cumPrincipal = safeAmount * m;
      if (input.interestMethod === 'simple') {
        cumGrossInterest = Math.floor(safeAmount * annualDecimal * ((m * (m + 1)) / 24));
      } else {
        let compoundedTotal = 0;
        for (let k = 1; k <= m; k++) {
          compoundedTotal += safeAmount * Math.pow(1 + monthlyDecimal, k);
        }
        cumGrossInterest = Math.floor(compoundedTotal - cumPrincipal);
      }
    }

    const monthlyGrossInterest = Math.max(0, cumGrossInterest - prevCumGrossInterest);
    prevCumGrossInterest = cumGrossInterest;

    const cumTax = Math.floor(cumGrossInterest * TAX_RATE);
    const cumNetInterest = cumGrossInterest - cumTax;

    schedule.push({
      month: m,
      cumulativePrincipal: cumPrincipal,
      monthlyGrossInterest,
      cumulativeGrossInterest: cumGrossInterest,
      cumulativeTax: cumTax,
      cumulativeNetInterest: cumNetInterest,
      grossTotal: cumPrincipal + cumGrossInterest,
      netTotal: cumPrincipal + cumNetInterest,
    });
  }

  const finalRow = schedule[schedule.length - 1];
  const principal = finalRow.cumulativePrincipal;
  const grossInterest = finalRow.cumulativeGrossInterest;
  const grossMaturityAmount = principal + grossInterest;

  const taxAmount = Math.floor(grossInterest * TAX_RATE);
  const incomeTax = Math.floor(grossInterest * INCOME_TAX_RATE);
  const localTax = Math.max(0, taxAmount - incomeTax);

  const netInterest = grossInterest - taxAmount;
  const netMaturityAmount = principal + netInterest;
  const effectiveReturnRate = principal > 0 ? (netInterest / principal) * 100 : 0;

  return {
    principal,
    grossInterest,
    grossMaturityAmount,
    taxAmount,
    incomeTax,
    localTax,
    netInterest,
    netMaturityAmount,
    effectiveReturnRate,
    schedule,
  };
}

export function formatKRW(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function formatNumberWithCommas(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return Math.floor(value).toLocaleString('ko-KR');
}

export function formatKoreanUnit(value: number): string {
  const num = Math.floor(Math.abs(value));
  if (!Number.isFinite(num) || num <= 0) return '0원';

  const eok = Math.floor(num / 100_000_000);
  const man = Math.floor((num % 100_000_000) / 10_000);
  const rest = num % 10_000;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`);
  if (rest > 0) parts.push(`${rest.toLocaleString('ko-KR')}`);

  return `${value < 0 ? '-' : ''}${parts.join(' ')}원`;
}

export interface EarlyTerminationInput {
  principal: number; // 예치금액
  totalMonths: number; // 기존 총 약정 개월수
  elapsedMonths: number; // 현재 경과 개월수
  previousRate: number; // 이전(기존) 연 이율 (%)
  earlyPenaltyRate: number; // 중도해지 적용 연 이율 (%)
  currentRate: number; // 현재(새 상품) 연 이율 (%)
  reinvestInterest: boolean; // 중도해지 세후 이자 포함 재예치 여부
  interestMethod: InterestMethod; // 단리 vs 월복리
}

export interface EarlyTerminationResult {
  remainingMonths: number;
  rateSpread: number; // currentRate - previousRate (%p)
  keep: {
    grossInterest: number;
    taxAmount: number;
    netInterest: number;
    netMaturityAmount: number;
  };
  earlyExit: {
    grossInterest: number;
    taxAmount: number;
    netInterest: number;
    payoutAtExit: number;
    contractedAtElapsedGross: number;
    penaltyLossGross: number;
  };
  reinvest: {
    principal: number;
    grossInterest: number;
    taxAmount: number;
    netInterest: number;
  };
  switchTotal: {
    grossInterest: number;
    taxAmount: number;
    netInterest: number;
    netMaturityAmount: number;
  };
  diff: {
    grossInterestDiff: number; // switch - keep
    taxDiff: number;
    netInterestDiff: number; // 실제 최종 차액 (세후)
    isSwitchBetter: boolean;
    breakEvenRate: number; // 손익분기 연 이율 (%)
  };
}

function calcDepositTermInterest(
  principal: number,
  annualRatePct: number,
  months: number,
  method: InterestMethod
): number {
  if (principal <= 0 || months <= 0 || annualRatePct <= 0) return 0;
  const annualDecimal = annualRatePct / 100;
  if (method === 'simple') {
    return Math.floor(principal * annualDecimal * (months / 12));
  }
  const monthlyDecimal = annualDecimal / 12;
  return Math.floor(principal * (Math.pow(1 + monthlyDecimal, months) - 1));
}

export function calculateEarlyTermination(
  input: EarlyTerminationInput
): EarlyTerminationResult {
  const principal = Math.max(0, Math.floor(Number.isFinite(input.principal) ? input.principal : 0));
  const totalMonths = Math.max(2, Math.min(600, Math.floor(Number.isFinite(input.totalMonths) ? input.totalMonths : 12)));
  const elapsedMonths = Math.max(
    1,
    Math.min(totalMonths - 1, Math.floor(Number.isFinite(input.elapsedMonths) ? input.elapsedMonths : 1))
  );
  const remainingMonths = totalMonths - elapsedMonths;

  const previousRate = Math.max(0, Math.min(100, Number.isFinite(input.previousRate) ? input.previousRate : 0));
  const earlyPenaltyRate = Math.max(0, Math.min(100, Number.isFinite(input.earlyPenaltyRate) ? input.earlyPenaltyRate : 0));
  const currentRate = Math.max(0, Math.min(100, Number.isFinite(input.currentRate) ? input.currentRate : 0));

  // Scenario A: Keep existing deposit until maturity
  const keepGross = calcDepositTermInterest(principal, previousRate, totalMonths, input.interestMethod);
  const keepTax = Math.floor(keepGross * TAX_RATE);
  const keepNet = keepGross - keepTax;

  // Scenario B - Step 1: Early exit at elapsedMonths with earlyPenaltyRate
  const earlyGross = calcDepositTermInterest(principal, earlyPenaltyRate, elapsedMonths, 'simple');
  const earlyTax = Math.floor(earlyGross * TAX_RATE);
  const earlyNet = earlyGross - earlyTax;
  const payoutAtExit = principal + earlyNet;

  const contractedAtElapsedGross = calcDepositTermInterest(
    principal,
    previousRate,
    elapsedMonths,
    input.interestMethod
  );
  const penaltyLossGross = Math.max(0, contractedAtElapsedGross - earlyGross);

  // Scenario B - Step 2: Reinvest for remainingMonths at currentRate
  const reinvestPrincipal = input.reinvestInterest ? payoutAtExit : principal;
  const reinvestGross = calcDepositTermInterest(
    reinvestPrincipal,
    currentRate,
    remainingMonths,
    input.interestMethod
  );
  const reinvestTax = Math.floor(reinvestGross * TAX_RATE);
  const reinvestNet = reinvestGross - reinvestTax;

  const totalSwitchGross = earlyGross + reinvestGross;
  const totalSwitchTax = earlyTax + reinvestTax;
  const totalSwitchNet = earlyNet + reinvestNet;

  const grossInterestDiff = totalSwitchGross - keepGross;
  const taxDiff = totalSwitchTax - keepTax;
  const netInterestDiff = totalSwitchNet - keepNet;

  // Break-even annual rate needed over remainingMonths on reinvestPrincipal
  const neededNetInterest = Math.max(0, keepNet - earlyNet);
  const neededGrossInterest = neededNetInterest / (1 - TAX_RATE);
  let breakEvenRate = 0;
  if (reinvestPrincipal > 0 && remainingMonths > 0 && neededGrossInterest > 0) {
    if (input.interestMethod === 'simple') {
      breakEvenRate = (neededGrossInterest / (reinvestPrincipal * (remainingMonths / 12))) * 100;
    } else {
      const targetRatio = 1 + neededGrossInterest / reinvestPrincipal;
      const monthlyBreakEven = Math.pow(targetRatio, 1 / remainingMonths) - 1;
      breakEvenRate = monthlyBreakEven * 12 * 100;
    }
  }

  return {
    remainingMonths,
    rateSpread: currentRate - previousRate,
    keep: {
      grossInterest: keepGross,
      taxAmount: keepTax,
      netInterest: keepNet,
      netMaturityAmount: principal + keepNet,
    },
    earlyExit: {
      grossInterest: earlyGross,
      taxAmount: earlyTax,
      netInterest: earlyNet,
      payoutAtExit,
      contractedAtElapsedGross,
      penaltyLossGross,
    },
    reinvest: {
      principal: reinvestPrincipal,
      grossInterest: reinvestGross,
      taxAmount: reinvestTax,
      netInterest: reinvestNet,
    },
    switchTotal: {
      grossInterest: totalSwitchGross,
      taxAmount: totalSwitchTax,
      netInterest: totalSwitchNet,
      netMaturityAmount: principal + totalSwitchNet,
    },
    diff: {
      grossInterestDiff,
      taxDiff,
      netInterestDiff,
      isSwitchBetter: netInterestDiff > 0,
      breakEvenRate,
    },
  };
}

