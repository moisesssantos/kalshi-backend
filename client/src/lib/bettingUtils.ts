import { UserInputs, CalculationResult, Event } from "../types";

export const DEFAULT_TOTAL_STAKE = 100;
export const DEFAULT_COMMISSION = 2.8;

// Helper to parse float safely
const parseFloatSafe = (val: string): number | null => {
  const parsed = parseFloat(val);
  return isNaN(parsed) || parsed < 0 ? null : parsed; // Allow 0
};

// Convert Probability to Odd
const probToOdd = (prob: number): number => (prob > 0 ? 1 / prob : 0);

export function calculateEventMetrics(
  event: Event,
  inputs: UserInputs,
  totalStake: number = DEFAULT_TOTAL_STAKE
): CalculationResult {
  const { kalshiProbs } = event;
  const { exchangeOdds, ah0Odds, workEvent, maxLossPercent, zeroDrawProfit, commissions } = inputs;

  const kalshiOddHome = probToOdd(kalshiProbs.home);
  const kalshiOddDraw = probToOdd(kalshiProbs.draw);
  const kalshiOddAway = probToOdd(kalshiProbs.away);

  const exOddHome = parseFloatSafe(exchangeOdds.home);
  const exOddDraw = parseFloatSafe(exchangeOdds.draw);
  const exOddAway = parseFloatSafe(exchangeOdds.away);
  
  const ah0OddHome = parseFloatSafe(ah0Odds.home);
  const ah0OddAway = parseFloatSafe(ah0Odds.away);

  const getBest = (exOdd: number | null, kOdd: number, type: 'Exchange' | 'Kalshi') => {
     if (!exOdd) return { odd: kOdd, market: 'Kalshi' as const };
     return exOdd > kOdd ? { odd: exOdd, market: 'Exchange' as const } : { odd: kOdd, market: 'Kalshi' as const };
  };

  let bestHome = getBest(exOddHome, kalshiOddHome, 'Exchange');
  let bestDraw = getBest(exOddDraw, kalshiOddDraw, 'Exchange');
  let bestAway = getBest(exOddAway, kalshiOddAway, 'Exchange');
  
  let useAh0 = false;
  let effectiveOdds = { home: bestHome.odd, draw: bestDraw.odd, away: bestAway.odd };
  let marketSource = { home: bestHome.market, draw: bestDraw.market, away: bestAway.market };

  if (ah0OddHome && ah0OddHome > 1.01) {
     useAh0 = true;
     effectiveOdds.draw = ah0OddHome; 
     marketSource.draw = 'Exchange';
  } else if (ah0OddAway && ah0OddAway > 1.01) {
     useAh0 = true;
     effectiveOdds.draw = ah0OddAway;
     marketSource.draw = 'Exchange';
  }

  const inv1 = 1 / effectiveOdds.home;
  const invX = 1 / effectiveOdds.draw;
  const inv2 = 1 / effectiveOdds.away;
  const sumInv = inv1 + invX + inv2;

  let s1 = (totalStake / effectiveOdds.home) / sumInv;
  let sX = (totalStake / effectiveOdds.draw) / sumInv;
  let s2 = (totalStake / effectiveOdds.away) / sumInv;

  if (workEvent) {
      const oddsMap = [
          { id: 'home', odd: effectiveOdds.home, stake: s1 },
          { id: 'draw', odd: effectiveOdds.draw, stake: sX },
          { id: 'away', odd: effectiveOdds.away, stake: s2 }
      ];
      const sorted = [...oddsMap].sort((a, b) => b.odd - a.odd);
      const zebra = sorted[0]; 
      
      const pMax = parseFloatSafe(maxLossPercent) || 0;
      const maxLossAmount = (totalStake * pMax) / 100;
      
      let newStakeZebra = (totalStake - maxLossAmount) / zebra.odd;
      if (newStakeZebra < 0) newStakeZebra = 0;

      if (zebra.id === 'home') s1 = newStakeZebra;
      else if (zebra.id === 'draw') sX = newStakeZebra;
      else s2 = newStakeZebra;

      if (!zeroDrawProfit && zebra.id !== 'draw') {
         const favorite = sorted[2]; 
         const middle = sorted[1];
         
         const remaining = totalStake - newStakeZebra;
         const sumInvRest = (1/middle.odd) + (1/favorite.odd);
         
         const ratioMiddle = (1/middle.odd) / sumInvRest;
         const ratioFav = (1/favorite.odd) / sumInvRest;
         
         let newStakeMiddle = remaining * ratioMiddle;
         let newStakeFav = remaining * ratioFav;
         
         if (middle.id === 'home') s1 = newStakeMiddle;
         else if (middle.id === 'draw') sX = newStakeMiddle;
         else s2 = newStakeMiddle;
         
         if (favorite.id === 'home') s1 = newStakeFav;
         else if (favorite.id === 'draw') sX = newStakeFav;
         else s2 = newStakeFav;
         
      } else if (zeroDrawProfit) {
          if (zebra.id !== 'draw') {
             sX = totalStake / effectiveOdds.draw; // Fix Draw to break even
          }
          
          const used = newStakeZebra + (zebra.id !== 'draw' ? sX : 0);
          let rest = totalStake - used;
          if (rest < 0) rest = 0;
          
          // Assign rest to the remaining one (Favorite)
          const leftoverId = ['home', 'draw', 'away'].find(id => id !== zebra.id && id !== 'draw');
          
          if (leftoverId === 'home') s1 = rest;
          if (leftoverId === 'away') s2 = rest;
      }
  }

  const r1 = s1 * effectiveOdds.home;
  const rX = sX * effectiveOdds.draw;
  const r2 = s2 * effectiveOdds.away;

  // Use individual commissions
  // If user entered commission, use it. Otherwise use default logic: Kalshi=0, Exchange=2.8
  const getComm = (field: 'home' | 'draw' | 'away') => {
      const userVal = parseFloatSafe(commissions[field]);
      if (userVal !== null) return userVal;
      // Default logic
      return marketSource[field] === 'Kalshi' ? 0 : DEFAULT_COMMISSION;
  };

  const c1 = getComm('home');
  const cX = getComm('draw');
  const c2 = getComm('away');

  const calcNet = (stake: number, grossReturn: number, commRate: number) => {
      const commMult = (100 - commRate) / 100;
      const marketProfit = grossReturn - stake; 
      let netMarketReturn = grossReturn;
      
      if (marketProfit > 0) {
          netMarketReturn = stake + (marketProfit * commMult);
      }
      
      const finalNetProfit = netMarketReturn - totalStake;
      return { netReturn: netMarketReturn, netProfit: finalNetProfit };
  };

  const net1 = calcNet(s1, r1, c1);
  const netX = calcNet(sX, rX, cX);
  const net2 = calcNet(s2, r2, c2);

  return {
    stakes: { home: s1, draw: sX, away: s2 },
    returns: { home: r1, draw: rX, away: r2 },
    profit: { home: r1 - totalStake, draw: rX - totalStake, away: r2 - totalStake },
    netProfit: { 
        home: net1.netProfit, 
        draw: netX.netProfit, 
        away: net2.netProfit 
    },
    isAh0Used: useAh0,
    bestMarkets: marketSource,
    totalStake,
    maxLoss: Math.min(net1.netProfit, netX.netProfit, net2.netProfit)
  };
}
