import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAlertContext } from '../contexts/AlertContext';
import { useWatchlistContext } from '../contexts/WatchlistContext';
import { getTrendingPairs } from '../services/dexscreenerClient';
import { DexToken } from '../services/dexscreenerClient';
import { TokenAlert, AlertType } from '../lib/useAlerts';

interface BannerItem {
  id: string;
  alert: TokenAlert;
  currentValue: number;
}

function formatValue(type: AlertType, value: number): string {
  if (type === 'price') {
    if (value < 0.0001) return `$${value.toExponential(2)}`;
    if (value < 1) return `$${value.toFixed(6)}`;
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  }
  if (type === 'volume_24h') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
  if (type === 'price_change_1h') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
  return String(value);
}

function getTokenCurrentValue(token: DexToken, type: AlertType): number {
  switch (type) {
    case 'price': return token.price;
    case 'volume_24h': return token.volume.h24;
    case 'price_change_1h': return token.priceChange.h1;
    default: return 0;
  }
}

const CHECK_INTERVAL = 30_000; // 30s
const DISMISS_DELAY = 10_000; // 10s

export const AlertChecker: React.FC = () => {
  const { alerts, checkAlerts } = useAlertContext();
  const { liveData } = useWatchlistContext();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissBanner = useCallback((bannerId: string) => {
    setBanners(prev => prev.filter(b => b.id !== bannerId));
    const t = timerRefs.current.get(bannerId);
    if (t) {
      clearTimeout(t);
      timerRefs.current.delete(bannerId);
    }
  }, []);

  const runCheck = useCallback(async () => {
    // Gather all available tokens: watchlist live data + alpha hunter feed
    const watchlistTokens = Object.values(liveData);
    let extraTokens: DexToken[] = [];
    try {
      extraTokens = await getTrendingPairs();
    } catch {
      // silent
    }

    const allTokens = [...watchlistTokens, ...extraTokens];
    if (!allTokens.length) return;

    const newlyTriggered = checkAlerts(allTokens);

    if (newlyTriggered.length > 0) {
      const tokenMap = new Map<string, DexToken>();
      allTokens.forEach(t => {
        tokenMap.set(t.address.toLowerCase(), t);
        tokenMap.set(t.symbol.toLowerCase(), t);
      });

      const newBanners: BannerItem[] = newlyTriggered.map(alert => {
        const token =
          tokenMap.get(alert.tokenAddress.toLowerCase()) ||
          tokenMap.get(alert.tokenSymbol.toLowerCase());
        const currentValue = token ? getTokenCurrentValue(token, alert.type) : alert.threshold;
        return { id: `banner_${alert.id}_${Date.now()}`, alert, currentValue };
      });

      setBanners(prev => [...newBanners, ...prev]);

      // Auto-dismiss after 10s
      newBanners.forEach(b => {
        const t = setTimeout(() => dismissBanner(b.id), DISMISS_DELAY);
        timerRefs.current.set(b.id, t);
      });
    }
  }, [alerts, liveData, checkAlerts, dismissBanner]);

  // Run check every 30s
  useEffect(() => {
    runCheck();
    const interval = setInterval(runCheck, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [runCheck]);

  // Cleanup timers on unmount
  useEffect(() => {
    const refs = timerRefs.current;
    return () => {
      refs.forEach(t => clearTimeout(t));
    };
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col gap-1 pointer-events-none">
      <AnimatePresence>
        {banners.map(banner => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: -40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(239,68,68,0.5)',
                  '0 0 0 8px rgba(239,68,68,0)',
                  '0 0 0 0 rgba(239,68,68,0)',
                ],
              }}
              transition={{ duration: 1.2, repeat: 3, ease: 'easeOut' }}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-3 flex items-center justify-between shadow-lg border-b border-red-700"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-white shrink-0" />
                <span className="font-mono font-bold text-sm tracking-wide">
                  🚨 {banner.alert.tokenSymbol}{' '}
                  {banner.alert.type === 'price' ? 'price' :
                   banner.alert.type === 'volume_24h' ? 'volume (24h)' : '1h change'}{' '}
                  {banner.alert.condition}{' '}
                  {formatValue(banner.alert.type, banner.alert.threshold)} — current:{' '}
                  {formatValue(banner.alert.type, banner.currentValue)}
                </span>
              </div>
              <button
                onClick={() => dismissBanner(banner.id)}
                className="ml-4 text-white/80 hover:text-white transition-colors shrink-0"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
