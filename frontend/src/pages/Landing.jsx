// frontend/src/pages/Landing.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon:        "🔍",
    title:       "Smart Input Validation",
    description: "Agent 1 checks your project details and gives you a viability score before anything runs."
  },
  {
    icon:        "📊",
    title:       "Live Market Research",
    description: "Agent 2 searches the web in real time using DuckDuckGo and analyzes market trends with AI."
  },
  {
    icon:        "📈",
    title:       "Predicted Dashboard",
    description: "Agent 3 pulls real World Bank data and forecasts your market for the next 5 years."
  },
  {
    icon:        "🗺️",
    title:       "Dual Roadmaps",
    description: "Agent 4 builds two practical roadmaps — conservative and aggressive — based on real research."
  },
  {
    icon:        "🛡️",
    title:       "AI Risk Assessment",
    description: "Agent 5 highlights risks on every phase of your roadmap with specific prevention steps."
  },
  {
    icon:        "💡",
    title:       "Final Advisory Report",
    description: "Agent 6 writes a complete professional report with budget allocation and next steps."
  }
];

const stats = [
  { value: "6",    label: "AI Agents"         },
  { value: "100%", label: "Automated Pipeline" },
  { value: "Live", label: "Market Data"        },
  { value: "Free", label: "Open Source"        },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark grid-bg">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <span className="text-xl font-bold gradient-text">
            MAPIF
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary text-sm"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary mb-8">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-slow"/>
          Powered by Groq LLaMA3 · World Bank API · DuckDuckGo
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Multi-Agent Product 
          <br />
          <span className="gradient-text">Intelligence Framework</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed">
          A smart dashboard of 6 AI agents that work together to research
          your market, build roadmaps, assess risks, and generate a full
          advisory report — all automatically.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-base px-8 py-3"
          >
            🚀 Start Your Project
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary text-base px-8 py-3"
          >
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 w-full max-w-3xl">
          {stats.map((stat, i) => (
            <div key={i} className="glass rounded-xl p-5 text-center">
              <div className="text-3xl font-bold gradient-text">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Meet Your AI Agents
        </h2>
        <p className="text-gray-400 text-center mb-12">
          6 specialized agents working together in a fully automated pipeline
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass rounded-xl p-6 agent-card cursor-pointer"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Just fill in your project details and watch the agents do the rest
        </p>

        <div className="flex flex-col gap-4">
          {[
            { step: "1", title: "Sign up and create your project",    desc: "Enter your project name, industry, target market, objective, budget and timeline." },
            { step: "2", title: "Run the AI pipeline",                desc: "All 6 agents run automatically in sequence, each building on the previous one." },
            { step: "3", title: "Explore your results",               desc: "Get a full market dashboard, dual roadmaps, risk assessment and advisory report." },
            { step: "4", title: "Save and revisit anytime",           desc: "All your project runs are saved so you can come back and review them later." },
          ].map((item, i) => (
            <div key={i} className="glass rounded-xl p-6 flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 text-center">
        <div className="glass rounded-2xl p-12 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8">
            Create your free account and run your first AI agent pipeline in minutes.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-base px-10 py-3"
          >
            🚀 Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm border-t border-border">
        <p>Built with Groq LLaMA3 · World Bank API · DuckDuckGo · FastAPI · React</p>
        <p className="mt-1">Multi-Agent Product Intelligence Framework</p>
      </footer>
    </div>
  );
}