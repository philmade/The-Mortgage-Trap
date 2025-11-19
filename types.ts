export enum Region {
  UK = 'UK',
  USA = 'USA',
  EU = 'EU',
}

export interface CurrencyConfig {
  symbol: string;
  code: string;
  locale: string;
}

export interface MonthlyData {
  month: number;
  year: number;
  principalPayment: number;
  interestPayment: number;
  totalInterestPaidToDate: number;
  remainingBalance: number;
  equityBuilt: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  totalPrincipal: number;
  yearsToPayOff: number;
  monthsToPayOff: number;
  schedule: MonthlyData[];
}

export interface SimulationParams {
  amount: number;
  rate: number;
  termYears: number;
  monthlyOverpayment: number;
}
