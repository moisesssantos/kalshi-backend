import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EventRow } from "../components/EventRow";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, RefreshCw, Settings2, LayoutDashboard, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Event } from "../types";

async function fetchEvents(): Promise<Event[]> {
  const response = await fetch('/api/events');
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  const data = await response.json();
  return data.events;
}

export function Dashboard() {
  const [globalTotalStake, setGlobalTotalStake] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  });

  const filteredEvents = events.filter(e => 
    e.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <span>Kalshi<span className="text-muted-foreground">Analyzer</span></span>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Total Stake:</span>
                <Input 
                  type="number" 
                  className="w-20 h-8 font-mono" 
                  value={globalTotalStake} 
                  onChange={e => setGlobalTotalStake(Number(e.target.value))} 
                />
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-6 px-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 w-full max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar evento, time ou liga..." 
                className="pl-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Probabilidades
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar eventos da Kalshi. Verifique suas credenciais e tente novamente.
            </AlertDescription>
          </Alert>
        )}

        <Card className="flex-1 border shadow-sm flex flex-col overflow-hidden bg-card/50">
          <ScrollArea className="flex-1">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-[140px]">Evento</TableHead>
                    <TableHead className="w-[90px] text-right">Odd Exch.</TableHead>
                    <TableHead className="w-[90px] text-right">AH 0</TableHead>
                    <TableHead className="w-[80px] text-right">Prob K.</TableHead>
                    <TableHead className="w-[60px] text-center">Mkt</TableHead>
                    <TableHead className="w-[80px] text-right">Stake</TableHead>
                    <TableHead className="w-[80px] text-right">Retorno</TableHead>
                    <TableHead className="w-[60px] text-right">Comm</TableHead>
                    <TableHead className="w-[90px] text-right">Ret. Liq.</TableHead>
                    <TableHead className="w-[90px] text-right">Lucro</TableHead>
                    <TableHead className="w-[80px] text-right">P. Max</TableHead>
                    <TableHead className="w-[90px] text-right">Resultado</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={13} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Carregando eventos da Kalshi...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && filteredEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
                        {searchTerm ? 'Nenhum evento encontrado' : 'Nenhum evento de futebol disponível no momento'}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && filteredEvents.map(event => (
                    <EventRow 
                      key={event.id} 
                      event={event} 
                      globalTotalStake={globalTotalStake} 
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </Card>
      </main>
    </div>
  );
}
