import React, { useState } from 'react';
import { Bell, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAlertContext } from '../contexts/AlertContext';
import { useWatchlistContext } from '../contexts/WatchlistContext';
import { TokenAlert, AlertType, AlertCondition } from '../lib/useAlerts';
import { cn } from '../lib/utils';

const TYPE_LABELS: Record<AlertType, string> = {
  price: 'Price (USD)',
  volume_24h: 'Volume 24h (USD)',
  price_change_1h: '1h Change (%)',
};

const TYPE_PLACEHOLDER: Record<AlertType, string> = {
  price: 'e.g. 0.0025',
  volume_24h: 'e.g. 500000',
  price_change_1h: 'e.g. 20',
};

interface AddAlertFormState {
  tokenAddress: string;
  tokenSymbol: string;
  type: AlertType;
  condition: AlertCondition;
  threshold: string;
}

const DEFAULT_FORM: AddAlertFormState = {
  tokenAddress: '',
  tokenSymbol: '',
  type: 'price',
  condition: 'above',
  threshold: '',
};

export const AlertsPanel: React.FC = () => {
  const { alerts, addAlert, removeAlert, clearTriggered } = useAlertContext();
  const { entries } = useWatchlistContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddAlertFormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleWatchlistSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setForm(prev => ({ ...prev, tokenAddress: '', tokenSymbol: '' }));
      return;
    }
    const entry = entries.find(en => en.address === val);
    if (entry) {
      setForm(prev => ({ ...prev, tokenAddress: entry.address, tokenSymbol: entry.symbol }));
    }
  };

  const handleSave = () => {
    setFormError('');
    const addr = form.tokenAddress.trim();
    const sym = form.tokenSymbol.trim();
    if (!addr && !sym) {
      setFormError('Enter a token address or symbol.');
      return;
    }
    const threshold = parseFloat(form.threshold);
    if (isNaN(threshold)) {
      setFormError('Enter a valid numeric threshold.');
      return;
    }

    addAlert({
      tokenAddress: addr || sym,
      tokenSymbol: sym || addr,
      type: form.type,
      condition: form.condition,
      threshold,
    });

    setForm(DEFAULT_FORM);
    setShowAddForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <div className="flex flex-col h-full p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Alert Thresholds</h1>
            <p className="text-xs text-slate-500">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} — {activeAlerts.length} active, {triggeredAlerts.length} triggered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {triggeredAlerts.length > 0 && (
            <button
              onClick={clearTriggered}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear triggered
            </button>
          )}
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Alert
          </button>
        </div>
      </div>

      {/* Saved confirmation */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Alert saved!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Alert Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">New Alert</h3>
                <button
                  onClick={() => { setShowAddForm(false); setFormError(''); setForm(DEFAULT_FORM); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Watchlist picker */}
                {entries.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Select from Watchlist</label>
                    <select
                      onChange={handleWatchlistSelect}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="">— or enter manually —</option>
                      {entries.map(e => (
                        <option key={e.address} value={e.address}>
                          {e.symbol} ({e.address.slice(0, 6)}…{e.address.slice(-4)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Token Address */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Token Address</label>
                    <input
                      type="text"
                      placeholder="0x... or contract address"
                      value={form.tokenAddress}
                      onChange={e => setForm(prev => ({ ...prev, tokenAddress: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {/* Token Symbol */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Token Symbol</label>
                    <input
                      type="text"
                      placeholder="e.g. WIF"
                      value={form.tokenSymbol}
                      onChange={e => setForm(prev => ({ ...prev, tokenSymbol: e.target.value.toUpperCase() }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Alert Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(prev => ({ ...prev, type: e.target.value as AlertType }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="price">Price</option>
                      <option value="volume_24h">Volume 24h</option>
                      <option value="price_change_1h">1h Change</option>
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Condition</label>
                    <select
                      value={form.condition}
                      onChange={e => setForm(prev => ({ ...prev, condition: e.target.value as AlertCondition }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                  </div>

                  {/* Threshold */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Threshold</label>
                    <input
                      type="number"
                      step="any"
                      placeholder={TYPE_PLACEHOLDER[form.type]}
                      value={form.threshold}
                      onChange={e => setForm(prev => ({ ...prev, threshold: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {formError}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  className="w-full py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Alert
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-16">
          <Bell className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">No alerts configured</p>
          <p className="text-xs mt-1">Click "Add Alert" to set price or volume thresholds</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Active</p>
              <div className="flex flex-col gap-2">
                {activeAlerts.map(alert => (
                  <AlertRow key={alert.id} alert={alert} onDelete={removeAlert} />
                ))}
              </div>
            </div>
          )}

          {/* Triggered Alerts */}
          {triggeredAlerts.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Triggered</p>
              </div>
              <div className="flex flex-col gap-2">
                {triggeredAlerts.map(alert => (
                  <AlertRow key={alert.id} alert={alert} onDelete={removeAlert} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface AlertRowProps {
  alert: TokenAlert;
  onDelete: (id: string) => void;
}

const AlertRow: React.FC<AlertRowProps> = ({ alert, onDelete }) => {
  const formatThreshold = () => {
    if (alert.type === 'price') {
      if (alert.threshold < 0.001) return alert.threshold.toExponential(2);
      return alert.threshold.toLocaleString(undefined, { maximumFractionDigits: 6 });
    }
    if (alert.type === 'volume_24h') {
      if (alert.threshold >= 1_000_000) return `${(alert.threshold / 1_000_000).toFixed(2)}M`;
      if (alert.threshold >= 1_000) return `${(alert.threshold / 1_000).toFixed(1)}K`;
      return alert.threshold.toLocaleString();
    }
    return `${alert.threshold}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'flex items-center justify-between bg-white border rounded-xl px-4 py-3 shadow-sm',
        alert.triggered ? 'border-orange-200 bg-orange-50' : 'border-slate-200'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-2 h-2 rounded-full shrink-0',
          alert.triggered ? 'bg-orange-500' : 'bg-green-500'
        )} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-slate-900">{alert.tokenSymbol}</span>
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              alert.triggered
                ? 'bg-orange-100 text-orange-700'
                : 'bg-green-100 text-green-700'
            )}>
              {alert.triggered ? 'TRIGGERED' : 'ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {TYPE_LABELS[alert.type]} {alert.condition}{' '}
            <span className="font-mono font-medium text-slate-700">
              {alert.type === 'price' ? '$' : alert.type === 'volume_24h' ? '$' : ''}{formatThreshold()}
            </span>
            {alert.triggered && alert.triggeredAt && (
              <span className="ml-2 text-orange-500">
                · triggered {new Date(alert.triggeredAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDelete(alert.id)}
        className="text-slate-300 hover:text-red-500 transition-colors ml-4 shrink-0"
        title="Delete alert"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
