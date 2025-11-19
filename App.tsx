
import React, { useState, useMemo } from 'react';
import { Region, CurrencyConfig } from './types';
import { TheTrapGame } from './components/TheTrapGame';
import { AlertTriangle, Banknote, Calculator, Info } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [region, setRegion] = useState<Region>(Region.UK);
  const [rate, setRate] = useState<number>(4.5);
  // Default to approx £1400 which covers the average £250k mortgage at 4.5% over 25 years
  const [monthlyBudget, setMonthlyBudget] = useState<number>(1400);
  const [gameStarted, setGameStarted] = useState(false);

  // --- Derived Config ---
  const currency: CurrencyConfig = useMemo(() => {
    switch (region) {
      case Region.UK: return { symbol: '£', code: 'GBP', locale: 'en-GB' };
      case Region.USA: return { symbol: '$', code: 'USD', locale: 'en-US' };
      case Region.EU: return { symbol: '€', code: 'EUR', locale: 'de-DE' };
    }
  }, [region]);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (monthlyBudget > 0) {
        setGameStarted(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-slate-200 pb-20 font-sans selection:bg-indigo-500/30">
      
      {/* --- Minimal Header --- */}
      <header className="border-b border-slate-800/50 bg-brand-dark/50 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-debt-red" />
            <h1 className="text-lg font-bold tracking-tight text-white">The Mortgage Trap</h1>
          </div>
          
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            {(Object.keys(Region) as Array<keyof typeof Region>).map((r) => (
              <button
                key={r}
                onClick={() => {
                    setRegion(Region[r]);
                    setGameStarted(false);
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  region === Region[r] 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {Region[r]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32">

        {!gameStarted ? (
            // --- Step 1: The Hook (Budget Input) ---
            <div className="max-w-lg mx-auto animate-fade-in-up">
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Beat the Bank.
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Banks want you to borrow as much as possible. <br/>
                        Find out where the deal turns toxic.
                    </p>
                </div>

                <div className="bg-brand-card border border-slate-700 rounded-3xl p-8 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                     {/* Decor */}
                     <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
                     
                     <form onSubmit={handleStartGame} className="relative z-10 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase mb-3">
                                Target Monthly Payment
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-bold group-focus-within:text-indigo-400 transition-colors">
                                    {currency.symbol}
                                </span>
                                <input
                                    type="number"
                                    value={monthlyBudget || ''}
                                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                                    placeholder="e.g. 1400"
                                    className="w-full bg-slate-950 border border-slate-600 rounded-xl py-5 pl-10 pr-4 text-3xl font-bold text-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                                    required
                                    min={100}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 pl-1">
                                Default is based on the UK average mortgage cost (~£250k).
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                Interest Rate (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <Calculator size={20} />
                            Run Simulation
                        </button>
                     </form>

                     {/* Research Context */}
                     <div className="mt-8 pt-6 border-t border-slate-800 text-sm text-slate-400">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                            <p>
                                <span className="font-bold text-indigo-300">Did you know?</span> The average UK first-time buyer is <strong className="text-white">33 years old</strong> and takes out a mortgage of <strong className="text-white">£249,943</strong>.
                            </p>
                        </div>
                     </div>
                </div>
            </div>
        ) : (
            // --- Step 2: The Game ---
            <TheTrapGame 
                initialMonthlyBudget={monthlyBudget}
                rate={rate}
                currency={currency}
                onBack={() => setGameStarted(false)}
            />
        )}

      </main>
    </div>
  );
};

export default App;
