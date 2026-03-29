import { useState, useCallback } from 'react';
import { DexToken } from '../services/dexscreenerClient';

export type AlertCondition = 'above' | 'below';
export type AlertType = 'price' | 'volume_24h' | 'price_change_1h';

export interface TokenAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: AlertType;
  condition: AlertCondition;
  threshold: number;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

const STORAGE_KEY = 'splashsignal.alerts.v1';

function loadAlerts(): TokenAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: TokenAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // silent fail
  }
}

function getTokenValue(token: DexToken, type: AlertType): number {
  switch (type) {
    case 'price':
      return token.price;
    case 'volume_24h':
      return token.volume.h24;
    case 'price_change_1h':
      return token.priceChange.h1;
    default:
      return 0;
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<TokenAlert[]>(() => loadAlerts());

  const addAlert = useCallback((alert: Omit<TokenAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: TokenAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    setAlerts(prev => {
      const next = [newAlert, ...prev];
      saveAlerts(next);
      return next;
    });
    return newAlert.id;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const next = prev.filter(a => a.id !== id);
      saveAlerts(next);
      return next;
    });
  }, []);

  const checkAlerts = useCallback((tokens: DexToken[]): TokenAlert[] => {
    const tokenMap = new Map<string, DexToken>();
    tokens.forEach(t => {
      tokenMap.set(t.address.toLowerCase(), t);
      tokenMap.set(t.symbol.toLowerCase(), t);
    });

    const triggered: TokenAlert[] = [];

    setAlerts(prev => {
      let changed = false;
      const next = prev.map(alert => {
        if (alert.triggered) return alert;

        const token =
          tokenMap.get(alert.tokenAddress.toLowerCase()) ||
          tokenMap.get(alert.tokenSymbol.toLowerCase());

        if (!token) return alert;

        const currentValue = getTokenValue(token, alert.type);
        const isTriggered =
          alert.condition === 'above'
            ? currentValue > alert.threshold
            : currentValue < alert.threshold;

        if (isTriggered) {
          changed = true;
          const updated: TokenAlert = {
            ...alert,
            triggered: true,
            triggeredAt: new Date().toISOString(),
          };
          triggered.push(updated);
          return updated;
        }
        return alert;
      });

      if (changed) {
        saveAlerts(next);
        return next;
      }
      return prev;
    });

    return triggered;
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts(prev => {
      const next = prev.map(a => ({ ...a, triggered: false, triggeredAt: undefined }));
      saveAlerts(next);
      return next;
    });
  }, []);

  return { alerts, addAlert, removeAlert, checkAlerts, clearTriggered };
}
