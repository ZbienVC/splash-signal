import React from 'react';
import { Waves, Flame, AlertTriangle, Trophy } from 'lucide-react';

interface LandingProps {
  onLaunch: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-slate-900">Splash Signal</span>
          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium ml-1">Beta</span>
        </div>
        <button
          onClick={onLaunch}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Launch App →
        </button>
      </nav>

      {/* HERO */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-live" />
          Real-time crypto intelligence
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
          Find alpha early.<br />
          <span className="text-blue-600">Avoid the dump.</span>
        </h1>

        {/* Sub */}
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Splash Signal detects early-stage momentum, tracks smart wallet behavior,
          and warns you before coordinated sell-offs happen.
        </p>

        {/* CTA */}
        <button
          onClick={onLaunch}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          Launch App — Free →
        </button>
        <p className="text-slate-400 text-sm mt-3">No account required to explore</p>
      </section>

      {/* 3 FEATURES */}
      <section className="px-6 py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Flame className="w-6 h-6 text-green-600" />,
              iconBg: 'bg-green-50',
              title: 'Alpha Hunter',
              description: 'Discover early-stage tokens with strong momentum, smart wallet participation, and favorable on-chain behavior before the crowd.',
            },
            {
              icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
              iconBg: 'bg-red-50',
              title: 'Dump Detector',
              description: 'Identify coordinated selling, whale exits, dev activity, and liquidity deterioration before price breaks down.',
            },
            {
              icon: <Trophy className="w-6 h-6 text-blue-600" />,
              iconBg: 'bg-blue-50',
              title: 'Smart Wallets',
              description: 'Track high-performing wallets ranked by win rate and entry timing. Get alerted when top wallets enter or exit positions.',
            },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNAL EXAMPLE */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">What signals look like</h2>
          <p className="text-slate-500">Real-time alerts with context, confidence, and suggested action</p>
        </div>

        {/* Mock signal cards */}
        <div className="space-y-2 max-w-2xl mx-auto">
          {[
            { dot: 'bg-green-500', type: 'ENTRY', typeColor: 'text-green-600', token: '$PEPE2', desc: '3 smart wallets entered + volume up 847% in 1h', conf: '87%', time: '2m ago' },
            { dot: 'bg-red-500',   type: 'EXIT',  typeColor: 'text-red-600',   token: '$MOON',  desc: 'Dev sold $12K, top 3 holders reducing positions', conf: '91%', time: '5m ago' },
            { dot: 'bg-amber-500', type: 'WATCH', typeColor: 'text-amber-600', token: '$WIF2',  desc: 'Smart wallet entered at $89K MC — monitor for follow-through', conf: '72%', time: '12m ago' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm">
              <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
              <span className={`font-mono font-medium w-12 flex-shrink-0 ${s.typeColor}`}>{s.type}</span>
              <span className="font-medium text-slate-900 w-16 flex-shrink-0">{s.token}</span>
              <span className="text-slate-500 flex-1 truncate">{s.desc}</span>
              <span className="text-slate-400 flex-shrink-0">{s.conf}</span>
              <span className="text-slate-400 flex-shrink-0">{s.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-6 py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Start finding alpha now</h2>
        <p className="text-blue-200 mb-8 max-w-lg mx-auto">Free to use. No wallet connection required. Real-time Solana data.</p>
        <button
          onClick={onLaunch}
          className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
        >
          Launch Splash Signal →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 px-6 py-8 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-500" />
            <span>Splash Signal</span>
            <span>·</span>
            <span>Beta</span>
          </div>
          <span>Not financial advice. DYOR.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
