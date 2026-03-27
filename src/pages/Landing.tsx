import React from 'react';
import { Waves, Flame, AlertTriangle, Trophy } from 'lucide-react';

interface LandingProps {
  onLaunch: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="border-b border-slate-100 px-6 py-3.5 flex items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">Splash<span className="text-blue-600">Signal</span></span>
          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium ml-1">Beta</span>
        </div>
        <button
          onClick={onLaunch}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm shadow-blue-500/20"
        >
          Launch App →
        </button>
      </nav>

      {/* HERO */}
      <section className="relative px-6 py-24 text-center max-w-4xl mx-auto overflow-hidden">
        {/* Background gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-blue-100/60 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full"
            style={{background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)'}} />
          <div className="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] rounded-full"
            style={{background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)'}} />
        </div>

        <div className="relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-live" />
            Real-time crypto intelligence
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
            Find alpha early.<br />
            <span className="text-gradient-blue">Avoid the dump.</span>
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
        </div>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-slate-200 bg-slate-50/50 py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-12 flex-wrap">
          {[
            { value: 'Free', label: 'No API key needed' },
            { value: 'Real-time', label: 'DexScreener data' },
            { value: 'Solana', label: 'Focused chain' },
            { value: 'Open', label: 'No wallet required' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-bold text-slate-900 text-sm">{stat.value}</p>
              <p className="text-slate-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3 FEATURES */}
      <section className="px-6 py-16 bg-slate-50 border-b border-slate-200">
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
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden card-hover">
              {/* Blue gradient accent at top */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
              <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Scan new tokens', desc: 'DexScreener feeds new Solana pairs in real-time. We score each one instantly.' },
            { step: '02', title: 'Score & rank', desc: 'Alpha and dump risk scores computed from volume, holders, wallet behavior, and on-chain data.' },
            { step: '03', title: 'Get signals', desc: 'Entry, exit, and watch signals generated when conditions align. Act before the crowd.' },
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
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
            <div key={i} className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm card-hover cursor-default border-l-4"
              style={{borderLeftColor: s.dot === 'bg-green-500' ? '#16a34a' : s.dot === 'bg-red-500' ? '#dc2626' : '#d97706'}}>
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
      <section
        className="relative px-6 py-20 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1e40af 100%)' }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Start finding alpha now</h2>
          <p className="text-blue-200 mb-8 max-w-lg mx-auto">Free to use. Real-time Solana data via DexScreener.</p>
          <button
            onClick={onLaunch}
            className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-xl"
          >
            Launch Splash Signal →
          </button>
        </div>
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
