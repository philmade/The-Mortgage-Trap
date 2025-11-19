import { MonthlyData, MortgageResult, SimulationParams } from '../types';

export const calculateMortgage = (params: SimulationParams): MortgageResult => {
  const { amount, rate, termYears, monthlyOverpayment } = params;
  
  if (amount <= 0 || rate <= 0 || termYears <= 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      totalCost: 0,
      totalPrincipal: 0,
      yearsToPayOff: 0,
      monthsToPayOff: 0,
      schedule: [],
    };
  }

  const monthlyRate = rate / 100 / 12;
  const totalMonths = termYears * 12;
  
  const standardPayment = 
    (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  let balance = amount;
  let totalInterest = 0;
  let equity = 0;
  const schedule: MonthlyData[] = [];
  let currentMonth = 0;

  while (balance > 0.01 && currentMonth < totalMonths * 1.5) {
    currentMonth++;
    const interestPayment = balance * monthlyRate;
    let principalPayment = standardPayment - interestPayment + monthlyOverpayment;

    if (principalPayment > balance) {
      principalPayment = balance;
    }

    balance -= principalPayment;
    totalInterest += interestPayment;
    equity += principalPayment;

    schedule.push({
      month: currentMonth,
      year: Math.ceil(currentMonth / 12),
      principalPayment,
      interestPayment,
      totalInterestPaidToDate: totalInterest,
      remainingBalance: Math.max(0, balance),
      equityBuilt: equity
    });

    if (balance <= 0.01) break;
  }

  return {
    monthlyPayment: standardPayment,
    totalInterest,
    totalCost: totalInterest + amount,
    totalPrincipal: amount,
    yearsToPayOff: currentMonth / 12,
    monthsToPayOff: currentMonth,
    schedule
  };
};

/**
 * Calculates the number of years required to pay off a loan given a fixed monthly payment.
 */
export const calculateTermFromPayment = (amount: number, rate: number, monthlyPayment: number): number => {
  const monthlyRate = rate / 100 / 12;
  
  // If payment is less than interest, it never pays off
  if (monthlyPayment <= amount * monthlyRate) {
    return 999; // Infinite/Impossible
  }

  // Formula: n = ln(M / (M - P*r)) / ln(1+r)
  const numerator = Math.log(monthlyPayment / (monthlyPayment - amount * monthlyRate));
  const denominator = Math.log(1 + monthlyRate);
  const months = numerator / denominator;
  
  return months / 12;
};

/**
 * Calculates the maximum loan amount possible for a given monthly budget and max term (e.g., 35 years).
 */
export const calculateMaxLoanFromBudget = (budget: number, rate: number, maxYears: number = 40): number => {
    const monthlyRate = rate / 100 / 12;
    const totalMonths = maxYears * 12;
    
    // P = (M * ((1+r)^n - 1)) / (r * (1+r)^n)
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const maxLoan = (budget * (factor - 1)) / (monthlyRate * factor);
    
    return Math.floor(maxLoan / 1000) * 1000;
};

export const formatCurrency = (value: number, currency: { locale: string, symbol: string }) => {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.symbol === '£' ? 'GBP' : currency.symbol === '€' ? 'EUR' : 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};
