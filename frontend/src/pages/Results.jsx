// frontend/src/pages/Results.jsx

import AnalyticsReport       from '../components/AnalyticsReport';
import MarketResearchReport  from '../components/MarketResearchReport';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams }     from 'react-router-dom';
import { getProject }                 from '../api';

const scoreColor = (score) =>
  score >= 70 ? '#2DA94F' :
  score >= 40 ? '#FDBD00' : '#EA4335';

const scoreLabel = (score) =>
  score >= 70 ? 'Strong' :
  score >= 40 ? 'Moderate' : 'Weak';

const levelColor = {
  High:   '#EA4335',
  Medium: '#FDBD00',
  Low:    '#2DA94F',
};

export default function Results() {
  const navigate               = useNavigate();
  const { projectId }          = useParams();
  const [project,   setProject]  = useState(null);
  const [outputs,   setOutputs]  = useState({});
  const [loading,   setLoading]  = useState(true);
  const [activeTab, setActiveTab]= useState('agent1');
  const [error,     setError]    = useState('');

  // NEW — ESLint satisfied:
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res  = await getProject(projectId);
        console.log("Results API response:", res.data);
        const data = res.data.data;
        setProject(data.project);

        const rawOutputs = data.outputs || data.agent_outputs || [];
        console.log("Raw outputs:", rawOutputs);

        const outputMap = {};
        rawOutputs.forEach(o => {
          const name = (o.agent_name || '').toLowerCase();
          const key  =
            name.includes('inquirer')  ? 'agent1' :
            name.includes('analyst')   ? 'agent2' :
            name.includes('visionary') ? 'agent3' :
            name.includes('navigator') ? 'agent4' :
            name.includes('guardian')  ? 'agent5' :
            name.includes('advisor')   ? 'agent6' : null;

          if (key) {
            const raw = o.output_data;
            outputMap[key] = typeof raw === 'string'
              ? (() => {
                  try { return JSON.parse(raw); }
                  catch { return {}; }
                })()
              : (raw || {});
          }
        });

        console.log("Output map keys:", Object.keys(outputMap));
        setOutputs(outputMap);

      } catch (err) {
        console.error("fetchResults error:", err);
        setError('Failed to load results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [projectId]);

  const tabs = [
    { id: 'agent1', label: '🔍 Inquirer'  },
    { id: 'agent2', label: '📊 Analyst'   },
    { id: 'agent3', label: '📈 Visionary' },
    { id: 'agent4', label: '🗺️ Navigator' },
    { id: 'agent5', label: '🛡️ Guardian'  },
    { id: 'agent6', label: '💡 Advisor'   },
  ];

  if (loading) return (
    <div className="min-h-screen bg-dark flex items-center
      justify-center">
      <div className="w-10 h-10 border-4 border-primary
        border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-dark flex items-center
      justify-center text-red-400">
      {error}
    </div>
  );

  const agent1 = outputs.agent1 || {};
  const agent2 = outputs.agent2 || {};
  const agent3 = outputs.agent3 || {};
  const agent4 = outputs.agent4 || {};
  const agent5 = outputs.agent5 || {};
  const agent6 = outputs.agent6 || {};

  return (
    <div className="min-h-screen bg-dark grid-bg">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5
        glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <span className="text-xl font-bold gradient-text">MAPIF</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            {project?.project_name}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary text-sm"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Project Header */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start
            md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {project?.project_name}
              </h1>
              <p className="text-gray-400 mt-1">
                {project?.industry} · {project?.target_market}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {project?.objective}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold"
                  style={{
                    color: scoreColor(project?.viability_score)
                  }}>
                  {project?.viability_score}/100
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {scoreLabel(project?.viability_score)} Viability
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Budget</div>
                <div className="font-semibold">{project?.budget}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Timeline</div>
                <div className="font-semibold">{project?.timeline}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium
                transition-all"
              style={{
                background: activeTab === tab.id
                  ? '#3A81F1' : 'rgba(30,33,48,0.8)',
                color:  activeTab === tab.id ? 'white' : '#9ca3af',
                border: activeTab === tab.id
                  ? 'none' : '1px solid rgba(45,50,80,1)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass rounded-2xl p-8">

          {/* ── AGENT 1 ── */}
          {activeTab === 'agent1' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                🔍 Project Validation Report
              </h2>

              {/* Viability Score Card */}
              <div className="glass rounded-xl p-6 mb-6"
                style={{
                  borderLeft: `5px solid ${
                    scoreColor(agent1.viability_score)
                  }`
                }}>
                <h3 className="text-2xl font-bold"
                  style={{ color: scoreColor(agent1.viability_score) }}>
                  {agent1.viability_score}/100 —{' '}
                  {scoreLabel(agent1.viability_score)}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  AI-powered project viability score
                </p>
              </div>

              {/* Check Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4
                gap-4 mb-6">
                {[
                  { label: "Industry", key: "industry_check" },
                  { label: "Budget",   key: "budget_check"   },
                  { label: "Timeline", key: "timeline_check" },
                  { label: "Market",   key: "market_check"   },
                ].map((item, i) => {
                  const check = agent1[item.key] || 'N/A';
                  const color = check === 'PASS'
                    ? '#2DA94F' : '#EA4335';
                  return (
                    <div key={i} className="bg-card rounded-xl p-4
                      text-center"
                      style={{ borderTop: `3px solid ${color}` }}>
                      <p className="text-xs text-gray-400">
                        {item.label}
                      </p>
                      <p className="font-bold mt-1"
                        style={{ color }}>
                        {check === 'PASS' ? '✅' : '❌'} {check}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Strength / Weakness / Opportunity */}
              <div className="grid grid-cols-1 md:grid-cols-3
                gap-4 mb-6">
                {[
                  { label: "💪 Strength",    key: "strength",    color: "#2DA94F" },
                  { label: "⚠️ Weakness",    key: "weakness",    color: "#EA4335" },
                  { label: "🚀 Opportunity", key: "opportunity", color: "#3A81F1" },
                ].map((item, i) => (
                  <div key={i} className="bg-card rounded-xl p-4"
                    style={{ borderLeft: `3px solid ${item.color}` }}>
                    <p className="text-xs mb-2"
                      style={{ color: item.color }}>
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-300">
                      {agent1[item.key] || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>

              {/* AI Feedback */}
              <div className="bg-card rounded-xl p-4 mb-4">
                <p className="text-sm text-primary mb-2">
                  💬 AI Feedback
                </p>
                <p className="text-gray-300 text-sm">
                  {agent1.feedback || 'No feedback available.'}
                </p>
              </div>

              {/* Suggestions */}
              {agent1.suggestions?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">
                    💡 Improvement Suggestions
                  </p>
                  {agent1.suggestions.map((s, i) => (
                    <div key={i} className="bg-card rounded-lg p-3
                      mb-2 flex items-start gap-3">
                      <span className="text-primary font-bold text-sm">
                        {i + 1}.
                      </span>
                      <p className="text-sm text-gray-300">{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Budget & Timeline Estimates */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-card rounded-xl p-4"
                  style={{ borderLeft: '3px solid #2DA94F' }}>
                  <p className="text-xs text-gray-400">
                    💰 Recommended Budget
                  </p>
                  <p className="font-semibold text-success mt-1">
                    {agent1.budget_estimate || 'N/A'}
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4"
                  style={{ borderLeft: '3px solid #FDBD00' }}>
                  <p className="text-xs text-gray-400">
                    ⏱️ Recommended Timeline
                  </p>
                  <p className="font-semibold text-warning mt-1">
                    {agent1.timeline_estimate || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── AGENT 2 ── */}
          {activeTab === 'agent2' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                📊 Market Research Analysis
              </h2>
              <MarketResearchReport data={agent2} />
            </div>
          )}

          {/* ── AGENT 3 ── */}
          {activeTab === 'agent3' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                📈 Data Analytics Report
              </h2>
              <AnalyticsReport report={agent3.analytics_report} />
            </div>
          )}

          {/* ── AGENT 4 ── */}
          {activeTab === 'agent4' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                🗺️ Project Roadmaps
              </h2>
              {['conservative', 'aggressive'].map(approach => (
                <div key={approach} className="mb-8">
                  <h3 className="font-semibold text-lg mb-4"
                    style={{
                      color: approach === 'conservative'
                        ? '#4fc3f7' : '#ff7043'
                    }}>
                    {approach === 'conservative'
                      ? '🛡️ Roadmap A — Conservative'
                      : '🚀 Roadmap B — Aggressive'}
                  </h3>
                  {!agent4[approach]?.phases?.length && (
                    <p className="text-gray-500 text-sm">
                      No roadmap data available.
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {agent4[approach]?.phases?.map((phase, i) => (
                      <div key={i} className="bg-card rounded-xl p-5"
                        style={{
                          borderTop: `3px solid ${
                            approach === 'conservative'
                              ? '#4fc3f7' : '#ff7043'
                          }`
                        }}>
                        <p className="text-xs mb-1"
                          style={{
                            color: approach === 'conservative'
                              ? '#4fc3f7' : '#ff7043'
                          }}>
                          Phase {i + 1}
                        </p>
                        <p className="font-semibold mb-2">
                          {phase.title}
                        </p>
                        {phase.description && (
                          <p className="text-xs text-gray-400
                            mb-3 italic">
                            {phase.description}
                          </p>
                        )}
                        <div className="space-y-1">
                          {phase.tasks?.map((task, j) => (
                            <p key={j} className="text-xs
                              text-gray-300 flex items-start gap-2">
                              <span className="text-success mt-0.5">
                                ✓
                              </span>
                              {task}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── AGENT 5 ── */}
          {activeTab === 'agent5' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                🛡️ Risk Assessment
              </h2>
              {['conservative', 'aggressive'].map(approach => {
                const data = agent5[approach];
                if (!data) return (
                  <p key={approach}
                    className="text-gray-500 text-sm mb-4">
                    No risk data for {approach} roadmap.
                  </p>
                );
                return (
                  <div key={approach} className="mb-8">
                    <h3 className="font-semibold text-lg mb-4"
                      style={{
                        color: approach === 'conservative'
                          ? '#4fc3f7' : '#ff7043'
                      }}>
                      {approach === 'conservative'
                        ? '🛡️ Conservative Roadmap'
                        : '🚀 Aggressive Roadmap'}
                    </h3>

                    {/* Risk Summary Counts */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {[
                        { label: "🔴 High",   value: data.high_count,   color: "#EA4335" },
                        { label: "🟡 Medium", value: data.medium_count, color: "#FDBD00" },
                        { label: "🟢 Low",    value: data.low_count,    color: "#2DA94F" },
                      ].map((item, i) => (
                        <div key={i} className="bg-card rounded-xl
                          p-4 text-center">
                          <p className="text-xs text-gray-400">
                            {item.label}
                          </p>
                          <p className="text-2xl font-bold mt-1"
                            style={{ color: item.color }}>
                            {item.value ?? 0}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Phase Risk Cards */}
                    {data.assessed_phases?.map((phase, i) => (
                      <div key={i} className="mb-4">
                        <div className="rounded-xl p-4 mb-2"
                          style={{
                            background: (phase.color || '#EA4335')
                              + '22',
                            borderLeft: `4px solid ${
                              phase.color || '#EA4335'
                            }`
                          }}>
                          <div className="flex items-center
                            justify-between">
                            <p className="font-semibold text-sm"
                              style={{
                                color: phase.color || '#EA4335'
                              }}>
                              {phase.overall_level === 'High'
                                ? '🔴'
                                : phase.overall_level === 'Medium'
                                ? '🟡' : '🟢'}{' '}
                              {phase.phase_title}
                            </p>
                            <p className="text-xs"
                              style={{
                                color: phase.color || '#EA4335'
                              }}>
                              Risk: {phase.overall_level}{' '}
                              ({phase.overall_score}/10)
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-400 text-xs
                                border-b border-border">
                                <th className="text-left py-2 pr-4">
                                  Risk
                                </th>
                                <th className="text-left py-2 pr-4">
                                  Level
                                </th>
                                <th className="text-left py-2 pr-4">
                                  Score
                                </th>
                                <th className="text-left py-2">
                                  Prevention
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {phase.risks?.map((risk, j) => (
                                <tr key={j} className="border-b
                                  border-border border-opacity-30">
                                  <td className="py-2 pr-4
                                    text-gray-300">
                                    {risk.risk}
                                  </td>
                                  <td className="py-2 pr-4"
                                    style={{
                                      color: levelColor[risk.level]
                                        || '#FDBD00'
                                    }}>
                                    {risk.level}
                                  </td>
                                  <td className="py-2 pr-4
                                    text-gray-300">
                                    {risk.score}/10
                                  </td>
                                  <td className="py-2 text-gray-400
                                    text-xs">
                                    {risk.prevention}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── AGENT 6 ── */}
          {activeTab === 'agent6' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                💡 Final Advisory Report
              </h2>
              {agent6.report ? (
                <div className="bg-card rounded-xl p-6">
                  <div className="text-gray-300 text-sm leading-relaxed
                    whitespace-pre-wrap">
                    {agent6.report}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No advisory report available.
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}