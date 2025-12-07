import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getFootballEvents, parseKalshiEvent } from "./services/kalshi";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get football events from Kalshi
  app.get('/api/events', async (req, res) => {
    try {
      const kalshiEvents = await getFootballEvents();
      
      // Transform Kalshi events to our format
      let events = kalshiEvents.map(parseKalshiEvent);
      
      // If no real events, add mock data for testing
      if (events.length === 0) {
        events = [
          {
            id: 'mock-1',
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            league: 'Premier League (MOCK DATA)',
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool',
            kalshiProbs: {
              home: 0.40,
              draw: 0.30,
              away: 0.30,
            }
          },
          {
            id: 'mock-2',
            startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            league: 'La Liga (MOCK DATA)',
            homeTeam: 'Real Madrid',
            awayTeam: 'Barcelona',
            kalshiProbs: {
              home: 0.45,
              draw: 0.25,
              away: 0.30,
            }
          },
          {
            id: 'mock-3',
            startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
            league: 'Bundesliga (MOCK DATA)',
            homeTeam: 'Bayern Munich',
            awayTeam: 'Borussia Dortmund',
            kalshiProbs: {
              home: 0.50,
              draw: 0.28,
              away: 0.22,
            }
          }
        ];
      }
      
      res.json({ events });
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({ 
        error: 'Failed to fetch events from Kalshi',
        message: error.message 
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return httpServer;
}
