import { MarketAlert, AlertPriority } from '../types/signalos';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

export class AlertEngine {
  private db: Database.Database;
  private alerts: MarketAlert[] = [];
  private maxAlerts = 100;

  constructor(db: Database.Database) {
    this.db = db;
    this.initDb();
  }

  private initDb() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS market_alerts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data_json TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON market_alerts(timestamp);
    `);
  }

  async processTriggers() {
    // In a real app, this would be triggered by a WebSocket stream from an indexer
    // or by polling RPC methods like getSignaturesForAddress.
    // Here we simulate the detection logic.
    
    const newAlerts: MarketAlert[] = [];
    
    // Randomly generate alerts based on probabilities to simulate real-time activity
    const roll = Math.random();
    
    if (roll > 0.98) {
      newAlerts.push(this.createAlert('liquidity_removal', 'critical'));
    } else if (roll > 0.95) {
      newAlerts.push(this.createAlert('dev_sell', 'high'));
    } else if (roll > 0.90) {
      newAlerts.push(this.createAlert('whale_buy', 'medium'));
    } else if (roll > 0.85) {
      newAlerts.push(this.createAlert('volume_spike', 'high'));
    } else if (roll > 0.80) {
      newAlerts.push(this.createAlert('narrative_surge', 'low'));
    }

    if (newAlerts.length > 0) {
      this.saveAlertsToDb(newAlerts);
    }

    return newAlerts;
  }

  private createAlert(type: MarketAlert['type'], priority: AlertPriority): MarketAlert {
    const tokens = [
      { name: 'Solana', symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
      { name: 'Virtual Protocol', symbol: 'VIRTUAL', mint: 'vrt...123' },
      { name: 'AI16Z', symbol: 'AI16Z', mint: 'ai1...456' },
      { name: 'Fartcoin', symbol: 'FART', mint: 'frt...789' },
      { name: 'Pepe', symbol: 'PEPE', mint: 'pep...000' },
      { name: 'Bonk', symbol: 'BONK', mint: 'bnk...111' }
    ];
    const token = tokens[Math.floor(Math.random() * tokens.length)];

    let trigger = '';
    let description = '';
    let confidence = 0.75 + Math.random() * 0.24;

    switch(type) {
      case 'dev_sell':
        const percent = (3 + Math.random() * 5).toFixed(1);
        trigger = `Dev wallet sold ${percent}% of supply`;
        description = `Developer wallet ${uuidv4().slice(0, 8)}... dumped ${percent}% of total supply in a single transaction.`;
        break;
      case 'whale_buy':
        const amount = Math.floor(50000 + Math.random() * 150000);
        trigger = `Whale buy detected: $${amount.toLocaleString()}`;
        description = `Institutional-sized buy of $${amount.toLocaleString()} detected for ${token.symbol}. Wallet has 92% win rate.`;
        break;
      case 'liquidity_removal':
        trigger = 'Liquidity removal detected';
        description = `Significant liquidity ($${Math.floor(Math.random() * 500000).toLocaleString()}) was removed from the primary Raydium pool.`;
        confidence = 0.98;
        break;
      case 'volume_spike':
        const volPercent = Math.floor(300 + Math.random() * 700);
        trigger = `Volume spike: ${volPercent}% increase`;
        description = `Trading volume for ${token.symbol} has surged by ${volPercent}% in the last 15 minutes.`;
        break;
      case 'narrative_surge':
        trigger = 'Narrative surge detected';
        description = `Social velocity for the "${token.name}" narrative has crossed the critical threshold on X and Telegram.`;
        break;
    }

    return {
      id: uuidv4(),
      type,
      token,
      trigger,
      confidence,
      priority,
      description,
      timestamp: Date.now(),
      source: type === 'liquidity_removal' || type === 'dev_sell' ? 'Solana RPC' : 'DexScreener',
      link: `https://solscan.io/tx/${uuidv4().replace(/-/g, '')}`,
      txHash: uuidv4().replace(/-/g, '')
    };
  }

  private saveAlertsToDb(alerts: MarketAlert[]) {
    const stmt = this.db.prepare('INSERT INTO market_alerts (id, type, data_json, timestamp) VALUES (?, ?, ?, ?)');
    for (const alert of alerts) {
      stmt.run(alert.id, alert.type, JSON.stringify(alert), alert.timestamp);
    }
    
    // Cleanup old alerts
    this.db.prepare('DELETE FROM market_alerts WHERE id NOT IN (SELECT id FROM market_alerts ORDER BY timestamp DESC LIMIT 200)').run();
  }

  getRecentAlerts(limit = 30): MarketAlert[] {
    const rows = this.db.prepare('SELECT data_json FROM market_alerts ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => JSON.parse(r.data_json));
  }

  addAlert(alert: MarketAlert) {
    this.saveAlertsToDb([alert]);
  }
}
