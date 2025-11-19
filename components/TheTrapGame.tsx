
import React, { useState, useMemo, useEffect } from 'react';
import { CurrencyConfig } from '../types';
import { calculateTermFromPayment, calculateMortgage, formatCurrency } from '../services/mortgageService';
import { TrendingUp, AlertTriangle, Smile, Frown, Meh, Angry, Clock, RefreshCcw, Banknote, Percent, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface TheTrapGameProps {
  initialMonthlyBudget: number;
  rate: number;
  currency: CurrencyConfig;
  onBack: () => void;
}

export const TheTrapGame: React.FC<TheTrapGameProps> = ({
  initialMonthlyBudget,
  rate,
  currency,
  onBack
}) => {
  // --- Constants & Research Data ---
  const AVERAGE_UK_LOAN = 250000; // £249,943
  
  // --- State ---
  const [loanAmount, setLoanAmount] = useState<number>(AVERAGE_UK_LOAN);
  const [currentRate, setCurrentRate] = useState<number>(rate);
  const [userMonthlyPayment, setUserMonthlyPayment] = useState<number>(initialMonthlyBudget);
  const [scrubberMonth, setScrubberMonth] = useState<number>(1);
  const [showMath, setShowMath] = useState(false);

  // --- Calculations ---

  const monthlyRate = currentRate / 100 / 12;
  const standardTermMonths = 25 * 12;
  
  // Calculate Standard 25y Payment based on CURRENT loan and CURRENT rate
  const standard25YearPayment = useMemo(() => {
      if (monthlyRate === 0) return loanAmount / standardTermMonths;
      return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -standardTermMonths));
  }, [loanAmount, monthlyRate, standardTermMonths]);

  // Calculate Minimum Payment (Interest Only + Tiny buffer)
  const minPayment = loanAmount * monthlyRate * 1.01; 

  // Calculate actual term based on user payment
  const termYears = useMemo(() => 
    calculateTermFromPayment(loanAmount, currentRate, userMonthlyPayment),
    [loanAmount, currentRate, userMonthlyPayment]
  );

  const result = useMemo(() => calculateMortgage({
    amount: loanAmount,
    rate: currentRate,
    termYears: Math.min(termYears, 100), 
    monthlyOverpayment: 0 
  }), [loanAmount, currentRate, termYears]);

  // --- Effects ---

  // If loan amount changes, snap payment to 25y standard defaults
  // We use a ref or flag to prevent this loop if we wanted decoupling, 
  // but for this game, keeping them linked initially is helpful.
  const handleLoanChange = (newLoan: number) => {
    setLoanAmount(newLoan);
    // Re-calculate standard payment for new loan amount
    const newStdPayment = (newLoan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -standardTermMonths));
    setUserMonthlyPayment(newStdPayment);
  };

  // Ensure scrubber stays in bounds
  useEffect(() => {
    if (scrubberMonth > result.monthsToPayOff) {
        setScrubberMonth(1);
    }
  }, [result.monthsToPayOff]);

  const currentMonthData = result.schedule[Math.min(scrubberMonth - 1, result.schedule.length - 1)] || {
      interestPayment: 0,
      principalPayment: 0,
      equityBuilt: 0,
      remainingBalance: 0
  };

  // --- Stats & Moods ---
  const wastePercentage = result.totalCost > 0 ? (result.totalInterest / result.totalCost) * 100 : 0;
  
  let mood = 'happy';
  if (termYears > 35 || wastePercentage > 55) mood = 'rage';
  else if (termYears > 26 || wastePercentage > 45) mood = 'sad';
  else if (termYears > 22 || wastePercentage > 30) mood = 'meh';

  const isTrap = mood === 'rage';
  const maxTotalCost = 1000000; // Visual scaling cap

  const resetToAverage = () => {
      setLoanAmount(AVERAGE_UK_LOAN);
      setCurrentRate(4.5);
      const r = 4.5 / 100 / 12;
      const p = (AVERAGE_UK_LOAN * r) / (1 - Math.pow(1 + r, -standardTermMonths));
      setUserMonthlyPayment(p);
  };

  const interestRatio = currentMonthData.interestPayment / userMonthlyPayment;
  const principalRatio = currentMonthData.principalPayment / userMonthlyPayment;

  // --- Helpers ---
  const getTermColor = (years: number) => {
      if (years > 35) return 'text-red-500';
      if (years > 25) return 'text-amber-400';
      return 'text-emerald-400';
  };

  return (
    <div className="animate-fade-in-up w-full max-w-5xl mx-auto pb-20">
        
        {/* Header / Scoreboard */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
            <div>
                <button onClick={onBack} className="text-slate-500 text-sm hover:text-white mb-2 transition-colors">
                    ← Back to Start
                </button>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    {mood === 'happy' ? <span className="text-emerald-400">The Freedom Zone</span> : 
                     mood === 'rage' ? <span className="text-red-500">The Debt Trap</span> : 
                     <span className="text-amber-400">The Squeeze</span>}
                </h2>
                <p className="text-slate-400 max-w-md mt-2 text-sm">
                    Adjust sliders to see how loan size, rate, and payments affect your life.
                </p>
            </div>
            
            <div className="flex gap-4 items-stretch">
                 {/* Interactive Rate Display */}
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700 backdrop-blur-sm flex flex-col justify-center min-w-[100px]">
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                        Rate <Percent size={10} />
                    </label>
                    <input 
                        type="number" 
                        step="0.1"
                        value={currentRate}
                        onChange={(e) => setCurrentRate(Number(e.target.value))}
                        className="bg-transparent text-2xl font-bold text-white w-full outline-none border-b border-slate-600 focus:border-indigo-500 transition-colors text-right"
                    />
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 backdrop-blur-sm text-right min-w-[140px]">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Years Until Debt-Free</div>
                    <div className={`text-3xl font-mono font-bold ${isTrap ? 'text-red-500' : mood === 'happy' ? 'text-emerald-400' : 'text-white'}`}>
                        {termYears > 99 ? '> 100' : termYears.toFixed(1)}
                    </div>
                </div>
                
                <button 
                    onClick={resetToAverage}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 p-4 rounded-2xl flex flex-col items-center justify-center transition-all min-w-[70px]"
                    title="Reset to UK Average (£250k @ 4.5%)"
                >
                    <RefreshCcw size={18} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">Reset</span>
                </button>
            </div>
        </div>

        {/* The Visualizer (Two Towers) */}
        <div className="h-[500px] bg-slate-900/50 rounded-3xl border border-slate-800 relative flex items-end justify-center gap-8 md:gap-20 p-8 overflow-hidden mb-8 shadow-2xl">
            
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
            
            {/* Tower 1: The House (Principal) */}
            <div className="relative w-32 md:w-48 group">
                <div className="text-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 left-0 w-full">
                    <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Loan Amount
                    </span>
                </div>
                <div 
                    className="w-full bg-emerald-500 rounded-t-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 relative overflow-hidden hover:brightness-110"
                    style={{ height: `${Math.min((loanAmount / maxTotalCost) * 100 * 2.5, 90)}%`, minHeight: '20px' }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[size:20px_20px]"></div>
                    
                    <div className="absolute bottom-4 w-full text-center text-emerald-950 font-bold text-lg">
                        {formatCurrency(loanAmount, currency)}
                    </div>
                </div>
                <div className="text-center mt-4 text-emerald-400 font-bold uppercase tracking-widest text-sm">
                    You Borrow
                </div>
            </div>

            {/* Tower 2: The Interest (Bank's Cut) */}
            <div className="relative w-32 md:w-48 group">
                 <div className="text-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 left-0 w-full">
                    <span className="bg-slate-800 text-red-400 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Pure Interest
                    </span>
                </div>
                <div 
                    className={`w-full rounded-t-xl transition-all duration-300 relative overflow-hidden hover:brightness-110 ${isTrap ? 'bg-red-600 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse-slow' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'}`}
                    style={{ height: `${Math.min((result.totalInterest / maxTotalCost) * 100 * 2.5, 90)}%`, minHeight: '20px' }}
                >
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                     
                     {isTrap && (
                        <div className="absolute top-4 w-full flex justify-center text-red-950 animate-bounce">
                            <AlertTriangle size={24} strokeWidth={3} />
                        </div>
                     )}

                     <div className={`absolute bottom-4 w-full text-center font-bold text-lg ${isTrap ? 'text-red-950' : 'text-amber-950'}`}>
                        {formatCurrency(result.totalInterest, currency)}
                    </div>
                </div>
                <div className={`text-center mt-4 font-bold uppercase tracking-widest text-sm ${isTrap ? 'text-red-500' : 'text-amber-500'}`}>
                    Interest
                </div>
            </div>

            {/* Central Reality Check Badge */}
            <div className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 ${isTrap ? 'animate-shake' : 'animate-float'}`}>
                <div className={`
                    relative px-8 py-6 rounded-3xl border backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center gap-2 min-w-[260px] transition-all duration-300
                    ${mood === 'rage' ? 'bg-red-950/90 border-red-500 animate-angry-pulse' : 
                      mood === 'sad' ? 'bg-slate-900/90 border-orange-500' : 
                      mood === 'meh' ? 'bg-slate-900/90 border-yellow-500' : 
                      'bg-emerald-900/90 border-emerald-500'}
                `}>
                    <div className={`
                        w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-inner transition-all duration-300
                        ${mood === 'rage' ? 'bg-red-500 text-red-950' : 
                          mood === 'sad' ? 'bg-orange-500 text-orange-950' : 
                          mood === 'meh' ? 'bg-yellow-400 text-yellow-950' : 
                          'bg-emerald-400 text-emerald-950'}
                    `}>
                        {mood === 'rage' && <Angry size={40} strokeWidth={2.5} />}
                        {mood === 'sad' && <Frown size={40} strokeWidth={2.5} />}
                        {mood === 'meh' && <Meh size={40} strokeWidth={2.5} />}
                        {mood === 'happy' && <Smile size={40} strokeWidth={2.5} />}
                    </div>

                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        You Actually Pay Back
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-white">
                        {formatCurrency(result.totalCost, currency)}
                    </div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-full mt-1 ${
                        mood === 'rage' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700/50 text-slate-300'
                    }`}>
                        {wastePercentage.toFixed(0)}% is wasted Interest
                    </div>
                </div>
            </div>
        </div>

        {/* Control Center */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Slider 1: Loan Amount */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="flex justify-between mb-4">
                    <label className="text-slate-300 font-bold flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-400" />
                        Amount You Borrow
                    </label>
                    <span className="text-white font-mono font-bold">{formatCurrency(loanAmount, currency)}</span>
                </div>
                
                <input 
                    type="range"
                    min={50000}
                    max={800000}
                    step={5000}
                    value={loanAmount}
                    onChange={(e) => handleLoanChange(Number(e.target.value))}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-indigo-500 mb-2"
                />
                <div className="flex justify-between text-xs text-slate-500">
                    <span>£50k</span>
                    <span className="text-indigo-400 font-bold">UK Avg: £250k</span>
                    <span>£800k</span>
                </div>
            </div>

            {/* Slider 2: Monthly Repayment */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="flex justify-between mb-4">
                    <label className="text-slate-300 font-bold flex items-center gap-2">
                        <Banknote size={18} className="text-emerald-400" />
                        Your Monthly Repayment
                    </label>
                    <span className="text-white font-mono font-bold">{formatCurrency(userMonthlyPayment, currency)}</span>
                </div>
                
                <input 
                    type="range"
                    min={minPayment}
                    max={standard25YearPayment * 2.5}
                    step={10}
                    value={userMonthlyPayment}
                    onChange={(e) => setUserMonthlyPayment(Number(e.target.value))}
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer mb-2 ${termYears > 35 ? 'bg-red-900/50 accent-red-500' : 'bg-slate-700 accent-emerald-500'}`}
                />
                
                {/* Dynamic Term Feedback */}
                <div className="flex justify-between items-center text-xs mt-2">
                     <span className={`font-bold ${getTermColor(termYears)}`}>
                        {termYears > 40 ? '⚠️ Critical: 40+ Years (The Trap)' : 
                         termYears > 30 ? '⚠️ Warning: Very Long Term' : 
                         '✅ Standard Term'}
                     </span>
                     <span className="text-slate-400">
                        Payoff in: <strong className={getTermColor(termYears)}>{termYears > 99 ? '>100' : termYears.toFixed(1)} Years</strong>
                     </span>
                </div>
            </div>
        </div>

        {/* Monthly Reality Check */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                    <Clock size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Monthly Reality Check</h3>
                    <p className="text-slate-400 text-sm">See where your {formatCurrency(userMonthlyPayment, currency)} actually goes.</p>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                    <span>Month 1</span>
                    <span className="text-white">Paying Month {scrubberMonth} / {result.monthsToPayOff}</span>
                    <span>End</span>
                </div>
                <input 
                    type="range"
                    min={1}
                    max={result.monthsToPayOff}
                    step={1}
                    value={scrubberMonth}
                    onChange={(e) => setScrubberMonth(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            <div className="relative h-24 w-full rounded-2xl overflow-hidden flex bg-slate-950 border border-slate-700">
                <div 
                    className="bg-red-500 flex items-center justify-center relative overflow-hidden group hover:bg-red-400 transition-all duration-300"
                    style={{ width: `${interestRatio * 100}%` }}
                >
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                     <div className="flex flex-col items-center z-10">
                        <span className="text-white font-bold text-sm md:text-lg drop-shadow-md">Bank</span>
                        {interestRatio > 0.1 && (
                            <span className="text-white/90 text-xs font-mono">{formatCurrency(currentMonthData.interestPayment, currency)}</span>
                        )}
                     </div>
                </div>

                <div 
                    className="bg-emerald-500 flex items-center justify-center relative overflow-hidden group hover:bg-emerald-400 transition-all duration-300"
                    style={{ width: `${principalRatio * 100}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[size:20px_20px]"></div>
                    <div className="flex flex-col items-center z-10">
                        <span className="text-emerald-950 font-bold text-sm md:text-lg">You</span>
                         {principalRatio > 0.1 && (
                            <span className="text-emerald-900 text-xs font-mono">{formatCurrency(currentMonthData.principalPayment, currency)}</span>
                        )}
                    </div>
                </div>
            </div>

             <div className="mt-6 text-center">
                {interestRatio > 0.7 ? (
                    <p className="text-red-400 font-medium animate-pulse">
                        🔥 Ouch! Early on, the bank takes nearly everything.
                    </p>
                ) : interestRatio > 0.4 ? (
                    <p className="text-amber-400 font-medium">
                        ⚠️ You're still working mostly for the bank.
                    </p>
                ) : (
                    <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                        <Smile size={20} /> Now you are building real equity.
                    </p>
                )}
            </div>
        </div>

        {/* Transparency / Math Section */}
        <div className="max-w-2xl mx-auto mt-12">
            <button 
                onClick={() => setShowMath(!showMath)}
                className="flex items-center justify-center gap-2 text-slate-500 hover:text-white w-full text-sm font-medium transition-colors"
            >
                <BookOpen size={16} />
                {showMath ? "Hide Calculations" : "See the Math behind the tool"}
                {showMath ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showMath && (
                <div className="mt-4 bg-slate-900/80 p-6 rounded-xl border border-slate-800 animate-fade-in-up text-slate-300 text-sm">
                    <h4 className="text-white font-bold mb-3">Amortization Calculation</h4>
                    <p className="mb-3">
                        This tool uses the standard mortgage amortization formula to determine your monthly payment breakdown:
                    </p>
                    <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs md:text-sm mb-4 border border-slate-800 text-indigo-300 overflow-x-auto">
                        M = P [ r(1+r)^n ] / [ (1+r)^n – 1 ]
                    </div>
                    <ul className="space-y-2 list-disc pl-5">
                        <li><strong>M</strong> = Total Monthly Payment</li>
                        <li><strong>P</strong> = Principal Loan Amount (£{loanAmount})</li>
                        <li><strong>r</strong> = Monthly Interest Rate ({currentRate}% / 12)</li>
                        <li><strong>n</strong> = Number of Payments (Months)</li>
                    </ul>
                    <p className="mt-4 text-xs text-slate-500">
                        *Calculations assume a fixed interest rate over the entire term. In reality, rates may fluctuate.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};
