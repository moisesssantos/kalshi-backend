import { webcrypto } from "crypto";
import axios from "axios";

const { subtle } = webcrypto;
const BASE_URL = "https://api.kalshi.com"; // 🔥 API CORRETA

//
// Converte PEM -> DER
//
function pemToDer(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

//
// ED25519 signing (Kalshi 2024+)
//
async function signEd25519(privateKeyPem: string, text: string): Promise<string> {
  const der = pemToDer(privateKeyPem.trim());
  const key = await subtle.importKey("pkcs8", der, { name: "Ed25519" }, false, ["sign"]);
  const sig = await subtle.sign("Ed25519", key, Buffer.from(text));
  return Buffer.from(sig).toString("base64");
}

//
// Request wrapper
//
export async function kalshiRequest<T>(
  method: string,
  path: string,
  data?: any
): Promise<T> {
  const keyId = process.env.KALSHI_KEY_ID;
  const privateKey = process.env.KALSHI_PRIVATE_KEY;

  if (!keyId || !privateKey) {
    throw new Error("Missing KALSHI_KEY_ID or KALSHI_PRIVATE_KEY");
  }

  // ⚠️ timestamp em segundos
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const pathWithoutQuery = path.split("?")[0];
  const signPayload = timestamp + method.toUpperCase() + pathWithoutQuery;

  const signature = await signEd25519(privateKey, signPayload);

  const headers = {
    "KALSHI-ACCESS-KEY": keyId,
    "KALSHI-ACCESS-SIGNATURE": signature,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios({ method, url: BASE_URL + path, headers, data });
    return response.data;
  } catch (err: any) {
    console.error("Kalshi API error:", err.response?.data || err.message);
    throw err;
  }
}

//
// Fetch football events
//
export async function getFootballEvents() {
  const res = await kalshiRequest<any>(
    "GET",
    "/trade-api/v2/events?with_nested_markets=true&limit=200&status=open"
  );

  console.log("Raw events returned:", res.events.length);

  const filtered = res.events.filter((ev: any) => {
    const cat = ev.category?.toLowerCase() || "";
    const sub = ev.sub_category?.toLowerCase() || "";
    const title = ev.title?.toLowerCase() || "";

    return (
      (cat === "sports" && sub.includes("football")) ||
      title.includes("football") ||
      title.includes("soccer") ||
      title.includes("premier league") ||
      title.includes("la liga")
    );
  });

  console.log("Football events found:", filtered.length);
  return filtered;
}

//
// Parse event
//
export function parseKalshiEvent(ev: any) {
  const [home, away] = ev.title?.split(" vs ") ?? ["Team A", "Team B"];

  const markets = ev.markets || [];
  const homeM = markets.find((m: any) => m.title.toLowerCase().includes("home"));
  const awayM = markets.find((m: any) => m.title.toLowerCase().includes("away"));
  const drawM = markets.find((m: any) => m.title.toLowerCase().includes("draw"));

  const hp = homeM?.yes_ask ? homeM.yes_ask / 100 : 0.33;
  const dp = drawM?.yes_ask ? drawM.yes_ask / 100 : 0.33;
  const ap = awayM?.yes_ask ? awayM.yes_ask / 100 : 0.34;

  const total = hp + dp + ap;

  return {
    id: ev.event_ticker,
    startTime: markets[0]?.open_time || new Date().toISOString(),
    league: ev.subtitle || ev.series_ticker || "Unknown League",
    homeTeam: home.trim(),
    awayTeam: away.trim(),
    kalshiProbs: {
      home: hp / total,
      draw: dp / total,
      away: ap / total,
    },
  };
}
