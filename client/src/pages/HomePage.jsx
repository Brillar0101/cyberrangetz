import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/* ─── Typing animation hook ─── */
function useTypingEffect(lines, speed = 40) {
  const [displayed, setDisplayed] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentLine >= lines.length) { setDone(true); return; }
    if (currentChar <= lines[currentLine].length) {
      const timeout = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev];
          next[currentLine] = lines[currentLine].slice(0, currentChar);
          return next;
        });
        setCurrentChar(c => c + 1);
      }, lines[currentLine][currentChar - 1] === '\n' ? 300 : speed);
      return () => clearTimeout(timeout);
    }
    const pause = setTimeout(() => {
      setCurrentLine(l => l + 1);
      setCurrentChar(0);
    }, 400);
    return () => clearTimeout(pause);
  }, [currentLine, currentChar, lines, speed]);

  return { displayed, done };
}

/* ─── Intersection observer hook for scroll reveal ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── Grid background SVG (rendered once) ─── */
function GridBg({ className = '' }) {
  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(27,35,50,0.5)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

/* ─── 3D render placeholder component ─── */
function RenderSlot({ width = 80, height = 80, label = '3D Render', className = '' }) {
  return (
    <div
      className={`flex items-center justify-center border-2 border-dashed border-cyber-border-light rounded-xl bg-cyber-darker/50 text-[10px] text-cyber-muted text-center leading-tight select-none flex-shrink-0 ${className}`}
      style={{ width, height }}
    >
      {label}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   HOMEPAGE
   ════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { user } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  const terminalLines = [
    '$ ping -c 4 10.0.0.2',
    'PING 10.0.0.2 (10.0.0.2) 56(84) bytes of data.',
    '64 bytes from 10.0.0.2: icmp_seq=1 ttl=64 time=0.45 ms',
    '64 bytes from 10.0.0.2: icmp_seq=2 ttl=64 time=0.38 ms',
    '64 bytes from 10.0.0.2: icmp_seq=3 ttl=64 time=0.41 ms',
    '64 bytes from 10.0.0.2: icmp_seq=4 ttl=64 time=0.39 ms',
    '',
    '--- 10.0.0.2 ping statistics ---',
    '4 packets transmitted, 4 received, 0% packet loss',
    '$ fping -a -g 10.0.0.0/24 2>/dev/null',
    '10.0.0.1',
    '10.0.0.2',
    '10.0.0.10',
    '$ curl http://10.0.0.2/flag.txt',
    'FLAG{ping_sweep_1142}',
  ];
  const { displayed, done } = useTypingEffect(terminalLines, 25);

  /* scroll reveal refs */
  const [statsRef, statsVis] = useReveal();
  const [featRef, featVis] = useReveal();
  const [pathRef, pathVis] = useReveal();
  const [termRef, termVis] = useReveal();
  const [ctaRef, ctaVis] = useReveal();

  const features = [
    { title: 'Learn by Doing', desc: 'Every lesson drops you into a real Linux terminal. No slides, no videos — just you and the command line.', slot: '3D: Terminal' },
    { title: 'Guided for All Levels', desc: 'Step-by-step instructions take you from absolute beginner to advanced techniques within each lab.', slot: '3D: Ladder' },
    { title: 'Red Team vs Blue Team', desc: 'Attack a network, then switch sides and defend it. Understand both perspectives of cybersecurity.', slot: '3D: Shield & Sword' },
    { title: 'Real Linux Terminals', desc: 'Each lab spins up a real Docker container with real tools — ping, nmap, fping, tcpdump, and more.', slot: '3D: Container' },
    { title: 'Tanzanian Context', desc: 'Built specifically for university students in Tanzania. Local relevance, global skills.', slot: '3D: TZ Flag' },
    { title: 'Track Your Progress', desc: 'Complete labs, capture flags, and unlock the next module. Watch your skills grow across the full pentest lifecycle.', slot: '3D: Trophy' },
  ];

  const modules = [
    { num: 1, title: 'Linux Fundamentals', labs: 5, active: true, color: 'tz-green' },
    { num: 2, title: 'Network Reconnaissance', labs: 10, active: false, color: 'tz-green' },
    { num: 3, title: 'Scanning & Enumeration', labs: 14, active: false, color: 'tz-blue' },
    { num: 4, title: 'Exploitation', labs: 14, active: false, color: 'red-500' },
    { num: 5, title: 'Post-Exploitation', labs: 14, active: false, color: 'tz-yellow' },
    { num: 6, title: 'Covering Tracks', labs: 12, active: false, color: 'cyber-muted' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark text-white overflow-x-hidden">

      {/* ── TZ Stripe ── */}
      <div className="tz-stripe-bar" />

      {/* ══════════════════════════════════════════
          NAVBAR
          ══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-cyber-border bg-cyber-darker/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tz-green to-tz-blue flex items-center justify-center shadow-glow-green group-hover:shadow-glow-blue">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-tz-green">Cyber</span><span className="text-white">Range</span>{' '}<span className="text-tz-blue">TZ</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-cyber-muted hover:text-white">Features</a>
            <a href="#path" className="text-sm text-cyber-muted hover:text-white">Modules</a>
            <a href="#terminal" className="text-sm text-cyber-muted hover:text-white">Preview</a>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="text-sm font-semibold text-white bg-gradient-to-r from-tz-green to-tz-green-light px-5 py-2 rounded-lg hover:shadow-glow-green">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-cyber-muted hover:text-white border border-cyber-border hover:border-cyber-border-light px-4 py-2 rounded-lg">
                  Log In
                </Link>
                <Link to="/register" className="text-sm font-semibold text-white bg-gradient-to-r from-tz-green to-tz-green-light px-5 py-2 rounded-lg hover:shadow-glow-green">
                  Join for Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-cyber-muted hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {mobileMenu
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-cyber-border bg-cyber-darker px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm text-cyber-muted hover:text-white" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#path" className="block text-sm text-cyber-muted hover:text-white" onClick={() => setMobileMenu(false)}>Modules</a>
            <a href="#terminal" className="block text-sm text-cyber-muted hover:text-white" onClick={() => setMobileMenu(false)}>Preview</a>
            <div className="pt-3 border-t border-cyber-border flex gap-3">
              {user ? (
                <Link to="/dashboard" className="flex-1 text-center text-sm font-semibold text-white bg-gradient-to-r from-tz-green to-tz-green-light px-4 py-2 rounded-lg">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1 text-center text-sm text-cyber-muted border border-cyber-border px-4 py-2 rounded-lg">Log In</Link>
                  <Link to="/register" className="flex-1 text-center text-sm font-semibold text-white bg-gradient-to-r from-tz-green to-tz-green-light px-4 py-2 rounded-lg">Join Free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════
          HERO
          ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background layers */}
        <GridBg className="opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-tz-green/[0.04] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-tz-blue/[0.03] blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-tz-green/10 border border-tz-green/20 rounded-full px-4 py-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-tz-green animate-pulse" />
                <span className="text-tz-green text-xs font-semibold uppercase tracking-wider">Free for Tanzanian Students</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                Learn Cybersecurity{' '}
                <span className="relative">
                  <span className="text-tz-green">by Doing</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M2 6c40-4 80-4 196-2" stroke="#1EB53A" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </span>
              </h1>

              <p className="text-lg text-cyber-muted leading-relaxed mb-8 max-w-xl">
                Hands-on offensive & defensive security training built for Tanzanian students. Hack machines, defend networks, and build real skills — all from your browser.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <input
                  type="email"
                  placeholder="student@university.ac.tz"
                  className="flex-1 bg-cyber-darker border border-cyber-border rounded-xl px-5 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-tz-green sm:max-w-xs"
                />
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-tz-green to-tz-green-light text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-glow-green text-center"
                >
                  Join for Free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              {/* Bullet points */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {['Beginner friendly', 'Guided labs', 'Red & Blue team', 'Free access'].map(item => (
                  <span key={item} className="flex items-center gap-2 text-sm text-cyber-muted">
                    <svg className="w-4 h-4 text-tz-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — 3D render placeholder */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-tz-green/10 rounded-3xl blur-3xl scale-110" />
                <RenderSlot
                  width={400}
                  height={400}
                  label={"3D Hero Image\n\nAdd your render here\n(e.g. hacker character,\nshield, or laptop)"}
                  className="relative !rounded-3xl !border-cyber-border-light"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
          ══════════════════════════════════════════ */}
      <section ref={statsRef} className="relative border-y border-cyber-border bg-cyber-card/60">
        <div className={`max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-700 ${statsVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { value: '69', label: 'Labs Available' },
            { value: '6', label: 'Learning Modules' },
            { value: '5', label: 'Skill Levels' },
            { value: '100%', label: 'Free' },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-3xl sm:text-4xl font-black text-tz-green tracking-tight">{stat.value}</div>
              <div className="text-sm text-cyber-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
          ══════════════════════════════════════════ */}
      <section id="features" ref={featRef} className="relative py-24">
        <GridBg className="opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Real-world offensive & defensive training
            </h2>
            <div className="mx-auto w-16 h-1 rounded-full bg-tz-green mb-6" />
            <p className="text-cyber-muted max-w-2xl mx-auto leading-relaxed">
              Access hands-on labs and learning modules suited to all levels — from the complete beginner to the experienced security student. CyberRange TZ makes learning engaging, practical, and free.
            </p>
          </div>

          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 ${featVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group bg-cyber-card border border-cyber-border rounded-2xl p-7 hover:border-tz-green/30 hover:bg-cyber-card-hover"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <RenderSlot width={72} height={72} label={f.slot} className="mb-5 group-hover:border-tz-green/40" />
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-cyber-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LEARNING PATH
          ══════════════════════════════════════════ */}
      <section id="path" ref={pathRef} className="relative py-24 border-t border-cyber-border bg-cyber-darker/50">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] -translate-y-1/2 rounded-full bg-tz-blue/[0.03] blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Follow the Penetration Testing Path
            </h2>
            <div className="mx-auto w-16 h-1 rounded-full bg-tz-blue mb-6" />
            <p className="text-cyber-muted max-w-2xl mx-auto leading-relaxed">
              Master the full attack lifecycle — from Linux basics through exploitation to covering tracks. Each module unlocks the next as you progress.
            </p>
          </div>

          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-all duration-700 ${pathVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {modules.map((m, i) => {
              const colorMap = {
                'tz-green': { bg: 'bg-tz-green/10', border: 'border-tz-green/25', text: 'text-tz-green', glow: 'hover:shadow-glow-green' },
                'tz-blue': { bg: 'bg-tz-blue/10', border: 'border-tz-blue/25', text: 'text-tz-blue', glow: 'hover:shadow-glow-blue' },
                'red-500': { bg: 'bg-red-500/10', border: 'border-red-500/25', text: 'text-red-400', glow: '' },
                'tz-yellow': { bg: 'bg-tz-yellow/10', border: 'border-tz-yellow/25', text: 'text-tz-yellow', glow: 'hover:shadow-glow-yellow' },
                'cyber-muted': { bg: 'bg-cyber-muted/10', border: 'border-cyber-muted/25', text: 'text-cyber-muted', glow: '' },
              };
              const c = colorMap[m.color] || colorMap['tz-green'];

              return (
                <div
                  key={m.num}
                  className={`group bg-cyber-card border border-cyber-border rounded-2xl p-6 hover:border-opacity-60 ${c.glow} ${m.active ? 'ring-1 ring-tz-green/30' : ''}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <RenderSlot width={56} height={56} label={`3D:\nMod ${m.num}`} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>Module {m.num}</span>
                        {m.active && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-tz-green/15 text-tz-green border border-tz-green/20 px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold mb-2 truncate">{m.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border} border px-2.5 py-1 rounded-lg`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" clipRule="evenodd" />
                          </svg>
                          {m.labs} labs
                        </span>
                        {!m.active && (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-tz-green hover:text-tz-green-light"
            >
              Start the path — it's free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TERMINAL PREVIEW
          ══════════════════════════════════════════ */}
      <section id="terminal" ref={termRef} className="relative py-24 border-t border-cyber-border">
        <GridBg className="opacity-15" />
        <div className={`relative max-w-7xl mx-auto px-6 transition-all duration-700 ${termVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Terminal window */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden border border-cyber-border shadow-2xl">
                {/* Title bar */}
                <div className="bg-cyber-card border-b border-cyber-border px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-tz-yellow/70" />
                    <div className="w-3 h-3 rounded-full bg-tz-green/70" />
                  </div>
                  <span className="text-xs text-cyber-muted ml-2 font-mono">root@cyberrange:~</span>
                </div>
                {/* Terminal body */}
                <div className="bg-cyber-darker p-5 font-mono text-sm leading-relaxed h-[360px] overflow-hidden">
                  {displayed.map((line, i) => (
                    <div key={i} className={`${line?.startsWith('$') ? 'text-tz-green font-semibold' : line?.startsWith('FLAG') ? 'text-tz-yellow font-bold' : 'text-cyber-muted'} ${line === '' ? 'h-4' : ''}`}>
                      {line}
                      {i === displayed.length - 1 && !done && (
                        <span className="inline-block w-2 h-4 bg-tz-green ml-0.5 animate-pulse" />
                      )}
                    </div>
                  ))}
                  {done && (
                    <div className="text-tz-green mt-1">
                      $ <span className="inline-block w-2 h-4 bg-tz-green ml-0.5 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
                Hands-on hacking for all skill levels
              </h2>
              <div className="w-16 h-1 rounded-full bg-tz-green mb-6" />
              <p className="text-cyber-muted leading-relaxed mb-6">
                Learn cybersecurity with real gamified labs and challenges. Every lesson gives you a real terminal — type real commands, see real results.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Exercises in every lesson', desc: 'Run commands and answer questions to prove your understanding.' },
                  { title: 'Beginner-friendly', desc: 'Each step explains what the command does and why it matters.' },
                  { title: 'Capture the flag', desc: 'Find hidden flags to complete labs and unlock the next challenge.' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-tz-green/15 border border-tz-green/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-tz-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{item.title}</h4>
                      <p className="text-sm text-cyber-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
          ══════════════════════════════════════════ */}
      <section ref={ctaRef} className="relative py-24 border-t border-cyber-border overflow-hidden">
        {/* Floating dots */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { top: '20%', left: '10%', size: 6, opacity: 0.4, delay: '0s' },
            { top: '60%', left: '25%', size: 4, opacity: 0.3, delay: '1s' },
            { top: '30%', left: '80%', size: 8, opacity: 0.5, delay: '0.5s' },
            { top: '70%', left: '70%', size: 5, opacity: 0.35, delay: '1.5s' },
            { top: '50%', left: '50%', size: 3, opacity: 0.25, delay: '2s' },
            { top: '15%', left: '60%', size: 6, opacity: 0.3, delay: '0.8s' },
          ].map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-tz-green animate-pulse"
              style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size, opacity: dot.opacity, animationDelay: dot.delay }}
            />
          ))}
        </div>

        <div className={`relative max-w-2xl mx-auto px-6 text-center transition-all duration-700 ${ctaVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
            Ready to start learning cybersecurity?
          </h2>
          <p className="text-cyber-muted mb-8">
            Join CyberRange TZ and start your cybersecurity journey today. No payment required — just create an account and start hacking.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-tz-green to-tz-green-light text-white font-bold px-10 py-4 rounded-xl text-lg hover:shadow-glow-green"
          >
            Join for Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════ */}
      <footer className="border-t border-cyber-border bg-cyber-darker">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Brand */}
            <div className="text-center md:text-left">
              <div className="text-lg font-bold tracking-tight mb-1">
                <span className="text-tz-green">Cyber</span><span className="text-white">Range</span>{' '}<span className="text-tz-blue">TZ</span>
              </div>
              <p className="text-sm text-cyber-muted">Built for Tanzanian university students</p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-cyber-muted hover:text-white">About</a>
              <a href="#" className="text-sm text-cyber-muted hover:text-white">GitHub</a>
              <a href="#" className="text-sm text-cyber-muted hover:text-white">Contact</a>
            </div>
          </div>

          {/* TZ flag bar */}
          <div className="mt-8 pt-6 border-t border-cyber-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-8 h-1 rounded-full bg-tz-green/40" />
                <div className="w-8 h-1 rounded-full bg-tz-yellow/40" />
                <div className="w-3 h-1 rounded-full bg-black" />
                <div className="w-8 h-1 rounded-full bg-tz-blue/40" />
              </div>
              <span className="text-xs text-gray-600 ml-1">Tanzania</span>
            </div>
            <p className="text-xs text-gray-600">CyberRange TZ — Cybersecurity Training Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
