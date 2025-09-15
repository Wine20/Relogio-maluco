import React from 'react';
import { Winner } from '../types';
import { TrophyIcon } from './icons';
import { CURRENCY_SYMBOL } from '../constants';


interface ResultsModalProps {
  winners: Winner[];
  winningTime: string;
  jackpot: number;
  onPlayAgain: () => void;
  isHumanWinner: boolean;
}

const formatDifference = (diff: number): string => {
    if (diff === 0) return "Em cheio!";
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}min`;
    return `por ${result.trim()}`;
};

const ResultsModal: React.FC<ResultsModalProps> = ({ winners, winningTime, jackpot, onPlayAgain, isHumanWinner }) => {
  if (winners.length === 0) return null;

  const prizePerWinner = jackpot / winners.length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 border-2 ${isHumanWinner ? 'border-green-500' : 'border-red-500'} rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all animate-in fade-in zoom-in-95`}>
        <TrophyIcon className="w-16 h-16 mx-auto text-yellow-400" />
        <h2 className={`text-3xl font-bold ${isHumanWinner ? 'text-green-400' : 'text-red-400'} mt-4`}>
            {isHumanWinner ? "Você Venceu!" : "Não foi desta vez!"}
        </h2>
        <p className="text-gray-300 mt-2">O relógio parou em <span className="font-bold text-white font-mono text-lg">{winningTime}</span>.</p>

        <div className="my-6 bg-gray-900/50 p-4 rounded-lg">
          <p className="text-lg font-semibold text-gray-200 mb-2">Vencedor(es):</p>
          {winners.map(({ player, difference }) => (
            <div key={player.id} className="mb-2">
              <p className="text-xl font-semibold text-white">{player.name} {player.isHuman && '(Você)'}</p>
              <p className="text-sm text-gray-400">
                {difference === 0 
                  ? "Acertou na mosca!" 
                  : `Chegou mais perto, errando ${formatDifference(difference)}.`
                }
              </p>
            </div>
          ))}
        </div>
        
        <p className="text-2xl font-bold text-yellow-400">
          Prêmio: {prizePerWinner.toLocaleString('pt-BR')} {CURRENCY_SYMBOL} cada
        </p>

        <button
          onClick={onPlayAgain}
          className={`mt-8 w-full ${isHumanWinner ? 'bg-green-500 hover:bg-green-400' : 'bg-purple-600 hover:bg-purple-500'} text-gray-900 font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105`}
        >
          Jogar Novamente
        </button>
      </div>
    </div>
  );
};

export default ResultsModal;
