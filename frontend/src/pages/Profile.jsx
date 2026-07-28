// frontend/src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects } from '../api';

export default function Profile() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const avgScore = projects.length > 0
    ? Math.round(
        projects.reduce((a, b) => a + b.viability_score, 0)
        / projects.length
      )
    : 0;

  const industries = [...new Set(projects.map(p => p.industry))];

  const topProject = projects.length > 0
    ? projects.reduce((a, b) =>
        a.viability_score > b.viability_score ? a : b
      )
    : null;

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
            onClick={() => navigate('/dashboard')}
            className="btn-secondary text-sm"
          >
            ← Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400
              transition text-sm"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Profile Header */}
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary
              flex items-center justify-center text-white
              font-bold text-3xl flex-shrink-0">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="text-gray-400 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-success
                  animate-pulse-slow"/>
                <span className="text-xs text-success">Active</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm hidden md:block"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Projects",
              value: projects.length,
              color: "#3A81F1",
              icon:  "📁"
            },
            {
              label: "Avg Viability",
              value: `${avgScore}/100`,
              color: avgScore >= 70 ? "#2DA94F"
                   : avgScore >= 40 ? "#FDBD00" : "#EA4335",
              icon:  "📊"
            },
            {
              label: "Industries",
              value: industries.length,
              color: "#FDBD00",
              icon:  "🏭"
            },
            {
              label: "Agents Run",
              value: projects.length * 6,
              color: "#EA4335",
              icon:  "🤖"
            },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold"
                style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Top Project */}
        {topProject && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              🏆 Best Project
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{topProject.project_name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {topProject.industry} · {topProject.target_market}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold"
                  style={{
                    color: topProject.viability_score >= 70
                      ? '#2DA94F'
                      : topProject.viability_score >= 40
                      ? '#FDBD00' : '#EA4335'
                  }}>
                  {topProject.viability_score}/100
                </p>
                <p className="text-xs text-gray-400">Viability Score</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/results/${topProject.id}`)}
              className="btn-primary text-sm mt-4"
            >
              View Results →
            </button>
          </div>
        )}

        {/* Industries */}
        {industries.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              🏭 Industries Explored
            </h2>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind, i) => (
                <span key={i}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    background: 'rgba(58,129,241,0.15)',
                    color:      '#3A81F1',
                    border:     '1px solid rgba(58,129,241,0.3)'
                  }}>
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Projects */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              📁 Recent Projects
            </h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-primary text-sm hover:underline"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary
                border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">
                No projects yet.
              </p>
              <button
                onClick={() => navigate('/new-project')}
                className="btn-primary text-sm mt-4"
              >
                + Create First Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between
                    bg-card rounded-xl p-4 cursor-pointer
                    hover:border-primary transition"
                  style={{ border: '1px solid #2D3250' }}
                  onClick={() => navigate(`/results/${project.id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">
                      {project.project_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {project.industry} ·{' '}
                      {new Date(project.created_at)
                        .toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold"
                      style={{
                        color: project.viability_score >= 70
                          ? '#2DA94F'
                          : project.viability_score >= 40
                          ? '#FDBD00' : '#EA4335'
                      }}>
                      {project.viability_score}/100
                    </span>
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}