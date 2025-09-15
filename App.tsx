// Fix: Implement the main App component and its logic.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import DigitalClock from './components/DigitalClock';
import PlayerInputForm from './components/PlayerInputForm';
import PlayerList from './components/PlayerList';
import ResultsModal from './components/ResultsModal';
import { Player, Winner, GameStatus, User, BetHistoryEntry } from './types';
import { INITIAL_BALANCE, CLOCK_ANIMATION_DURATION_MS, CLOCK_TICK_INTERVAL_MS, CURRENCY_SYMBOL } from './constants';
import { UserIcon, ClockIcon, HistoryIcon } from './components/icons';


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor((minutes / 60) % 24);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Sub-components defined within App.tsx for simplicity
const LoginComponent: React.FC<{ onLogin: (details: { name: string; email: string; phone: string; pin: string }) => void }> = ({ onLogin }) => {
    const [details, setDetails] = useState({ name: '', email: '', phone: '', pin: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'pin' && value.length > 4) return;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (details.name && details.email && details.phone && details.pin.length === 4) {
            onLogin(details);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/20 via-gray-900 to-black p-4">
            <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-cyan-500/20">
                <h1 className="text-4xl font-bold text-cyan-400 font-orbitron text-center mb-2">Relógio Maluco</h1>
                <p className="text-center text-gray-400 mb-8">Crie sua conta para começar a jogar</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Nome Completo" value={details.name} onChange={handleChange} required className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                    <input type="email" name="email" placeholder="Email" value={details.email} onChange={handleChange} required className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                    <input type="tel" name="phone" placeholder="Número de Telefone" value={details.phone} onChange={handleChange} required className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                    <input type="password" name="pin" placeholder="PIN de 4 dígitos" value={details.pin} onChange={handleChange} required pattern="\d{4}" title="PIN must be 4 digits" className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" maxLength={4} />
                    <button type="submit" className="w-full bg-cyan-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-cyan-400 disabled:bg-gray-600 transition-all duration-300 transform hover:scale-105">
                        Entrar / Registrar
                    </button>
                </form>
            </div>
        </div>
    );
};

const HistoryComponent: React.FC<{ history: BetHistoryEntry[] }> = ({ history }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-purple-500/20 h-full">
        {history.length === 0 ? (
            <p className="text-center text-gray-400 italic h-full flex items-center justify-center">Nenhum histórico de apostas.</p>
        ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {history.map(entry => (
                    <li key={entry.id} className={`p-3 rounded-lg bg-gray-900/60 border-l-4 ${entry.outcome === 'win' ? 'border-green-400' : 'border-red-400'}`}>
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-gray-400">{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                            <span className={`font-bold px-2 py-1 rounded-full text-xs ${entry.outcome === 'win' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {entry.outcome === 'win' ? 'VITÓRIA' : 'DERROTA'}
                            </span>
                        </div>
                        <div className="text-center">
                            <p>Aposta: <span className="font-mono font-bold">{entry.betTime}</span> por <span className="font-bold">{entry.betAmount} {CURRENCY_SYMBOL}</span></p>
                            <p className="text-gray-300">Sorteado: <span className="font-mono font-bold">{entry.winningTime}</span></p>
                            {entry.outcome === 'win' && <p className="text-green-400 font-bold">Prêmio: +{entry.prize.toLocaleString('pt-BR')} {CURRENCY_SYMBOL}</p>}
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
);


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [betHistory, setBetHistory] = useState<BetHistoryEntry[]>([]);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Waiting);
  const [winningTime, setWinningTime] = useState<string>('00:00');
  const [winners, setWinners] = useState<Winner[]>([]);
  const [jackpot, setJackpot] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState('12:00');
  const [activeTab, setActiveTab] = useState<'players' | 'history'>('players');

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('luckyClockUser');
    const savedHistory = localStorage.getItem('luckyClockHistory');
    if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
    }
    if (savedHistory) {
        setBetHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save user data to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('luckyClockUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Save history to localStorage
  useEffect(() => {
    if (betHistory.length > 0) {
      localStorage.setItem('luckyClockHistory', JSON.stringify(betHistory));
    }
  }, [betHistory]);

  const updateUserBalance = useCallback((amount: number) => {
      setCurrentUser(prevUser => prevUser ? { ...prevUser, balance: prevUser.balance + amount } : null);
  }, []);

  const recordGameResult = useCallback((finalTime: string, currentWinners: Winner[], totalJackpot: number) => {
    const humanPlayer = players.find(p => p.isHuman);
    if (!humanPlayer) return;

    const isWinner = currentWinners.some(w => w.player.isHuman);
    const prize = isWinner ? totalJackpot / currentWinners.length : 0;
    
    const newEntry: BetHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        betTime: humanPlayer.betTime,
        betAmount: humanPlayer.betAmount,
        winningTime: finalTime,
        outcome: isWinner ? 'win' : 'loss',
        prize: prize
    };
    
    setBetHistory(prev => [newEntry, ...prev]);

    if (isWinner) {
      updateUserBalance(prize);
    }
  }, [players, updateUserBalance]);


  const determineWinners = useCallback((finalTime: string) => {
    const finalMinutes = timeToMinutes(finalTime);
    let minDifference = Infinity;
    let currentWinners: Winner[] = [];

    for (const player of players) {
      const playerMinutes = timeToMinutes(player.betTime);
      const difference = Math.abs(finalMinutes - playerMinutes);
      const wrapAroundDifference = Math.min(difference, (24 * 60) - difference);

      if (wrapAroundDifference < minDifference) {
        minDifference = wrapAroundDifference;
        currentWinners = [{ player, difference: wrapAroundDifference }];
      } else if (wrapAroundDifference === minDifference) {
        currentWinners.push({ player, difference: wrapAroundDifference });
      }
    }
    
    setWinners(currentWinners);
    setWinningTime(finalTime);
    recordGameResult(finalTime, currentWinners, jackpot);

  }, [players, jackpot, recordGameResult]);


  useEffect(() => {
    if (gameStatus !== GameStatus.Running) return;
    setActiveTab('players'); // Switch to players tab when game starts

    const finalTimeInMinutes = Math.floor(Math.random() * 24 * 60);
    const finalTime = minutesToTime(finalTimeInMinutes);
    
    const totalDuration = CLOCK_ANIMATION_DURATION_MS;
    const intervalTime = CLOCK_TICK_INTERVAL_MS;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const randomMinutes = Math.floor(Math.random() * 24 * 60);
      setCurrentTime(minutesToTime(randomMinutes));

      if (currentStep >= (totalDuration / intervalTime)) {
        clearInterval(timer);
        setCurrentTime(finalTime);
        setGameStatus(GameStatus.Finished);
        determineWinners(finalTime);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [gameStatus, determineWinners]);

  const handlePlaceBet = async (betTime: string, betAmount: number) => {
    if (!currentUser || currentUser.balance < betAmount) return;

    const humanPlayer: Player = {
      id: 'human-player',
      name: currentUser.name,
      betTime,
      betAmount,
      isHuman: true,
    };
    
    updateUserBalance(-betAmount);
    setGameStatus(GameStatus.Running);
    setPlayers([humanPlayer]);

    // Simplified AI generation for brevity
    const aiPlayers = [
        { id: 'ai-1', name: 'Bot Astro', betTime: minutesToTime(Math.random() * 1440), betAmount: 100, isHuman: false },
        { id: 'ai-2', name: 'Bot Cósmico', betTime: minutesToTime(Math.random() * 1440), betAmount: 50, isHuman: false },
        { id: 'ai-3', name: 'Bot Nebulosa', betTime: minutesToTime(Math.random() * 1440), betAmount: 250, isHuman: false },
      ];
    
    const allPlayers = [humanPlayer, ...aiPlayers];
    const totalJackpot = allPlayers.reduce((sum, p) => sum + p.betAmount, 0);

    setJackpot(totalJackpot);
    setPlayers(allPlayers);
  };
  
  const handlePlayAgain = () => {
    setPlayers([]);
    setGameStatus(GameStatus.Waiting);
    setWinners([]);
    setJackpot(0);
    setCurrentTime('12:00');
  };

  const handleLogin = (details: { name: string; email: string; phone: string; }) => {
    const newUser: User = {
        name: details.name,
        email: details.email,
        phone: details.phone,
        balance: INITIAL_BALANCE
    };
    setCurrentUser(newUser);
    setBetHistory([]); // Reset history for new user
    localStorage.removeItem('luckyClockHistory');
  };

  const handleLogout = () => {
    localStorage.removeItem('luckyClockUser');
    localStorage.removeItem('luckyClockHistory');
    setCurrentUser(null);
    setBetHistory([]);
  };
  
  const isHumanWinner = useMemo(() => winners.some(w => w.player.isHuman), [winners]);

  if (!currentUser) {
      return <LoginComponent onLogin={handleLogin} />;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col p-4 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/20 via-gray-900 to-black">
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-cyan-400 font-orbitron">Relógio Maluco</h1>
            <p className="text-gray-400">Bem-vindo, {currentUser.name}!</p>
        </div>
        <div className="text-right">
            <div className="text-xl font-semibold bg-gray-800/50 px-4 py-2 rounded-lg inline-block">
                Saldo: <span className="font-bold text-green-400">{currentUser.balance.toLocaleString('pt-BR')} {CURRENCY_SYMBOL}</span>
            </div>
            <button onClick={handleLogout} className="text-sm text-cyan-400 hover:underline ml-4">Sair</button>
        </div>
      </header>
      
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center flex-grow">
        <div className="w-full">
             <PlayerInputForm 
              onPlaceBet={handlePlaceBet} 
              isDisabled={gameStatus !== GameStatus.Waiting}
              userBalance={currentUser.balance}
            />
        </div>
        <div className="w-full flex justify-center">
            <DigitalClock time={currentTime} status={gameStatus} />
        </div>
        <div className="w-full self-start">
            <div className="flex mb-2 rounded-lg bg-gray-800/50 p-1">
                <button onClick={() => setActiveTab('players')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'players' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>
                    <UserIcon className="w-5 h-5" /> Jogadores
                </button>
                 <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'history' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>
                    <HistoryIcon className="w-5 h-5" /> Histórico
                </button>
            </div>
             {activeTab === 'players' ? <PlayerList players={players} /> : <HistoryComponent history={betHistory} />}
        </div>
      </main>

      {gameStatus === GameStatus.Finished && winners.length > 0 && (
        <ResultsModal 
            winners={winners}
            winningTime={winningTime}
            jackpot={jackpot}
            onPlayAgain={handlePlayAgain}
            isHumanWinner={isHumanWinner}
        />
      )}

      <footer className="text-center mt-12 text-gray-500 text-sm">
        <p>Apostar pode ser viciante. Jogue com responsabilidade.</p>
        <p>&copy; {new Date().getFullYear()} Relógio Maluco. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default App;