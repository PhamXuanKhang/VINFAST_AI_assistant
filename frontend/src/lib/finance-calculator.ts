// Finance Calculation Engine — No battery rental (VinFast discontinued rental)

import { type CarModel, loanPackages, formatVND } from './vinfast-data';

const EVN_RATES = {
  b1: { maxKwh: 50, price: 1678 },
  b2: { maxKwh: 100, price: 1734 },
  b3: { maxKwh: 200, price: 2014 },
  b4: { maxKwh: 300, price: 2536 },
  b5: { maxKwh: 400, price: 2834 },
  b6: { maxKwh: Infinity, price: 2927 },
};

export interface FinanceResult {
  carId: string;
  carName: string;
  paymentType: 'full' | 'loan';
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  monthlyElectricity: number;
  monthlyInsurance: number;
  totalMonthlyCost: number;
  interestRate: number;
  loanTerm: number;
  bankName: string;
  totalLoanCost: number;
  totalInterest: number;
  electricityPerKm: number;
  affordability: 'affordable' | 'tight' | 'overbudget';
  affordabilityRatio: number;
}

export function calculateElectricityCost(
  monthlyKm: number,
  batteryCapacity: number,
  range: number
): { monthly: number; perKm: number } {
  const kwhPerKm = batteryCapacity / range;
  const monthlyKwh = monthlyKm * kwhPerKm;
  const existingMonthlyKwh = 150;
  const totalKwh = existingMonthlyKwh + monthlyKwh;

  const tiers = [
    { max: 50, price: EVN_RATES.b1.price },
    { max: 100, price: EVN_RATES.b2.price },
    { max: 200, price: EVN_RATES.b3.price },
    { max: 300, price: EVN_RATES.b4.price },
    { max: 400, price: EVN_RATES.b5.price },
    { max: Infinity, price: EVN_RATES.b6.price },
  ];

  let prevMax = 0;
  let evCostOnly = 0;

  for (const t of tiers) {
    const tierKwh = Math.min(t.max, totalKwh) - prevMax;
    if (tierKwh <= 0) break;
    if (prevMax >= existingMonthlyKwh) {
      evCostOnly += tierKwh * t.price;
    } else if (t.max > existingMonthlyKwh) {
      const evKwhInTier = Math.min(monthlyKwh, t.max - existingMonthlyKwh);
      evCostOnly += evKwhInTier * t.price;
    }
    prevMax = t.max;
    if (prevMax >= totalKwh) break;
  }

  return { monthly: Math.round(evCostOnly), perKm: Math.round(evCostOnly / monthlyKm) };
}

export function calculateLoan(
  car: CarModel,
  downPaymentPercent: number,
  loanTermMonths: number,
  monthlyKm: number,
  monthlyIncome: number,
  loanPackageIndex: number = 0
): FinanceResult {
  const pkg = loanPackages[loanPackageIndex] || loanPackages[0];
  const downPayment = Math.round(car.priceOnRoad * (downPaymentPercent / 100));
  const loanAmount = car.priceOnRoad - downPayment;
  const monthlyRate = pkg.interestRate / 100 / 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
    (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

  const electricity = calculateElectricityCost(monthlyKm, car.batteryCapacity, car.range);
  const monthlyInsurance = Math.round(car.priceOnRoad * 0.015 / 12); // ~1.5%/năm

  const totalMonthlyCost = Math.round(monthlyPayment + electricity.monthly + monthlyInsurance);
  const totalLoanCost = Math.round(monthlyPayment * loanTermMonths);
  const totalInterest = totalLoanCost - loanAmount;
  const affordabilityRatio = monthlyIncome > 0 ? totalMonthlyCost / monthlyIncome : 0;

  let affordability: FinanceResult['affordability'];
  if (affordabilityRatio <= 0.4) affordability = 'affordable';
  else if (affordabilityRatio <= 0.5) affordability = 'tight';
  else affordability = 'overbudget';

  return {
    carId: car.id,
    carName: car.fullName,
    paymentType: 'loan',
    downPayment,
    loanAmount,
    monthlyPayment: Math.round(monthlyPayment),
    monthlyElectricity: electricity.monthly,
    monthlyInsurance,
    totalMonthlyCost,
    interestRate: pkg.interestRate,
    loanTerm: loanTermMonths,
    bankName: pkg.bank,
    totalLoanCost,
    totalInterest,
    electricityPerKm: electricity.perKm,
    affordability,
    affordabilityRatio,
  };
}

export function calculateFullPayment(
  car: CarModel,
  monthlyKm: number,
  monthlyIncome: number
): FinanceResult {
  const electricity = calculateElectricityCost(monthlyKm, car.batteryCapacity, car.range);
  const monthlyInsurance = Math.round(car.priceOnRoad * 0.015 / 12);
  const totalMonthlyCost = Math.round(electricity.monthly + monthlyInsurance);
  const affordabilityRatio = monthlyIncome > 0 ? totalMonthlyCost / monthlyIncome : 0;

  let affordability: FinanceResult['affordability'];
  if (affordabilityRatio <= 0.3) affordability = 'affordable';
  else if (affordabilityRatio <= 0.4) affordability = 'tight';
  else affordability = 'overbudget';

  return {
    carId: car.id,
    carName: car.fullName,
    paymentType: 'full',
    downPayment: car.priceOnRoad,
    loanAmount: 0,
    monthlyPayment: 0,
    monthlyElectricity: electricity.monthly,
    monthlyInsurance,
    totalMonthlyCost,
    interestRate: 0,
    loanTerm: 0,
    bankName: '-',
    totalLoanCost: 0,
    totalInterest: 0,
    electricityPerKm: electricity.perKm,
    affordability,
    affordabilityRatio,
  };
}

export function findOptimalLoan(
  car: CarModel,
  monthlyKm: number,
  monthlyIncome: number,
  maxDownPayment: number,
  preferredMonthlyBudget?: number
): FinanceResult {
  const targetBudget = preferredMonthlyBudget || monthlyIncome * 0.4;
  const downPayments = [20, 25, 30, 35, 40, 50, 60, 70];
  const terms = [36, 48, 60, 72, 84, 96];

  let bestResult: FinanceResult | null = null;
  let bestScore = Infinity;

  for (const dp of downPayments) {
    for (const term of terms) {
      if ((dp / 100) * car.priceOnRoad > maxDownPayment * 1.5) continue;
      const result = calculateLoan(car, dp, term, monthlyKm, monthlyIncome);
      const score = Math.abs(result.totalMonthlyCost - targetBudget);
      if (score < bestScore && result.affordability !== 'overbudget') {
        bestScore = score;
        bestResult = result;
      }
    }
  }

  if (!bestResult) {
    bestResult = calculateLoan(car, 30, 84, monthlyKm, monthlyIncome);
  }
  return bestResult;
}
