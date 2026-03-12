import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const api = authApi(token);

  useEffect(() => {
    api('/api/labs')
      .then(data => { setModules(data.modules); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  function handleLabClick(lab) {
    if (lab.locked || lab.steps.length === 0) return;
    navigate(`/lab/${lab.id}`);
  }

  function getLabBadge(lab) {
    if (lab.type === 'red') return { label: 'Red Team — Attack', cls: 'bg-red-500/15 text-red-400 border-red-500/20' };
    if (lab.type === 'blue') return { label: 'Blue Team — Defend', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' };
    return { label: 'Learn', cls: 'bg-tz-green/15 text-tz-green border-tz-green/20' };
  }

  function getLabIcon(lab) {
    if (lab.type === 'red') return (
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    );
    if (lab.type === 'blue') return (
      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
    );
    return (
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    );
  }

  function getModuleDescription(moduleName) {
    if (moduleName === 'Network Reconnaissance') {
      return 'Learn how attackers scan networks and how defenders detect and block them. Complete the Red team lab to unlock the Blue team defense.';
    }
    if (moduleName === 'Linux Fundamentals') {
      return 'Master essential Linux commands — navigate the filesystem, process text, manage permissions, and control processes. Complete each lab to unlock the next.';
    }
    if (moduleName === 'Scanning & Enumeration') {
      return 'Discover live hosts, open ports, and running services. Use tools like nmap to map out target networks and identify vulnerabilities.';
    }
    if (moduleName === 'Exploitation') {
      return 'Leverage discovered vulnerabilities to gain unauthorized access. Learn to use exploit frameworks and craft payloads.';
    }
    if (moduleName === 'Post-Exploitation') {
      return 'Escalate privileges, move laterally, and establish persistence after gaining initial access to a target system.';
    }
    if (moduleName === 'Covering Tracks') {
      return 'Understand how attackers hide their presence by clearing logs, modifying timestamps, and removing artifacts.';
    }
    return '';
  }

  function getLabDescription(lab) {
    const descriptions = {
      // Linux Fundamentals
      'linux-nav': 'Learn pwd, ls, cd, mkdir, cp, mv, rm, find — the essential commands for navigating and managing files.',
      'linux-text': 'Master cat, grep, head, tail, pipes, and redirection — the tools for reading, searching, and processing text.',
      'linux-perms': 'Understand file permissions (rwx), chmod, chown, and ownership — critical for Linux security.',
      'linux-system': 'Use ps, kill, free, df, uname — monitor system resources and manage running processes.',
      'linux-bash': 'Write bash scripts with variables, conditionals, and loops — automate tasks like a pro.',
      // Network Reconnaissance
      'recon-ping-sweep': 'Use ping and fping to discover live hosts on a target network. Learn to interpret TTL values and handle filtered hosts.',
      'recon-detect-icmp': 'Analyze network captures with tcpdump and grep to detect ICMP sweep patterns and identify the attacker.',
      'recon-port-scan': 'Use nmap to discover open ports and running services on target hosts.',
      'recon-detect-port-scan': 'Detect port scanning activity in system logs using snort and syslog analysis.',
      'recon-service-version': 'Probe open ports with nmap -sV to identify exact service versions running on targets.',
      'recon-identify-services': 'Audit your network for exposed service versions and assess the risk they present.',
      'recon-os-fingerprint': 'Use nmap -O to identify the operating system running on remote hosts.',
      'recon-harden-banner': 'Harden OS and service banners to prevent attackers from fingerprinting your systems.',
      'recon-stealth-syn': 'Perform stealthy SYN scans that avoid completing the TCP handshake to evade detection.',
      'recon-detect-stealth': 'Configure IDS rules with snort and tcpdump to detect stealthy SYN scan patterns.',
    };
    if (descriptions[lab.id]) return descriptions[lab.id];
    if (lab.type === 'red') return 'Attack the target environment using the specified tools and techniques.';
    if (lab.type === 'blue') return 'Defend the environment by detecting, analyzing, and responding to the attack.';
    return 'Complete the guided steps and finish the challenge.';
  }

  function getLockMessage(lab) {
    if (lab.type === 'blue') return 'Complete Red lab first';
    return 'Complete previous lab first';
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="tz-stripe-bar" />

      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-darker/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-tz-green">Cyber</span><span className="text-white">Range</span> <span className="text-tz-blue">TZ</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tz-green to-tz-blue flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-cyber-muted text-sm hidden sm:inline">{user?.name}</span>
            </div>
            <button onClick={logout}
              className="text-cyber-muted hover:text-white text-sm border border-cyber-border px-3 py-1.5 rounded-lg hover:border-cyber-border-light">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1">
        {loading ? (
          <div className="text-center text-tz-green animate-pulse text-lg py-20">Loading modules...</div>
        ) : (
          <div className="space-y-14">
            {modules.map((mod, modIndex) => (
              <section key={mod.module}>
                {/* Module header */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-tz-green/10 border border-tz-green/20 rounded-full px-4 py-1.5 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-tz-green animate-pulse" />
                    <span className="text-tz-green text-xs font-semibold uppercase tracking-wider">Module {modIndex + 1}</span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">{mod.module}</h2>
                  <p className="text-cyber-muted mt-2 max-w-lg">
                    {getModuleDescription(mod.module)}
                  </p>
                </div>

                {/* Lab cards or Coming Soon */}
                {mod.labs.length === 0 ? (
                  <div className="border border-dashed border-cyber-border rounded-2xl p-8 text-center">
                    <div className="text-cyber-muted text-sm font-medium">Coming Soon</div>
                    <p className="text-gray-600 text-xs mt-1">Labs for this module are under development.</p>
                  </div>
                ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {mod.labs.map(lab => {
                    const badge = getLabBadge(lab);
                    const borderColor = lab.locked
                      ? 'border-cyber-border'
                      : lab.completed
                        ? 'border-tz-green/40'
                        : lab.type === 'red' ? 'border-red-500/30'
                        : lab.type === 'blue' ? 'border-tz-blue/30'
                        : 'border-tz-green/30';

                    const gradientColor = lab.type === 'red' ? 'from-red-500/5'
                      : lab.type === 'blue' ? 'from-blue-500/5'
                      : 'from-green-500/5';

                    const accentColor = lab.completed ? 'text-tz-green'
                      : lab.type === 'red' ? 'text-red-400'
                      : lab.type === 'blue' ? 'text-tz-blue'
                      : 'text-tz-green';

                    return (
                      <div key={lab.id} onClick={() => handleLabClick(lab)}
                        className={`group bg-cyber-card border ${borderColor} rounded-2xl p-6 relative overflow-hidden ${
                          lab.locked || lab.steps.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-cyber-card-hover hover:shadow-lg'
                        }`}>

                        {!lab.locked && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} to-transparent opacity-0 group-hover:opacity-100`} />
                        )}

                        <div className="relative">
                          <div className="flex items-center justify-between mb-5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${badge.cls}`}>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                {getLabIcon(lab)}
                              </svg>
                              {badge.label}
                            </span>

                            {lab.completed && (
                              <span className="flex items-center gap-1 text-tz-green text-xs font-semibold bg-tz-green/10 px-2.5 py-1 rounded-lg">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Done
                              </span>
                            )}
                            {lab.locked && (
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          <h3 className="text-xl font-bold mb-2">{lab.title}</h3>
                          <p className="text-cyber-muted text-sm mb-5 leading-relaxed">
                            {getLabDescription(lab)}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-cyber-border">
                            <span className="text-gray-600 text-xs font-medium">{lab.steps.length > 0 ? `${lab.steps.length} guided steps` : 'Coming soon'}</span>
                            {lab.locked ? (
                              <span className="text-gray-600 text-xs">{getLockMessage(lab)}</span>
                            ) : lab.steps.length === 0 ? (
                              <span className="text-gray-600 text-xs">Coming soon</span>
                            ) : (
                              <span className={`text-sm font-semibold ${accentColor} group-hover:translate-x-1 inline-flex items-center gap-1`}>
                                {lab.completed ? 'Review' : 'Start Lab'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </section>
            ))}

            {/* TZ flag color bar at bottom */}
            <div className="mt-12 flex items-center justify-center gap-3 text-xs text-gray-600">
              <div className="flex gap-1">
                <div className="w-8 h-1 rounded-full bg-tz-green/30" />
                <div className="w-8 h-1 rounded-full bg-tz-yellow/30" />
                <div className="w-8 h-1 rounded-full bg-tz-blue/30" />
              </div>
              <span>CyberRange TZ</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
