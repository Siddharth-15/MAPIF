// frontend/src/components/MarketResearchReport.jsx

import React, { useState } from 'react';

const levelColor = {
  High:   '#EA4335',
  Medium: '#FDBD00',
  Low:    '#2DA94F',
};

const impactColor = {
  High:   { bg: 'rgba(234,67,53,0.1)',   text: '#EA4335' },
  Medium: { bg: 'rgba(253,189,0,0.1)',   text: '#FDBD00' },
  Low:    { bg: 'rgba(45,169,79,0.1)',   text: '#2DA94F' },
};

const confidenceColor = (score) =>
  score >= 70 ? '#2DA94F' :
  score >= 40 ? '#FDBD00' : '#EA4335';

export default function MarketResearchReport({ data }) {
  const [activeTab, setActiveTab] = useState('snapshot');

  if (!data) return (
    <div className="text-gray-400 text-center py-8">
      No market research data available.
    </div>
  );

  const sd      = data.structured_data || {};
  const snap    = sd.executive_snapshot    || {};
  const sizing  = sd.market_sizing         || [];
  const trends  = sd.trends                || [];
  const compet  = sd.competitive_landscape || [];
  const swot    = sd.swot                  || {};
  const bottom  = sd.bottom_line           || {};
  const news    = data.news                || [];
  const scored  = data.scored_insights     || [];
  const queries = data.queries             || [];

  const tabs = [
    { id: 'snapshot',    label: '📊 Snapshot'     },
    { id: 'sizing',      label: '📈 Market Size'  },
    { id: 'trends',      label: '🔥 Trends'       },
    { id: 'competitive', label: '🏢 Competitors'  },
    { id: 'swot',        label: '⚡ SWOT'         },
    { id: 'news',        label: '📰 News'         },
    { id: 'insights',    label: '💡 Insights'     },
  ];

  return (
    <div className="w-full">

      {/* Header */}
      <div className="rounded-2xl p-5 mb-6"
        style={{
          background: 'linear-gradient(135deg, #1E2130, #0D1117)',
          border:     '1px solid rgba(58,129,241,0.2)'
        }}>
        <div className="flex items-center justify-between
          flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              Market Research Report
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Live data · {data.scraped_at}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5
            rounded-full text-xs"
            style={{
              background: data.is_valid
                ? 'rgba(45,169,79,0.15)' : 'rgba(253,189,0,0.15)',
              color:  data.is_valid ? '#2DA94F' : '#FDBD00',
              border: `1px solid ${data.is_valid
                ? 'rgba(45,169,79,0.3)' : 'rgba(253,189,0,0.3)'}`
            }}>
            <span className="w-1.5 h-1.5 rounded-full"
              style={{
                background: data.is_valid ? '#2DA94F' : '#FDBD00'
              }}/>
            {data.is_valid ? 'Validated' : 'Best Available'}
          </div>
        </div>

        {/* Queries */}
        {queries.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {queries.map((q, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: 'rgba(58,129,241,0.1)',
                  color:      '#3A81F1',
                  border:     '1px solid rgba(58,129,241,0.2)'
                }}>
                🔍 {q}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1.5 rounded-lg text-xs
              font-medium transition-all"
            style={{
              background: activeTab === tab.id
                ? '#3A81F1' : '#1E2130',
              color: activeTab === tab.id ? 'white' : '#9ca3af',
              border: activeTab === tab.id
                ? 'none' : '1px solid #2D3250'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Executive Snapshot */}
      {activeTab === 'snapshot' && (
        <div className="flex flex-col gap-5">

          {/* 3 Key Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label:  'Market Size',
                value:  snap.market_size  || 'N/A',
                source: snap.market_size_source || '',
                color:  '#3A81F1',
                icon:   '💰'
              },
              {
                label:  'Growth Rate',
                value:  snap.growth_rate  || 'N/A',
                source: snap.growth_rate_source || '',
                color:  '#2DA94F',
                icon:   '📈'
              },
              {
                label:  'Key Opportunity',
                value:  snap.key_opportunity || 'N/A',
                source: snap.year || '2025',
                color:  '#FDBD00',
                icon:   '🎯'
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-5"
                style={{
                  background:  '#1E2130',
                  borderTop:   `3px solid ${item.color}`
                }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs text-gray-400">
                    {item.label}
                  </span>
                </div>
                <p className="text-xl font-bold"
                  style={{ color: item.color }}>
                  {item.value}
                </p>
                {item.source && (
                  <p className="text-xs text-gray-500 mt-1">
                    Source: {item.source}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Line */}
          {bottom.recommendation && (
            <div className="rounded-xl p-5"
              style={{
                background:  '#1E2130',
                borderLeft:  `4px solid ${
                  bottom.confidence === 'High'   ? '#2DA94F' :
                  bottom.confidence === 'Medium' ? '#FDBD00' : '#EA4335'
                }`
              }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-white">
                  💡 Bottom Line
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: impactColor[bottom.confidence]?.bg
                      || 'rgba(253,189,0,0.1)',
                    color: impactColor[bottom.confidence]?.text
                      || '#FDBD00'
                  }}>
                  {bottom.confidence} Confidence
                </span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                {bottom.recommendation}
              </p>
              {bottom.reasoning && (
                <p className="text-gray-500 text-xs mt-2 italic">
                  {bottom.reasoning}
                </p>
              )}
            </div>
          )}

          {/* Wiki Context */}
          {data.wiki_data && (
            <div className="rounded-xl p-4"
              style={{
                background:  '#1E2130',
                borderLeft:  '3px solid #FDBD00'
              }}>
              <p className="text-xs text-warning mb-2">
                📖 Market Background
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {data.wiki_data.slice(0, 400)}...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Market Sizing Table */}
      {activeTab === 'sizing' && (
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#1E2130' }}>
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">
              📈 Market Size by Year
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Historical and projected market data
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Year', 'Market Size', 'Growth Rate', 'Notes'].map(
                    (h, i) => (
                      <th key={i} className="text-left px-4 py-3
                        text-xs text-gray-400 font-medium uppercase
                        tracking-wider">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {sizing.length > 0 ? sizing.map((row, i) => (
                  <tr key={i}
                    className="border-b border-gray-800
                      hover:bg-gray-800 transition">
                    <td className="px-4 py-3 text-sm font-semibold
                      text-primary">
                      {row.year}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {row.size}
                    </td>
                    <td className="px-4 py-3 text-sm"
                      style={{
                        color: row.growth?.startsWith('-')
                          ? '#EA4335' : '#2DA94F'
                      }}>
                      {row.growth}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {row.note}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}
                      className="px-4 py-6 text-center
                      text-gray-500 text-sm">
                      Market sizing data being collected...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends */}
      {activeTab === 'trends' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            {trends.length} Key Market Trends Identified
          </p>
          {trends.length > 0 ? trends.map((trend, i) => (
            <div key={i} className="rounded-xl p-5"
              style={{
                background:  '#1E2130',
                borderLeft:  `4px solid ${
                  impactColor[trend.impact]?.text || '#3A81F1'
                }`
              }}>
              <div className="flex items-start justify-between
                gap-3 mb-3">
                <h4 className="font-semibold text-white">
                  {trend.title}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full
                  flex-shrink-0"
                  style={{
                    background: impactColor[trend.impact]?.bg
                      || 'rgba(58,129,241,0.1)',
                    color: impactColor[trend.impact]?.text || '#3A81F1'
                  }}>
                  {trend.impact} Impact
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                {trend.finding}
              </p>
              {trend.evidence && (
                <div className="rounded-lg p-3"
                  style={{ background: 'rgba(58,129,241,0.05)' }}>
                  <p className="text-xs text-gray-400">
                    📌 Evidence: {trend.evidence}
                  </p>
                </div>
              )}
            </div>
          )) : (
            <p className="text-gray-500 text-sm">
              No trend data available.
            </p>
          )}
        </div>
      )}

      {/* Competitive Landscape */}
      {activeTab === 'competitive' && (
        <div>
          <p className="text-xs text-gray-400 uppercase
            tracking-wider mb-4">
            Competitive Landscape Analysis
          </p>
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#1E2130' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Company', 'Strength', 'Weakness',
                      'Market Share'].map((h, i) => (
                      <th key={i} className="text-left px-4 py-3
                        text-xs text-gray-400 font-medium
                        uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compet.length > 0 ? compet.map((comp, i) => (
                    <tr key={i}
                      className="border-b border-gray-800
                        hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-semibold
                        text-sm text-primary">
                        {comp.company}
                      </td>
                      <td className="px-4 py-3 text-xs text-success">
                        ✓ {comp.strength}
                      </td>
                      <td className="px-4 py-3 text-xs text-danger">
                        ✗ {comp.weakness}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">
                        {comp.market_share}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4}
                        className="px-4 py-6 text-center
                        text-gray-500 text-sm">
                        Competitor data being collected...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SWOT */}
      {activeTab === 'swot' && (
        <div>
          <p className="text-xs text-gray-400 uppercase
            tracking-wider mb-4">
            SWOT Analysis
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key:   'strengths',
                label: 'Strengths',
                icon:  '💪',
                color: '#2DA94F',
                bg:    'rgba(45,169,79,0.08)'
              },
              {
                key:   'weaknesses',
                label: 'Weaknesses',
                icon:  '⚠️',
                color: '#EA4335',
                bg:    'rgba(234,67,53,0.08)'
              },
              {
                key:   'opportunities',
                label: 'Opportunities',
                icon:  '🚀',
                color: '#3A81F1',
                bg:    'rgba(58,129,241,0.08)'
              },
              {
                key:   'threats',
                label: 'Threats',
                icon:  '🛡️',
                color: '#FDBD00',
                bg:    'rgba(253,189,0,0.08)'
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-5"
                style={{
                  background:  item.bg,
                  border:      `1px solid ${item.color}33`
                }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{item.icon}</span>
                  <h4 className="font-semibold text-sm"
                    style={{ color: item.color }}>
                    {item.label}
                  </h4>
                </div>
                <div className="flex flex-col gap-2">
                  {(swot[item.key] || []).map((point, j) => (
                    <div key={j}
                      className="flex items-start gap-2">
                      <span className="text-xs mt-0.5 flex-shrink-0"
                        style={{ color: item.color }}>
                        →
                      </span>
                      <p className="text-xs text-gray-300
                        leading-relaxed">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News */}
      {activeTab === 'news' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Latest Indian Market News
          </p>
          {news.length > 0 ? news.map((item, i) => (
            <div key={i} className="rounded-xl p-4"
              style={{
                background: '#1E2130',
                borderLeft: '3px solid #3A81F1'
              }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {item.url ? (
                    
                      <a href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium leading-snug
                        mb-1 hover:text-primary transition
                        cursor-pointer block"
                      style={{ color: 'white' }}
                    >
                      {item.title} ↗
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-white
                      leading-snug mb-1">
                      {item.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {item.source} · {item.date}
                  </p>
                  {item.body && (
                    <p className="text-xs text-gray-500 mt-2
                      leading-relaxed">
                      {item.body.slice(0, 150)}...
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end
                  gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-lg
                    bg-primary bg-opacity-10 text-primary">
                    News
                  </span>
                  {item.url && (
                    
                      <a href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-lg
                        transition flex items-center gap-1"
                      style={{
                        background: 'rgba(45,169,79,0.1)',
                        color:      '#2DA94F',
                        border:     '1px solid rgba(45,169,79,0.2)'
                      }}
                    >
                      Read Full Article ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No recent news found for this market.
            </p>
          )}
        </div>
      )}

      {/* Insights with Confidence */}
      {activeTab === 'insights' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Key Insights — Confidence Scored
          </p>
          <p className="text-xs text-gray-600 mb-2">
            * Score shows how many live sources support each insight
          </p>
          {scored.length > 0 ? scored.map((item, i) => (
            <div key={i} className="rounded-xl p-4 flex
              items-start gap-4"
              style={{ background: '#1E2130' }}>
              <div className="flex flex-col items-center
                flex-shrink-0 gap-1 min-w-12">
                <span className="text-lg font-bold"
                  style={{ color: confidenceColor(item.confidence) }}>
                  {item.confidence}%
                </span>
                <span className="text-xs px-1.5 py-0.5
                  rounded-full"
                  style={{
                    background: item.label === 'High'
                      ? 'rgba(45,169,79,0.15)'
                      : item.label === 'Medium'
                      ? 'rgba(253,189,0,0.15)'
                      : 'rgba(234,67,53,0.15)',
                    color: item.label === 'High' ? '#2DA94F'
                         : item.label === 'Medium' ? '#FDBD00'
                         : '#EA4335'
                  }}>
                  {item.label}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {item.insight}
                </p>
                <div className="mt-2 w-full rounded-full h-1"
                  style={{ background: '#2D3250' }}>
                  <div className="h-1 rounded-full"
                    style={{
                      width:      `${item.confidence}%`,
                      background: confidenceColor(item.confidence)
                    }}/>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No insights available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}