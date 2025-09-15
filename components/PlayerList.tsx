import React from 'react';
import { Player } from '../types';
import { ClockIcon, UserIcon } from './icons';

interface PlayerListProps {
  players: Player[];
}

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-purple-500/20">
      <h2 className="text-2xl font-bold text-purple-400 mb-4 text-center">Jogadores na Rodada</h2>
      {players.length === 0 ? (
        <p className="text-center text-gray-400 italic">Aguardando sua aposta...</p>
      ) : (
        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {players.map((player) => (
            <li
              key={player.id}
              className={`flex items-center justify-between bg-gray-900/60 p-3 rounded-lg border transition-all ${player.isHuman ? 'border-cyan-400 shadow-lg shadow-cyan-500/10' : 'border-gray-700/50'}`}
            >
              <div className="flex items-center gap-3">
                <UserIcon className={`w-5 h-5 ${player.isHuman ? 'text-cyan-400' : 'text-purple-400'}`} />
                <span className="font-medium">{player.name} {player.isHuman && '(Você)'}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm">
                <ClockIcon className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold">{player.betTime}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlayerList;
