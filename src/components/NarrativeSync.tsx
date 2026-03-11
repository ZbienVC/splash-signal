import React, { useEffect } from 'react';
import { discoverNarratives, syncNarrativesToServer } from '../services/narrativeDiscoveryService';

export const NarrativeSync: React.FC = () => {
  useEffect(() => {
    const sync = async () => {
      console.log('[NarrativeSync] Starting discovery cycle...');
      const narratives = await discoverNarratives();
      if (narratives.length > 0) {
        console.log(`[NarrativeSync] Discovered ${narratives.length} narratives, syncing to server...`);
        await syncNarrativesToServer(narratives);
      }
    };

    // Sync on mount
    sync();

    // Sync every 15 minutes
    const interval = setInterval(sync, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null; // Background component
};
