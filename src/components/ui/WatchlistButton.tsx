import React from 'react';
import { Star } from 'lucide-react';
import { useWatchlistContext } from '../../contexts/WatchlistContext';
import { WatchlistEntry } from '../../lib/useWatchlist';
import { cn } from '../../lib/utils';

export type { WatchlistEntry };

interface WatchlistButtonProps {
  token: WatchlistEntry;
  size?: number;
  className?: string;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({ token, size = 14, className }) => {
  const { isWatched, addToken, removeToken } = useWatchlistContext();
  const watched = isWatched(token.address);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (watched) {
      removeToken(token.address);
    } else {
      addToken(token);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      className={cn(
        'p-1 rounded transition-all',
        watched
          ? 'text-amber-500 hover:text-amber-600'
          : 'text-slate-300 hover:text-amber-400',
        className
      )}
    >
      <Star
        size={size}
        className={cn(
          'transition-all',
          watched ? 'fill-amber-400' : 'fill-transparent'
        )}
      />
    </button>
  );
};
