import { useState, useEffect } from 'react';

function loadProgress(labId) {
  try {
    const saved = localStorage.getItem(`lab-progress-${labId}`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveProgress(labId, currentStep, results) {
  try {
    localStorage.setItem(`lab-progress-${labId}`, JSON.stringify({ currentStep, results }));
  } catch {}
}

export default function StepPanel({ steps, labType, onAllComplete, token, labId }) {
  const saved = loadProgress(labId);
  const [currentStep, setCurrentStep] = useState(saved?.currentStep ?? 0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(saved?.results ?? {});
  const [checking, setChecking] = useState(false);

  useEffect(() => { saveProgress(labId, currentStep, results); }, [labId, currentStep, results]);
  useEffect(() => { if (currentStep >= steps.length) onAllComplete?.(); }, []);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const allDone = currentStep >= steps.length;
  const isRed = labType === 'red';

  async function checkAnswer() {
    const answer = (answers[step.id] || '').trim();
    if (!answer) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/labs/${labId}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stepId: step.id, answer }),
      });
      const data = await res.json();
      setResults(r => ({ ...r, [step.id]: data.correct }));
    } catch {
      setResults(r => ({ ...r, [step.id]: false }));
    } finally { setChecking(false); }
  }

  function nextStep() {
    if (isLastStep) { setCurrentStep(steps.length); onAllComplete?.(); }
    else setCurrentStep(c => c + 1);
  }

  function copyCommand(cmd) {
    navigator.clipboard.writeText(cmd).catch(() => {});
  }

  if (allDone) return null;

  const accentBg = isRed ? 'bg-red-500/10 border-red-500/20' : 'bg-tz-blue/10 border-tz-blue/20';
  const progressColor = isRed ? 'bg-red-500' : 'bg-tz-blue';
  const btnColor = isRed ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-tz-blue to-blue-600';

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-cyber-muted font-medium text-xs uppercase tracking-wider">
          Step {currentStep + 1}/{steps.length}
        </span>
        <div className="flex-1 bg-cyber-dark rounded-full h-1.5 overflow-hidden">
          <div className={`h-1.5 rounded-full ${progressColor}`}
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%`, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Step title */}
      <h3 className="text-lg font-bold">{step.title}</h3>

      {/* Explanation */}
      <div className={`${accentBg} border rounded-xl p-4 text-sm leading-relaxed text-gray-300`}>
        {step.explanation}
      </div>

      {/* Command */}
      <div>
        <label className="text-xs text-cyber-muted uppercase tracking-wider mb-1.5 block font-medium">Command to run</label>
        <div className="bg-cyber-dark border border-cyber-border rounded-xl p-3.5 flex items-center justify-between group hover:border-cyber-border-light">
          <code className="text-tz-green text-sm font-mono">{step.command}</code>
          <button onClick={() => copyCommand(step.command)}
            className="text-cyber-muted hover:text-white text-xs px-2.5 py-1 rounded-lg border border-transparent hover:border-cyber-border opacity-0 group-hover:opacity-100 hover:bg-cyber-card">
            Copy
          </button>
        </div>
      </div>

      {/* Question + Answer */}
      <div>
        <label className="text-sm text-gray-300 mb-2 block font-medium">{step.question}</label>
        <div className="flex gap-2">
          <input type="text" value={answers[step.id] || ''}
            onChange={e => setAnswers(a => ({ ...a, [step.id]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && !results[step.id] && checkAnswer()}
            disabled={results[step.id] === true}
            className="flex-1 bg-cyber-dark border border-cyber-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tz-green placeholder:text-gray-600 disabled:opacity-50"
            placeholder="Type your answer..." />
          {results[step.id] !== true && (
            <button onClick={checkAnswer} disabled={checking || !(answers[step.id] || '').trim()}
              className="bg-tz-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-tz-green-light disabled:opacity-40">
              {checking ? '...' : 'Check'}
            </button>
          )}
        </div>

        {results[step.id] === true && (
          <p className="text-tz-green text-sm mt-2 flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Correct!
          </p>
        )}
        {results[step.id] === false && (
          <p className="text-red-400 text-sm mt-2 font-medium">Incorrect — try again.</p>
        )}
      </div>

      {/* Next Step */}
      {results[step.id] === true && (
        <button onClick={nextStep}
          className={`w-full py-3 rounded-xl font-semibold text-white ${btnColor} hover:shadow-lg`}>
          {isLastStep ? 'Finish Steps — Submit Flag' : 'Next Step →'}
        </button>
      )}
    </div>
  );
}
