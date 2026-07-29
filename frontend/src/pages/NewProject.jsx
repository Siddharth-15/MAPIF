// frontend/src/pages/NewProject.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, runPipeline } from '../api';
import api from '../api';
const agents = [
  { id: 1, name: "The Inquirer",  emoji: "🔍", desc: "Validating project details..."     },
  { id: 2, name: "The Analyst",   emoji: "📊", desc: "Researching market data..."        },
  { id: 3, name: "The Visionary", emoji: "📈", desc: "Generating analytics dashboard..."  },
  { id: 4, name: "The Navigator", emoji: "🗺️", desc: "Building roadmaps..."              },
  { id: 5, name: "The Guardian",  emoji: "🛡️", desc: "Assessing risks..."                },
  { id: 6, name: "The Advisor",   emoji: "💡", desc: "Writing advisory report..."        },
];

export default function NewProject() {
  const navigate = useNavigate();

  const [step,         setStep]         = useState('form');
  const [form,         setForm]         = useState({
    project_name:  '',
    industry:      '',
    target_market: '',
    objective:     '',
    budget:        '',
    timeline:      '',
  });
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [agentsDone,   setAgentsDone]   = useState([]);
  const [currentAgent, setCurrentAgent] = useState(0);
  const [projectId,    setProjectId]    = useState(null);  // ✅ state for navigation

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.project_name || !form.industry ||
        !form.target_market || !form.objective ||
        !form.budget || !form.timeline) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ FIX 1 — use 'form' not 'formData'
      const res = await createProject(form);
      console.log("Create response:", res.data);

      // ✅ FIX 2 — extract project ID safely and store in state
      const newProjectId =
        res.data?.data?.project?.id  ||
        res.data?.data?.project_id   ||
        res.data?.project?.id        ||
        res.data?.id;

      console.log("Extracted Project ID:", newProjectId);

      if (!newProjectId) {
        setError("Failed to get project ID from server. Please try again.");
        setLoading(false);
        return;
      }

      // ✅ FIX 3 — save to state so 'done' step can navigate
      setProjectId(newProjectId);

      // Switch to pipeline view
      setStep('pipeline');

      // Simulate agent progress UI
      for (let i = 0; i < agents.length; i++) {
        setCurrentAgent(i);
        await new Promise(r => setTimeout(r, 800));
      }

      // ✅ FIX 4 — use 'newProjectId' not 'pid'
      const pipelineRes = await runPipeline(newProjectId, form);

      if (pipelineRes.data.success) {
        setAgentsDone(agents.map(a => a.id));
        setCurrentAgent(agents.length);
        setStep('done');
      } else {
        throw new Error(
          pipelineRes.data.message || 'Pipeline failed.'
        );
      }

    } catch (err) {
      console.error("Pipeline error:", err);
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Something went wrong. Please try again.'
      );
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  // --- Form View ---
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-dark grid-bg">

        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5
          glass sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <span className="text-xl font-bold gradient-text">MAPIF</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition
              text-sm flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">New Project</h1>
            <p className="text-gray-400 mt-2">
              Fill in your project details and let the AI agents do the rest.
            </p>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border
              border-red-500 border-opacity-30 rounded-lg p-3
              mb-6 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">
                  Project Name
                </label>
                <input
                  type="text"
                  name="project_name"
                  placeholder="e.g. MediSync AI"
                  value={form.project_name}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  placeholder="e.g. Healthcare"
                  value={form.industry}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Target Market
                </label>
                <input
                  type="text"
                  name="target_market"
                  placeholder="e.g. Hospitals and Clinics"
                  value={form.target_market}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">
                  Objective
                </label>
                <textarea
                  name="objective"
                  placeholder="e.g. Automate patient scheduling to reduce waiting times"
                  value={form.objective}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Budget
                </label>
                <input
                  type="text"
                  name="budget"
                  placeholder="e.g. $75,000"
                  value={form.budget}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Timeline
                </label>
                <input
                  type="text"
                  name="timeline"
                  placeholder="e.g. 9 months"
                  value={form.timeline}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Agent preview */}
            <div className="mt-8 mb-6">
              <p className="text-sm text-gray-400 mb-3">
                These agents will run automatically:
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {agents.map(agent => (
                  <div key={agent.id}
                    className="flex flex-col items-center gap-1
                      bg-card rounded-lg p-2 text-center">
                    <span className="text-xl">{agent.emoji}</span>
                    <span className="text-xs text-gray-400">
                      {agent.name.split(' ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center
                justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white
                    border-t-transparent rounded-full animate-spin"/>
                  Starting pipeline...
                </>
              ) : (
                "🚀 Run All Agents"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Pipeline View ---
  if (step === 'pipeline') {
    return (
      <div className="min-h-screen bg-dark grid-bg flex items-center
        justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <span className="text-5xl">🤖</span>
            <h2 className="text-2xl font-bold mt-4">
              Running AI Pipeline
            </h2>
            <p className="text-gray-400 mt-2">
              Please wait while the agents analyze your project...
            </p>
          </div>

          <div className="glass rounded-2xl p-8 flex flex-col gap-4">
            {agents.map((agent, i) => {
              const isDone    = agentsDone.includes(agent.id)
                                || i < currentAgent;
              const isRunning = i === currentAgent
                                && step === 'pipeline';
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 p-3
                    rounded-xl transition-all"
                  style={{
                    background: isRunning
                      ? 'rgba(58,129,241,0.1)' : 'transparent',
                    border: isRunning
                      ? '1px solid rgba(58,129,241,0.3)'
                      : '1px solid transparent'
                  }}
                >
                  <span className="text-2xl">{agent.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Agent {agent.id} — {agent.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isRunning ? agent.desc
                       : isDone  ? 'Completed ✓'
                       : 'Waiting...'}
                    </p>
                  </div>
                  <div>
                    {isDone ? (
                      <span className="text-success text-lg">✅</span>
                    ) : isRunning ? (
                      <span className="w-5 h-5 border-2 border-primary
                        border-t-transparent rounded-full animate-spin
                        block"/>
                    ) : (
                      <span className="text-gray-600 text-lg">⏳</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs
                text-gray-400 mb-1">
                <span>Progress</span>
                <span>
                  {Math.round((currentAgent / agents.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(currentAgent / agents.length) * 100}%`,
                    background: 'linear-gradient(90deg, #3A81F1, #2DA94F)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Done View ---
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-dark grid-bg flex items-center
        justify-center px-6">
        <div className="glass rounded-2xl p-12 max-w-md w-full
          text-center">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold mt-4 mb-2">
            Pipeline Complete!
          </h2>
          <p className="text-gray-400 mb-8">
            All 6 agents have finished analyzing your project.
            Your results are ready!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/results/${projectId}`)}
              className="btn-primary w-full py-3"
            >
              View Results →
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary w-full py-3"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}