import React, { useState, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Event, UserInputs } from "../types";
import { calculateEventMetrics, DEFAULT_TOTAL_STAKE, DEFAULT_COMMISSION } from "../lib/bettingUtils";
import { format } from "date-fns";
import { Info, Save, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventRowProps {
  event: Event;
  globalTotalStake: number;
}

export function EventRow({ event, globalTotalStake }: EventRowProps) {
  const [inputs, setInputs] = useState<UserInputs>({
    exchangeOdds: { home: "", draw: "", away: "" },
    ah0Odds: { home: "", away: "" },
    workEvent: false,
    maxLossPercent: "10",
    zeroDrawProfit: false,
    commissions: { home: "", draw: "", away: "" },
    results: { home: "", draw: "", away: "" }
  });

  // Local calculation state
  const metrics = calculateEventMetrics(event, inputs, globalTotalStake);
  const { stakes, returns, netProfit, isAh0Used, bestMarkets, maxLoss } = metrics;

  // Auto-fill defaults for Commission when bestMarket changes (if empty)
  // Actually, calculateEventMetrics handles calculation with defaults.
  // But we want to show the defaults in the Input if they are not dirty?
  // Or just placeholder?
  // Let's use placeholders dynamically or just let the calc handle it and user overrides.
  // Better: Show the effective commission in the input placeholder or default value.

  const handleInputChange = (field: keyof UserInputs['exchangeOdds'], value: string) => {
    setInputs(prev => ({ ...prev, exchangeOdds: { ...prev.exchangeOdds, [field]: value } }));
  };

  const handleAh0Change = (field: keyof UserInputs['ah0Odds'], value: string) => {
    setInputs(prev => ({ ...prev, ah0Odds: { ...prev.ah0Odds, [field]: value } }));
  };

  const handleCommChange = (field: keyof UserInputs['commissions'], value: string) => {
    setInputs(prev => ({ ...prev, commissions: { ...prev.commissions, [field]: value } }));
  };
  
  const handleResultChange = (field: keyof UserInputs['results'], value: string) => {
    setInputs(prev => ({ ...prev, results: { ...prev.results, [field]: value } }));
  };

  const formatCurrency = (val: number) => val.toFixed(2);
  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  // Helper to colorize profit/loss
  const getProfitColor = (val: number) => {
    if (val > 0) return "text-[hsl(142,76%,36%)] font-bold"; // Green
    if (val < 0) return "text-[hsl(346,84%,61%)] font-bold"; // Red
    return "text-muted-foreground";
  };

  const ResultCell = ({ val, label }: { val: number, label?: string }) => (
    <div className="flex flex-col items-end">
      <span className={getProfitColor(val)}>{formatCurrency(val)}</span>
      {label && <span className="text-[10px] text-muted-foreground uppercase">{label}</span>}
    </div>
  );
  
  const getCommPlaceholder = (market: 'Exchange' | 'Kalshi') => {
      return market === 'Kalshi' ? "0" : "2.8";
  };

  return (
    <>
      {/* Header Row for the Event Context */}
      <TableRow className="bg-muted/30 hover:bg-muted/40 border-b-0">
        <TableCell colSpan={13} className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground">{format(new Date(event.startTime), "dd/MM HH:mm")}</span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-normal">{event.league}</Badge>
              <span className="font-semibold text-sm">{event.homeTeam} <span className="text-muted-foreground font-normal mx-1">vs</span> {event.awayTeam}</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Work Event Controls */}
              <div className="flex items-center gap-2 bg-card border rounded-md px-2 py-1 shadow-sm">
                <div className="flex items-center gap-1">
                  <Switch 
                    id={`work-${event.id}`} 
                    checked={inputs.workEvent} 
                    onCheckedChange={(c) => setInputs(p => ({ ...p, workEvent: c }))} 
                    className="scale-75"
                  />
                  <Label htmlFor={`work-${event.id}`} className="text-xs cursor-pointer whitespace-nowrap">Trabalhar Evento</Label>
                </div>
                
                {inputs.workEvent && (
                  <>
                    <div className="h-4 w-px bg-border mx-1" />
                    <div className="flex items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground">P.Max %</Label>
                      <Input 
                        className="h-6 w-12 text-xs text-right px-1" 
                        value={inputs.maxLossPercent}
                        onChange={(e) => setInputs(p => ({ ...p, maxLossPercent: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-1 ml-1">
                      <Switch 
                         id={`zero-${event.id}`}
                         checked={inputs.zeroDrawProfit}
                         onCheckedChange={(c) => setInputs(p => ({ ...p, zeroDrawProfit: c }))}
                         className="scale-75"
                      />
                      <Label htmlFor={`zero-${event.id}`} className="text-[10px] cursor-pointer whitespace-nowrap">Zerar Empate</Label>
                    </div>
                  </>
                )}
              </div>
              
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10">
                <Save className="w-3 h-3" />
                Salvar
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>

      {/* ROW 1: HOME */}
      <TableRow className="border-b border-border/50 hover:bg-transparent">
        <TableCell className="font-medium w-[140px]">{event.homeTeam}</TableCell>
        
        {/* Odd Exchange */}
        <TableCell className="p-1">
          <Input 
            className="h-8 w-20 text-right font-mono text-xs bg-background border-input focus-visible:ring-1" 
            placeholder="Odd"
            value={inputs.exchangeOdds.home}
            onChange={(e) => handleInputChange('home', e.target.value)}
          />
        </TableCell>

        {/* AH 0 */}
        <TableCell className="p-1">
          <Input 
            className="h-8 w-20 text-right font-mono text-xs bg-background/50 border-dashed focus-visible:border-solid focus-visible:ring-1" 
            placeholder="AH 0"
            value={inputs.ah0Odds.home}
            onChange={(e) => handleAh0Change('home', e.target.value)}
          />
        </TableCell>

        {/* Prob Kalshi */}
        <TableCell className="text-right font-mono text-xs text-muted-foreground">
          {(event.kalshiProbs.home * 100).toFixed(1)}%
        </TableCell>

        {/* Melhor Mercado */}
        <TableCell className="text-center">
          <Badge 
            variant={bestMarkets.home === 'Kalshi' ? 'secondary' : 'default'} 
            className={cn(
                "text-[10px] h-5 px-1.5 font-mono font-normal",
                bestMarkets.home === 'Kalshi' && "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50"
            )}
          >
            {bestMarkets.home.substring(0, 1)}
          </Badge>
        </TableCell>

        {/* Stake Ideal */}
        <TableCell className="text-right font-mono text-xs font-medium">
          {stakes.home.toFixed(2)}
        </TableCell>

        {/* Retorno Bruto */}
        <TableCell className="text-right font-mono text-xs text-muted-foreground">
          {returns.home.toFixed(2)}
        </TableCell>

        {/* Comissão */}
        <TableCell className="p-1">
           <Input 
             className="h-7 w-12 text-right font-mono text-[10px] bg-transparent border-0 border-b border-transparent focus:border-primary rounded-none focus:ring-0 px-0"
             placeholder={getCommPlaceholder(bestMarkets.home)}
             value={inputs.commissions.home}
             onChange={(e) => handleCommChange('home', e.target.value)}
           />
        </TableCell>

        {/* Retorno Líquido (Net Return) */}
        <TableCell className="text-right font-mono text-xs font-medium">
           {(stakes.home + netProfit.home).toFixed(2)}
        </TableCell>

        {/* Lucro Líquido */}
        <TableCell className="text-right font-mono text-xs">
          <ResultCell val={netProfit.home} />
        </TableCell>

        {/* Perda Máxima */}
        <TableCell className="text-right font-mono text-xs text-red-400/80">
           {inputs.workEvent && <span className="text-[10px]">{formatCurrency(maxLoss)}</span>}
        </TableCell>
        
        {/* Resultado Final (Manual) */}
        <TableCell className="p-1">
           <Input 
             className="h-8 w-20 text-right font-mono text-xs bg-background border-input focus-visible:ring-1"
             placeholder="0.00"
             value={inputs.results.home}
             onChange={(e) => handleResultChange('home', e.target.value)}
           />
        </TableCell>
        
        <TableCell>
           {/* Pros/Cons Tooltip */}
           <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground/50 hover:text-primary" />
            </TooltipTrigger>
            <TooltipContent>
              <p>High liquidity on Home</p>
            </TooltipContent>
           </Tooltip>
        </TableCell>
      </TableRow>

      {/* ROW 2: DRAW / AH0 SUBSTITUTE */}
      <TableRow className="border-b border-border/50 hover:bg-transparent bg-muted/5">
        <TableCell className="font-medium flex items-center gap-2">
          <span>Empate</span>
          {isAh0Used && (
            <Badge variant="destructive" className="h-4 text-[9px] px-1">Substituído por AH0</Badge>
          )}
        </TableCell>
        
        <TableCell className="p-1">
          <Input 
            className="h-8 w-20 text-right font-mono text-xs bg-background border-input focus-visible:ring-1" 
            placeholder="Odd"
            value={inputs.exchangeOdds.draw}
            onChange={(e) => handleInputChange('draw', e.target.value)}
            disabled={isAh0Used} 
          />
        </TableCell>

        <TableCell className="p-1 text-center text-muted-foreground text-xs">
           -
        </TableCell>

        <TableCell className="text-right font-mono text-xs text-muted-foreground">
          {(event.kalshiProbs.draw * 100).toFixed(1)}%
        </TableCell>

        <TableCell className="text-center">
          <Badge 
            variant={bestMarkets.draw === 'Kalshi' ? 'secondary' : 'default'} 
            className={cn(
                "text-[10px] h-5 px-1.5 font-mono font-normal",
                bestMarkets.draw === 'Kalshi' && "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50"
            )}
          >
             {bestMarkets.draw.substring(0, 1)}
          </Badge>
        </TableCell>

        <TableCell className="text-right font-mono text-xs font-medium">
          {stakes.draw.toFixed(2)}
        </TableCell>

        <TableCell className="text-right font-mono text-xs text-muted-foreground">
          {returns.draw.toFixed(2)}
        </TableCell>

        <TableCell className="p-1">
           <Input 
             className="h-7 w-12 text-right font-mono text-[10px] bg-transparent border-0 border-b border-transparent focus:border-primary rounded-none focus:ring-0 px-0"
             placeholder={getCommPlaceholder(bestMarkets.draw)}
             value={inputs.commissions.draw}
             onChange={(e) => handleCommChange('draw', e.target.value)}
           />
        </TableCell>

        <TableCell className="text-right font-mono text-xs font-medium">
           {(stakes.draw + netProfit.draw).toFixed(2)}
        </TableCell>

        <TableCell className="text-right font-mono text-xs">
          <ResultCell val={netProfit.draw} />
        </TableCell>

        <TableCell className="text-right font-mono text-xs text-red-400/80">
        </TableCell>
        
        <TableCell className="p-1">
           <Input 
             className="h-8 w-20 text-right font-mono text-xs bg-background border-input focus-visible:ring-1"
             placeholder="0.00"
             value={inputs.results.draw}
             onChange={(e) => handleResultChange('draw', e.target.value)}
           />
        </TableCell>

        <TableCell></TableCell>
      </TableRow>

      {/* ROW 3: AWAY */}
      <TableRow className="border-b-4 border-border/20 hover:bg-transparent">
        <TableCell className="font-medium">{event.awayTeam}</TableCell>
        
        <TableCell className="p-1">
          <Input 
            className="h-8 w-20 text-right font-mono text-xs bg-background border-input focus-visible:ring-1" 
            placeholder="Odd"
            value={inputs.exchangeOdds.away}
            onChange={(e) => handleInputChange('away', e.target.value)}
          />
        </TableCell>

        <TableCell className="p-1">
          <Input 
            className="h-8 w-20 text-right font-mono text-xs bg-background/50 border-dashed focus-visible:border-solid focus-visible:ring-1" 
            placeholder="AH 0"
            value={inputs.ah0Odds.away}
            onChange={(e) => handleAh0Change('away', e.target.value)}
          />
        </TableCell>

        <TableCell className="text-right font-mono text-xs text-muted-foreground">
          {(event.kalshiProbs.away * 100).toFixed(1)}%
        </TableCell>

        <TableCell className="text-center">
          <Badge 
            variant={bestMarkets.away === 'Kalshi' ? 'secondary' : 'default'} 
            className={cn(
                "text-[10px] h-5 px-1.5 font-mono font-normal",
                bestMarkets.away === 'Kalshi' && "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50"
            )}
          >
             {bestMarkets.away.substring(0, 1)}
          </Badge>
        </TableCell>

        <TableCell className="text-right font-mono text-xs font-medium">
          {stakes.away.toFixed(2)}
        </TableCell>

        <TableCell className="text-right font-mono text-xs text-muted-foreground">
          {returns.away.toFixed(2)}
        </TableCell>

        <TableCell className="p-1">
           <Input 
             className="h-7 w-12 text-right font-mono text-[10px] bg-transparent border-0 border-b border-transparent focus:border-primary rounded-none focus:ring-0 px-0"
             placeholder={getCommPlaceholder(bestMarkets.away)}
             value={inputs.commissions.away}
             onChange={(e) => handleCommChange('away', e.target.value)}
           />
        </TableCell>

        <TableCell className="text-right font-mono text-xs font-medium">
           {(stakes.away + netProfit.away).toFixed(2)}
        </TableCell>

        <TableCell className="text-right font-mono text-xs">
          <ResultCell val={netProfit.away} />
        </TableCell>

        <TableCell className="text-right font-mono text-xs text-red-400/80">
        </TableCell>
        
        <TableCell className="p-1">
           <Input 
             className="h-8 w-20 text-right font-mono text-xs bg-background border-input focus-visible:ring-1"
             placeholder="0.00"
             value={inputs.results.away}
             onChange={(e) => handleResultChange('away', e.target.value)}
           />
        </TableCell>

        <TableCell></TableCell>
      </TableRow>
    </>
  );
}
