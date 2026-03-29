import React, { createContext, useContext } from 'react';
import { useAlerts, TokenAlert, AlertType, AlertCondition } from '../lib/useAlerts';

interface AlertContextValue {
  alerts: TokenAlert[];
  addAlert: (alert: Omit<TokenAlert, 'id' | 'createdAt' | 'triggered'>) => string;
  removeAlert: (id: string) => void;
  checkAlerts: (tokens: import('../services/dexscreenerClient').DexToken[]) => TokenAlert[];
  clearTriggered: () => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const alerts = useAlerts();
  return (
    <AlertContext.Provider value={alerts}>
      {children}
    </AlertContext.Provider>
  );
};

export function useAlertContext(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlertContext must be used inside AlertProvider');
  return ctx;
}
