// frontend/src/pages/Register.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

export default function Register() {
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({
    username: '', email: '', password: '', confirmPassword: ''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email ||
        !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res  = await register({
        username: form.username,
        email:    form.email,
        password: form.password
      });
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

  const strength = form.password.length === 0 ? null
    : form.password.length < 6  ? 'weak'
    : form.password.length < 10 ? 'medium'
    : 'strong';

  const strengthColor = {
    weak:   '#EA4335',
    medium: '#FDBD00',
    strong: '#2DA94F'
  };

  return (
    <div className="min-h-screen bg-dark grid-bg flex items-center
      justify-center px-4 py-12">

      {/* Back to home */}
      <div className="absolute top-6 left-6">
        <Link to="/"
          className="flex items-center gap-2 text-gray-400
          hover:text-white transition">
          <span>←</span>
          <span className="text-sm">Back to home</span>
        </Link>
      </div>

      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🤖</span>
          <h1 className="text-2xl font-bold mt-3 gradient-text">MAPIF</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create your free account
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">Get started</h2>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500
              border-opacity-30 rounded-lg p-3 mb-4 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="e.g. siddharth"
                value={form.username}
                onChange={handleChange}
                className="input-field"
              />
            </div>

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
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                className="input-field"
              />
              {strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {['weak', 'medium', 'strong'].map((s, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{
                          background:
                            ['weak','medium','strong'].indexOf(strength) >= i
                              ? strengthColor[strength]
                              : '#2D3250'
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-xs capitalize"
                    style={{ color: strengthColor[strength] }}
                  >
                    {strength}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Confirm password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input-field"
              />
              {form.confirmPassword && (
                <p className="text-xs mt-1"
                  style={{
                    color: form.password === form.confirmPassword
                      ? '#2DA94F' : '#EA4335'
                  }}>
                  {form.password === form.confirmPassword
                    ? '✓ Passwords match'
                    : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center
                justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white
                    border-t-transparent rounded-full animate-spin"/>
                  Creating account...
                </>
              ) : (
                "🚀 Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          No credit card needed · Free forever · Academic use
        </p>
      </div>
    </div>
  );
}