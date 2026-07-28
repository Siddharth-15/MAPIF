// frontend/src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, deleteProject } from '../api';

const statusColor = {
  completed: '#2DA94F',
  running:   '#FDBD00',
  failed:    '#EA4335',
};

const scoreColor = (score) =>
  score >= 70 ? '#2DA94F' :
  score >= 40 ? '#FDBD00' : '#EA4335';

const scoreLabel = (score) =>
  score >= 70 ? 'Strong' :
  score >= 40 ? 'Moderate' : 'Weak';

export default function Dashboard() {
  const navigate  = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await listProjects();
      setProjects(res.data.data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?'))
      return;
    setDeleting(id);
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filtered = projects.filter(p =>
    p.project_name.toLowerCase().includes(search.toLowerCase()) ||
    p.industry.toLowerCase().includes(search.toLowerCase())
  );

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
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-400
              hover:text-white transition text-sm"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex
              items-center justify-center text-white font-bold text-sm">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            {user.username}
          </button>
          <button
            onClick={handleLogout}
            className="btn-secondary text-sm"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start
          md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user.username}! 👋
            </h1>
            <p className="text-gray-400 mt-1">
              {projects.length === 0
                ? "You haven't run any projects yet."
                : `You have ${projects.length} project${projects.length > 1 ? 's' : ''} saved.`}
            </p>
          </div>
          <button
            onClick={() => navigate('/new-project')}
            className="btn-primary flex items-center gap-2"
          >
            + New Project
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Projects",
              value: projects.length,
              color: "#3A81F1"
            },
            {
              label: "Completed",
              value: projects.filter(p => p.status === 'completed').length,
              color: "#2DA94F"
            },
            {
              label: "Avg Viability",
              value: projects.length > 0
                ? Math.round(
                    projects.reduce((a, b) => a + b.viability_score, 0)
                    / projects.length
                  ) + "/100"
                : "N/A",
              color: "#FDBD00"
            },
            {
              label: "Industries",
              value: [...new Set(projects.map(p => p.industry))].length,
              color: "#EA4335"
            },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1"
                style={{ color: stat.color }}>
                {stat.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Search */}
        {projects.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search projects by name or industry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field max-w-md"
            />
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary
              border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <span className="text-6xl">🚀</span>
            <h3 className="text-xl font-semibold mt-4 mb-2">
              {search ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-400 mb-6">
              {search
                ? "Try a different search term."
                : "Run your first AI agent pipeline to get started."}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/new-project')}
                className="btn-primary"
              >
                + Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2
            lg:grid-cols-3 gap-6">
            {filtered.map(project => (
              <div
                key={project.id}
                className="glass rounded-xl p-6 agent-card"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg leading-tight">
                      {project.project_name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {project.industry}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0"
                    style={{
                      background: statusColor[project.status] + '22',
                      color:      statusColor[project.status]
                    }}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Viability Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between
                    text-sm mb-1">
                    <span className="text-gray-400">Viability Score</span>
                    <span style={{ color: scoreColor(project.viability_score) }}
                      className="font-semibold">
                      {project.viability_score}/100 —{' '}
                      {scoreLabel(project.viability_score)}
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width:      `${project.viability_score}%`,
                        background: scoreColor(project.viability_score)
                      }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 mb-4">
                  {[
                    { label: "Market",   value: project.target_market },
                    { label: "Budget",   value: project.budget        },
                    { label: "Timeline", value: project.timeline      },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="text-gray-300">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Date */}
                <p className="text-xs text-gray-500 mb-4">
                  {new Date(project.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/results/${project.id}`)}
                    className="btn-primary text-sm flex-1"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={deleting === project.id}
                    className="px-3 py-2 rounded-lg text-sm
                      border border-red-500 border-opacity-30
                      text-red-400 hover:bg-red-500 hover:bg-opacity-10
                      transition flex-shrink-0"
                  >
                    {deleting === project.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}