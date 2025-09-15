import React, { useState, useEffect } from 'react';
import { ClockIcon } from './icons';
import { BET_OPTIONS, CURRENCY_SYMBOL, MIN_CUSTOM_BET, MAX_CUSTOM_BET } from '../constants';

interface PlayerInputFormProps {
  onPlaceBet: (betTime: string, betAmount: number) => void;
  isDisabled: boolean;
  userBalance: number;
}

const PlayerInputForm: React.FC<PlayerInputFormProps> = ({ onPlaceBet, isDisabled, userBalance }) => {
  const [betTime, setBetTime] = useState('12:00');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(BET_OPTIONS[1]);
  const [customBet, setCustomBet] = useState<string>(BET_OPTIONS[1].toString());

  const finalBetAmount = Number(customBet) || 0;
  const canAfford = userBalance >= finalBetAmount;
  const isValidCustomBet = finalBetAmount >= MIN_CUSTOM_BET && finalBetAmount <= MAX_CUSTOM_BET;

  useEffect(() => {
    // Sync preset selection with custom input
    if (BET_OPTIONS.includes(Number(customBet))) {
      setSelectedPreset(Number(customBet));
    } else {
      setSelectedPreset(null);
    }
  }, [customBet]);

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount);
    setCustomBet(amount.toString());
  };

  const handleCustomBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomBet(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (betTime && canAfford && isValidCustomBet && !isDisabled) {
      onPlaceBet(betTime, finalBetAmount);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-cyan-500/20">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">Faça sua Aposta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="time"
            value={betTime}
            onChange={(e) => setBetTime(e.target.value)}
            disabled={isDisabled}
            className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300 appearance-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 text-center">Valor da Aposta</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {BET_OPTIONS.map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => handlePresetClick(amount)}
                disabled={isDisabled}
                className={`py-2 px-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                  selectedPreset === amount
                    ? 'bg-cyan-500 text-gray-900 ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                } disabled:bg-gray-600/50 disabled:text-gray-400/50`}
              >
                {amount} {CURRENCY_SYMBOL}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={customBet}
            onChange={handleCustomBetChange}
            disabled={isDisabled}
            placeholder="Ou valor customizado"
            min={MIN_CUSTOM_BET}
            max={MAX_CUSTOM_BET}
            className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-4 text-center focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300"
          />
        </div>
        <button
          type="submit"
          disabled={isDisabled || !canAfford || !isValidCustomBet}
          className="w-full bg-cyan-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {isDisabled ? "Aposta Feita" : `Apostar (${finalBetAmount} ${CURRENCY_SYMBOL})`}
        </button>
         {!isDisabled && !canAfford && (
          <p className="text-center text-red-400 text-sm mt-2">Saldo insuficiente para esta aposta.</p>
        )}
         {!isDisabled && finalBetAmount > 0 && !isValidCustomBet && (
          <p className="text-center text-red-400 text-sm mt-2">A aposta deve ser entre {MIN_CUSTOM_BET} e {MAX_CUSTOM_BET} {CURRENCY_SYMBOL}.</p>
        )}
      </form>
    </div>
  );
};

export default PlayerInputForm;
