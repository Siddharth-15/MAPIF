// frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';

export default function Login() {
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res  = await login(form);
      const data = res.data.data;
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark grid-bg flex items-center justify-center px-4">

      {/* Back to home */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <span>←</span>
          <span className="text-sm">Back to home</span>
        </Link>
      </div>

      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🤖</span>
          <h1 className="text-2xl font-bold mt-3 gradient-text">Multi-Agent Prdocut Intelligent Framework</h1>
          <p className="text-gray-400 text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">Welcome back</h2>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500
              border-opacity-30 rounded-lg p-3 mb-4 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Email address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white
                    border-t-transparent rounded-full animate-spin"/>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="glass rounded-xl p-4 mt-4 text-center">
          <p className="text-xs text-gray-500">
            New here? Create a free account — no credit card needed.
          </p>
        </div>
      </div>
    </div>
  );
}