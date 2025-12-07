export interface Event {
  id: string;
  startTime: string; // ISO string
  league: string;
  homeTeam: string;
  awayTeam: string;
  kalshiProbs: {
    home: number; // 0-1
    draw: number; // 0-1
    away: number; // 0-1
  };
}

export interface UserInputs {
  exchangeOdds: {
    home: string; // string to allow empty state
    draw: string;
    away: string;
  };
  ah0Odds: {
    home: string;
    away: string;
  };
  workEvent: boolean;
  maxLossPercent: string;
  zeroDrawProfit: boolean;
  commissions: {
    home: string;
    draw: string;
    away: string;
  };
  results: {
    home: string;
    draw: string;
    away: string;
  };
}

export interface CalculationResult {
  stakes: {
    home: number;
    draw: number; // or AH0 stake
    away: number;
  };
  returns: {
    home: number;
    draw: number;
    away: number;
  };
  profit: {
    home: number;
    draw: number;
    away: number;
  };
  netProfit: {
    home: number;
    draw: number;
    away: number;
  };
  isAh0Used: boolean;
  bestMarkets: {
    home: 'Exchange' | 'Kalshi';
    draw: 'Exchange' | 'Kalshi'; // or AH0
    away: 'Exchange' | 'Kalshi';
  };
  totalStake: number;
  maxLoss: number;
}
