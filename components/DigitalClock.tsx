
import React from 'react';
import { GameStatus } from '../types';

interface DigitalClockProps {
  time: string;
  status: GameStatus;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ time, status }) => {
  const isFinished = status === GameStatus.Finished;
  const timeColor = isFinished ? 'text-green-400' : 'text-cyan-400';
  const shadowColor = isFinished ? 'shadow-[0_0_20px_theme(colors.green.400)]' : 'shadow-[0_0_20px_theme(colors.cyan.400)]';
  
  return (
    <div className="flex flex-col items-center justify-center bg-black/50 p-8 rounded-full border-4 border-gray-700 aspect-square w-64 h-64 mx-auto shadow-2xl">
      <div className={`font-orbitron text-6xl tracking-widest transition-colors duration-500 ${timeColor} ${shadowColor}`}>
        {time}
      </div>
      <div className="mt-2 text-lg font-semibold text-gray-400 uppercase tracking-widest">
        {status === GameStatus.Waiting && "Aguardando"}
        {status === GameStatus.Running && "Sorteando..."}
        {status === GameStatus.Finished && "Resultado"}
      </div>
    </div>
  );
};

export default DigitalClock;
