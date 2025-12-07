import { Event } from "../types";
import { addDays, addHours, formatISO } from "date-fns";

const today = new Date();

export const MOCK_EVENTS: Event[] = [
  {
    id: "evt_1",
    startTime: formatISO(addHours(today, 2)),
    league: "LaLiga",
    homeTeam: "Elche",
    awayTeam: "Girona",
    kalshiProbs: {
      home: 0.32,
      draw: 0.29,
      away: 0.39,
    },
  },
  {
    id: "evt_2",
    startTime: formatISO(addHours(today, 4)),
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    kalshiProbs: {
      home: 0.45,
      draw: 0.25,
      away: 0.30,
    },
  },
  {
    id: "evt_3",
    startTime: formatISO(addHours(today, 6)),
    league: "Serie A",
    homeTeam: "Juventus",
    awayTeam: "AC Milan",
    kalshiProbs: {
      home: 0.38,
      draw: 0.32,
      away: 0.30,
    },
  },
  {
    id: "evt_4",
    startTime: formatISO(addDays(today, 1)),
    league: "Bundesliga",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    kalshiProbs: {
      home: 0.55,
      draw: 0.20,
      away: 0.25,
    },
  },
  {
    id: "evt_5",
    startTime: formatISO(addDays(today, 1)),
    league: "Ligue 1",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    kalshiProbs: {
      home: 0.60,
      draw: 0.22,
      away: 0.18,
    },
  },
];
