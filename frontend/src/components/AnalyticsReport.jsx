// frontend/src/components/AnalyticsReport.jsx

import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-xl text-xs"
      style={{ background: '#0D1117', border: '1px solid #2D3250' }}>
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((e, i) => (
        e.value !== null && e.value !== undefined ? (
          <p key={i} style={{ color: e.color || e.fill }}>
            {e.name}: {
              typeof e.value === 'number'
                ? e.value.toFixed(3)
                : e.value
            }
          </p>
        ) : null
      ))}
    </div>
  );
};

const GaugeCard = ({ metric }) => {
  const data = [
    { value: metric.value,         fill: metric.color },
    { value: 100 - metric.value,   fill: '#1E2130'    }
  ];
  return (
    <div className="rounded-xl p-4 flex flex-col items-center"
      style={{ background: '#1E2130' }}>
      <p className="text-xs text-gray-400 mb-2 text-center">
        {metric.title}
      </p>
      <div style={{ width: 110, height: 75, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="80%"
            innerRadius="55%" outerRadius="100%"
            startAngle={180} endAngle={0} data={data}>
            <RadialBar dataKey="value" cornerRadius={4}>
              {data.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <p className="text-base font-bold"
            style={{ color: metric.color }}>
            {metric.value}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {metric.description}
      </p>
    </div>
  );
};

const HeatmapViz = ({ heatmap }) => {
  if (!heatmap?.data?.length) return null;
  const flat   = heatmap.data.flat();
  const maxVal = Math.max(...flat);
  const minVal = Math.min(...flat);
  const getColor = (val) => {
    const t = (val - minVal) / (maxVal - minVal || 1);
    const r = Math.round(58  + (234 - 58)  * t);
    const g = Math.round(129 + (67  - 129) * t);
    const b = Math.round(241 + (53  - 241) * t);
    return `rgb(${r},${g},${b})`;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2 text-gray-400"></th>
            {(heatmap.cols || []).map((c, i) => (
              <th key={i}
                className="p-2 text-gray-400 text-center">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(heatmap.rows || []).map((row, i) => (
            <tr key={i}>
              <td className="p-2 text-gray-400 font-medium pr-3">
                {row}
              </td>
              {(heatmap.data[i] || []).map((val, j) => (
                <td key={j}
                  className="p-2 text-center rounded font-bold"
                  style={{
                    background: getColor(val),
                    color:      'white'
                  }}>
                  {typeof val === 'number' ? val.toFixed(1) : val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChartRenderer = ({ chart }) => {
  if (!chart?.series?.length) return null;
  const axisStyle = {
    tick:     { fill: '#9ca3af', fontSize: 10 },
    axisLine: { stroke: '#2D3250' }
  };

  const data = chart.series[0]?.data?.map(pt => {
    const row = { name: String(pt.x) };
    chart.series.forEach(s => {
      const found = s.data.find(
        d => d.x === pt.x || String(d.x) === String(pt.x)
      );
      row[s.name] = found?.y ?? null;
    });
    return row;
  }) || [];

  const annotations = chart.annotations || [];

  if (chart.type === 'area') return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          {chart.series.map((s, i) => (
            <linearGradient key={i}
              id={`ag${chart.id}${i}`}
              x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={s.color}
                stopOpacity={0.3}/>
              <stop offset="95%" stopColor={s.color}
                stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3250"/>
        <XAxis dataKey="name" {...axisStyle}/>
        <YAxis {...axisStyle}
          tickFormatter={v =>
            Math.abs(v) >= 1000 ? `${(v/1000).toFixed(1)}T`
            : Math.abs(v) >= 1  ? `${v.toFixed(1)}B`
            : `${v.toFixed(2)}`
          }/>
        <Tooltip content={<CustomTooltip />}/>
        <Legend
          wrapperStyle={{ color: '#9ca3af', fontSize: 11 }}/>
        {annotations.map((ann, i) => (
          <ReferenceLine key={i} x={String(ann.year)}
            stroke="#FDBD00" strokeDasharray="4 4"
            label={{
              value:    ann.label,
              fill:     '#FDBD00',
              fontSize: 9
            }}/>
        ))}
        {chart.series.map((s, i) => (
          <Area key={i} type="monotone" dataKey={s.name}
            stroke={s.color} strokeWidth={2.5}
            strokeDasharray={s.dashed ? "5 5" : "0"}
            fill={`url(#ag${chart.id}${i})`}
            connectNulls/>
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );

  if (chart.type === 'bar') return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3250"/>
        <XAxis dataKey="name" {...axisStyle}/>
        <YAxis {...axisStyle}/>
        <Tooltip content={<CustomTooltip />}/>
        <Legend
          wrapperStyle={{ color: '#9ca3af', fontSize: 11 }}/>
        <ReferenceLine y={0} stroke="#5F6368"/>
        {annotations.map((ann, i) => (
          <ReferenceLine key={i} x={String(ann.year)}
            stroke="#FDBD00" strokeDasharray="4 4"/>
        ))}
        {chart.series.map((s, i) => (
          <Bar key={i} dataKey={s.name}
            radius={[4, 4, 0, 0]}>
            {data.map((row, idx) => (
              <Cell key={idx}
                fill={parseFloat(row[s.name]) >= 0
                  ? s.color : '#EA4335'}/>
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  if (chart.type === 'line') return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3250"/>
        <XAxis dataKey="name" {...axisStyle}/>
        <YAxis {...axisStyle}/>
        <Tooltip content={<CustomTooltip />}/>
        <Legend
          wrapperStyle={{ color: '#9ca3af', fontSize: 11 }}/>
        {annotations.map((ann, i) => (
          <ReferenceLine key={i} x={String(ann.year)}
            stroke="#FDBD00" strokeDasharray="4 4"/>
        ))}
        {chart.series.map((s, i) => (
          <Line key={i} type="monotone" dataKey={s.name}
            stroke={s.color} strokeWidth={2.5}
            strokeDasharray={s.dashed ? "5 5" : "0"}
            dot={{ fill: s.color, r: 3 }}
            connectNulls/>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  return null;
};

const verdictStyle = {
  "Strong Buy": { color: '#2DA94F', bg: 'rgba(45,169,79,0.15)'  },
  "Buy":        { color: '#3A81F1', bg: 'rgba(58,129,241,0.15)' },
  "Hold":       { color: '#FDBD00', bg: 'rgba(253,189,0,0.15)'  },
  "Avoid":      { color: '#EA4335', bg: 'rgba(234,67,53,0.15)'  },
};

const impactStyle = {
  High:   { color: '#EA4335', bg: 'rgba(234,67,53,0.1)'  },
  Medium: { color: '#FDBD00', bg: 'rgba(253,189,0,0.1)'  },
  Low:    { color: '#2DA94F', bg: 'rgba(45,169,79,0.1)'  },
};

export default function AnalyticsReport({ report }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!report) return (
    <div className="text-gray-400 text-center py-8">
      No analytics data available.
    </div>
  );

  const tabs = [
    { id: 'overview',     label: '📊 Overview'       },
    { id: 'charts',       label: '📈 Charts'         },
    { id: 'volatility',   label: '⚡ Volatility'     },
    { id: 'heatmap',      label: '🌡️ Heatmap'       },
    { id: 'scatter',      label: '🔵 Correlation'    },
    { id: 'benchmark',    label: '🏆 Benchmark'      },
    { id: 'contribution', label: '🥧 Contribution'   },
    { id: 'forecast',     label: '🔮 Forecast'       },
    { id: 'insights',     label: '💡 Insights'       },
    { id: 'verdict',      label: '⚖️ Verdict'       },
  ];

  const verdict = report.analyst_verdict || {};
  const vStyle  = verdictStyle[verdict.rating] || verdictStyle["Hold"];
  const dq      = report.data_quality || {};
  const axisStyle = {
    tick:     { fill: '#9ca3af', fontSize: 10 },
    axisLine: { stroke: '#2D3250' }
  };

  return (
    <div className="w-full">

      {/* Header */}
      <div className="rounded-2xl p-6 mb-6"
        style={{
          background: 'linear-gradient(135deg, #1E2130, #0D1117)',
          border:     '1px solid rgba(58,129,241,0.2)'
        }}>
        <div className="flex items-start justify-between
          flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {report.report_title || 'Data Analytics Report'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              India Market · World Bank Data · Real Statistical Analysis
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: 'rgba(45,169,79,0.1)',
                  color:      '#2DA94F'
                }}>
                📊 {Object.keys(report.raw_stats || {}).length} Indicators
              </span>
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: 'rgba(58,129,241,0.1)',
                  color:      '#3A81F1'
                }}>
                🔬 Real Statistical Analysis
              </span>
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: 'rgba(253,189,0,0.1)',
                  color:      '#FDBD00'
                }}>
                📡 Agent 2 Integrated
              </span>
            </div>
          </div>
          {verdict.rating && (
            <div className="px-4 py-3 rounded-xl text-center"
              style={{
                background: vStyle.bg,
                border:     `1px solid ${vStyle.color}44`
              }}>
              <p className="text-xs text-gray-400">Analyst Rating</p>
              <p className="text-2xl font-bold"
                style={{ color: vStyle.color }}>
                {verdict.rating}
              </p>
              <p className="text-xs"
                style={{ color: vStyle.color }}>
                {verdict.confidence} Confidence
              </p>
            </div>
          )}
        </div>
        {report.analyst_summary && (
          <p className="text-sm text-gray-300 mt-4 leading-relaxed
            border-t border-gray-800 pt-4">
            {report.analyst_summary}
          </p>
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
              color:  activeTab === tab.id ? 'white'   : '#9ca3af',
              border: activeTab === tab.id
                ? 'none' : '1px solid #2D3250'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">

          {/* Data Quality */}
          {dq.overall_score !== undefined && (
            <div className="rounded-xl p-4"
              style={{
                background:  '#1E2130',
                borderLeft: `4px solid ${
                  dq.overall_score >= 70 ? '#2DA94F' :
                  dq.overall_score >= 40 ? '#FDBD00' : '#EA4335'
                }`
              }}>
              <div className="flex items-center
                justify-between mb-3">
                <p className="text-sm font-semibold text-white">
                  📋 Data Quality Report
                </p>
                <span className="text-lg font-bold"
                  style={{
                    color: dq.overall_score >= 70 ? '#2DA94F' :
                           dq.overall_score >= 40 ? '#FDBD00' : '#EA4335'
                  }}>
                  {dq.overall_score}%
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(dq.indicators || []).map((ind, i) => (
                  <div key={i} className="rounded-lg p-3"
                    style={{ background: '#0D1117' }}>
                    <p className="text-xs text-gray-400">
                      {ind.name}
                    </p>
                    <p className="text-sm font-bold text-white mt-1">
                      {ind.score}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {ind.data_points} pts · {ind.reliability}
                    </p>
                  </div>
                ))}
              </div>
              {dq.note && (
                <p className="text-xs text-gray-500 mt-2">
                  {dq.note}
                </p>
              )}
            </div>
          )}

          {/* Key Metrics */}
          {report.key_metrics?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase
                tracking-wider mb-3">
                Key Metrics — Real Computed Values
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3
                lg:grid-cols-4 gap-3">
                {report.key_metrics.map((m, i) => (
                  <div key={i} className="rounded-xl p-4"
                    style={{
                      background: '#1E2130',
                      borderTop:  `3px solid ${
                        m.trend === 'up'   ? '#2DA94F' :
                        m.trend === 'down' ? '#EA4335' : '#FDBD00'
                      }`
                    }}>
                    <p className="text-xs text-gray-400 mb-1">
                      {m.name}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {m.value}
                      <span className="text-xs text-gray-400 ml-1">
                        {m.unit}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs"
                        style={{
                          color: m.trend === 'up'   ? '#2DA94F' :
                                 m.trend === 'down' ? '#EA4335' : '#FDBD00'
                        }}>
                        {m.trend === 'up'   ? '▲' :
                         m.trend === 'down' ? '▼' : '●'} {m.change}
                      </span>
                    </div>
                    {m.annotation && (
                      <p className="text-xs text-gray-600 mt-1">
                        {m.annotation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gauges */}
          {report.gauge_metrics?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase
                tracking-wider mb-3">
                Market Health Indicators
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.gauge_metrics.map((g, i) => (
                  <GaugeCard key={i} metric={g} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHARTS ── */}
      {activeTab === 'charts' && (
        <div className="flex flex-col gap-6">
          {report.charts?.length > 0
            ? report.charts.map((chart, i) => (
              <div key={i} className="rounded-xl p-5"
                style={{ background: '#1E2130' }}>
                <h4 className="font-semibold text-white mb-1">
                  {chart.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed
                  mb-4" style={{ maxWidth: '90%' }}>
                  {chart.description}
                </p>
                {chart.annotations?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {chart.annotations.map((ann, j) => (
                      <span key={j}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(253,189,0,0.1)',
                          color:      '#FDBD00',
                          border:     '1px solid rgba(253,189,0,0.2)'
                        }}>
                        📌 {ann.year}: {ann.label}
                      </span>
                    ))}
                  </div>
                )}
                <ChartRenderer chart={chart} />
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-gray-500">
                    X: {chart.x_label}
                  </span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-500">
                    Y: {chart.y_label}
                  </span>
                </div>
              </div>
            ))
            : (
              <p className="text-gray-500 text-sm text-center py-8">
                No charts available.
              </p>
            )
          }
        </div>
      )}

      {/* ── VOLATILITY ── */}
      {activeTab === 'volatility' && (
        <div className="flex flex-col gap-4">
          {report.volatility_chart ? (
            <div className="rounded-xl p-5"
              style={{ background: '#1E2130' }}>
              <div className="flex items-center
                justify-between mb-2">
                <h4 className="font-semibold text-white">
                  {report.volatility_chart.title}
                </h4>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background:
                      report.volatility_chart.risk_level === 'High'
                        ? 'rgba(234,67,53,0.15)'
                      : report.volatility_chart.risk_level === 'Medium'
                        ? 'rgba(253,189,0,0.15)'
                        : 'rgba(45,169,79,0.15)',
                    color:
                      report.volatility_chart.risk_level === 'High'
                        ? '#EA4335'
                      : report.volatility_chart.risk_level === 'Medium'
                        ? '#FDBD00'
                        : '#2DA94F'
                  }}>
                  {report.volatility_chart.risk_level} Risk
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {report.volatility_chart.description}
              </p>
              {report.volatility_chart.annotation && (
                <p className="text-xs text-yellow-500 mb-4">
                  📌 {report.volatility_chart.annotation}
                </p>
              )}
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={(report.volatility_chart.data || []).map(d => ({
                    name:       String(d.year),
                    volatility: d.volatility,
                    ma3:        d.ma3
                  }))}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#2D3250"/>
                  <XAxis dataKey="name" {...axisStyle}/>
                  <YAxis {...axisStyle}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Legend
                    wrapperStyle={{ color: '#9ca3af', fontSize: 11 }}/>
                  <ReferenceLine y={0} stroke="#5F6368"/>
                  <Bar dataKey="volatility" name="YoY Change %"
                    radius={[4, 4, 0, 0]}>
                    {(report.volatility_chart.data || []).map(
                      (d, i) => (
                        <Cell key={i}
                          fill={d.volatility >= 0
                            ? '#3A81F1' : '#EA4335'}/>
                      )
                    )}
                  </Bar>
                  <Line type="monotone" dataKey="ma3"
                    name="3Y Moving Avg"
                    stroke="#FDBD00" strokeWidth={2}
                    dot={false} connectNulls/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No volatility data available.
            </p>
          )}
        </div>
      )}

      {/* ── HEATMAP ── */}
      {activeTab === 'heatmap' && (
        <div className="flex flex-col gap-4">
          {report.heatmap ? (
            <div className="rounded-xl p-5"
              style={{ background: '#1E2130' }}>
              <h4 className="font-semibold text-white mb-1">
                {report.heatmap.title}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">
                {report.heatmap.description}
              </p>
              <HeatmapViz heatmap={report.heatmap} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No heatmap data available.
            </p>
          )}
        </div>
      )}

      {/* ── SCATTER / CORRELATION ── */}
      {activeTab === 'scatter' && (
        <div className="flex flex-col gap-4">
          {report.scatter_analysis?.points?.length > 0 ? (
            <div className="rounded-xl p-5"
              style={{ background: '#1E2130' }}>
              <h4 className="font-semibold text-white mb-1">
                {report.scatter_analysis.title}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {report.scatter_analysis.description}
              </p>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(58,129,241,0.1)',
                    color:      '#3A81F1'
                  }}>
                  Direction: {report.scatter_analysis.correlation}
                </span>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(45,169,79,0.1)',
                    color:      '#2DA94F'
                  }}>
                  Strength: {
                    report.scatter_analysis.correlation_strength
                  }
                </span>
                {report.correlation_data?.gdp_vs_growth?.r
                  !== undefined && (
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(253,189,0,0.1)',
                      color:      '#FDBD00'
                    }}>
                    Pearson r = {
                      report.correlation_data.gdp_vs_growth.r
                    }
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#2D3250"/>
                  <XAxis dataKey="x"
                    name={report.scatter_analysis.x_label}
                    {...axisStyle}
                    tickFormatter={v =>
                      Math.abs(v) >= 1000
                        ? `${(v/1000).toFixed(0)}T`
                        : v.toFixed(1)
                    }/>
                  <YAxis dataKey="y"
                    name={report.scatter_analysis.y_label}
                    {...axisStyle}/>
                  <Tooltip content={<CustomTooltip />}
                    cursor={{ strokeDasharray: '3 3' }}/>
                  <Scatter
                    data={report.scatter_analysis.points}
                    fill="#3A81F1">
                    {(report.scatter_analysis.points || []).map(
                      (pt, i) => (
                        <Cell key={i} fill="#3A81F1"/>
                      )
                    )}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No correlation data available.
            </p>
          )}
        </div>
      )}

      {/* ── BENCHMARK ── */}
      {activeTab === 'benchmark' && (
        <div className="flex flex-col gap-4">
          {report.benchmark_comparison?.metrics?.length > 0 ? (
            <div className="rounded-xl p-5"
              style={{ background: '#1E2130' }}>
              <h4 className="font-semibold text-white mb-1">
                {report.benchmark_comparison.title}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">
                {report.benchmark_comparison.description}
              </p>
              <div className="flex flex-col gap-5">
                {report.benchmark_comparison.metrics.map((m, i) => {
                  const maxV = Math.max(
                    m.sector       || 0,
                    m.india_overall|| 0,
                    m.global_avg   || 0,
                    1
                  );
                  return (
                    <div key={i}>
                      <div className="flex items-center
                        justify-between mb-2">
                        <p className="text-sm font-medium text-white">
                          {m.name}
                        </p>
                        <span className="text-xs px-2 py-0.5
                          rounded-full"
                          style={{
                            background: m.winner === 'sector'
                              ? 'rgba(45,169,79,0.15)'
                              : 'rgba(253,189,0,0.15)',
                            color: m.winner === 'sector'
                              ? '#2DA94F' : '#FDBD00'
                          }}>
                          {m.winner === 'sector'
                            ? '🏆 Sector leads'
                            : '🇮🇳 India leads'}
                        </span>
                      </div>
                      {[
                        {
                          label: '🏭 Sector',
                          val:   m.sector,
                          color: '#3A81F1'
                        },
                        {
                          label: '🇮🇳 India',
                          val:   m.india_overall,
                          color: '#2DA94F'
                        },
                        {
                          label: '🌍 Global',
                          val:   m.global_avg,
                          color: '#5F6368'
                        },
                      ].map((row, j) => (
                        <div key={j}
                          className="flex items-center gap-3 mb-1.5">
                          <span className="text-xs w-20 flex-shrink-0"
                            style={{ color: row.color }}>
                            {row.label}
                          </span>
                          <div className="flex-1 rounded-full h-2"
                            style={{ background: '#2D3250' }}>
                            <div className="h-2 rounded-full"
                              style={{
                                width:      `${(row.val / maxV) * 100}%`,
                                background: row.color
                              }}/>
                          </div>
                          <span className="text-xs text-white
                            w-20 text-right">
                            {row.val} {m.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No benchmark data available.
            </p>
          )}
        </div>
      )}

      {/* ── SECTOR CONTRIBUTION ── */}
      {activeTab === 'contribution' && (
        <div className="flex flex-col gap-4">
          {report.sector_contribution?.data?.length > 0 ? (
            <div className="rounded-xl p-5"
              style={{ background: '#1E2130' }}>
              <div className="flex items-center
                justify-between mb-2">
                <h4 className="font-semibold text-white">
                  {report.sector_contribution.title}
                </h4>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(58,129,241,0.1)',
                    color:      '#3A81F1'
                  }}>
                  Current: {
                    report.sector_contribution.current_contribution
                  }
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {report.sector_contribution.description}
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={report.sector_contribution.data.map(d => ({
                    name:         String(d.year),
                    contribution: d.contribution
                  }))}>
                  <defs>
                    <linearGradient id="scGrad"
                      x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FDBD00"
                        stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FDBD00"
                        stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#2D3250"/>
                  <XAxis dataKey="name" {...axisStyle}/>
                  <YAxis {...axisStyle}
                    tickFormatter={v => `${v}%`}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Area type="monotone" dataKey="contribution"
                    name="GDP Contribution %"
                    stroke="#FDBD00" strokeWidth={2.5}
                    fill="url(#scGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No contribution data available.
            </p>
          )}
        </div>
      )}

      {/* ── FORECAST ── */}
      {activeTab === 'forecast' && (
        <div className="flex flex-col gap-4">
          {report.confidence_forecast ? (
            <div className="rounded-xl p-5"
              style={{ background: '#1E2130' }}>
              <div className="flex items-center
                justify-between mb-2">
                <h4 className="font-semibold text-white">
                  {report.confidence_forecast.title}
                </h4>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(45,169,79,0.1)',
                    color:      '#2DA94F'
                  }}>
                  {report.confidence_forecast.confidence_level} CI
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {report.confidence_forecast.description}
              </p>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4">
                {[
                  { color: '#3A81F1', label: 'Historical',    dash: false },
                  { color: '#FDBD00', label: 'Base Forecast', dash: true  },
                  { color: '#2DA94F', label: 'Upper Bound',   dash: true  },
                  { color: '#EA4335', label: 'Lower Bound',   dash: true  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg width="24" height="8">
                      {item.dash ? (
                        <line x1="0" y1="4" x2="24" y2="4"
                          stroke={item.color} strokeWidth="2"
                          strokeDasharray="4 3"/>
                      ) : (
                        <line x1="0" y1="4" x2="24" y2="4"
                          stroke={item.color} strokeWidth="2.5"/>
                      )}
                    </svg>
                    <span className="text-xs text-gray-400">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={(() => {
                  const cf   = report.confidence_forecast;
                  const hist = cf.historical     || [];
                  const base = cf.base_scenario  || [];
                  const up   = cf.upper_scenario || [];
                  const lo   = cf.lower_scenario || [];

                  const allYears = [
                    ...new Set([
                      ...hist.map(d => Number(d.year)),
                      ...base.map(d => Number(d.year)),
                    ])
                  ].sort((a, b) => a - b);

                  return allYears.map(yr => {
                    const h = hist.find(d => Number(d.year) === yr);
                    const b = base.find(d => Number(d.year) === yr);
                    const u = up.find(d => Number(d.year) === yr);
                    const l = lo.find(d => Number(d.year) === yr);
                    return {
                      name:       String(yr),
                      Historical: h ? h.value : null,
                      Forecast:   b ? b.value : null,
                      Upper:      u ? u.value : null,
                      Lower:      l ? l.value : null,
                    };
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#2D3250"/>
                  <XAxis dataKey="name" {...axisStyle}/>
                  <YAxis {...axisStyle}
                    tickFormatter={v =>
                      Math.abs(v) >= 1000
                        ? `${(v/1000).toFixed(1)}T`
                        : `${v.toFixed(1)}B`
                    }
                    label={{
                      value:    report.confidence_forecast.unit
                                || 'Billion USD',
                      angle:    -90,
                      position: 'insideLeft',
                      fill:     '#9ca3af',
                      fontSize: 9,
                      dx:       -5
                    }}/>
                  <Tooltip content={<CustomTooltip />}/>

                  {/* Historical */}
                  <Line type="monotone" dataKey="Historical"
                    stroke="#3A81F1" strokeWidth={2.5}
                    dot={{ fill: '#3A81F1', r: 3 }}
                    connectNulls={false}/>

                  {/* Base Forecast */}
                  <Line type="monotone" dataKey="Forecast"
                    stroke="#FDBD00" strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={{ fill: '#FDBD00', r: 3 }}
                    connectNulls={false}/>

                  {/* Upper Bound */}
                  <Line type="monotone" dataKey="Upper"
                    stroke="#2DA94F" strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls={false}/>

                  {/* Lower Bound */}
                  <Line type="monotone" dataKey="Lower"
                    stroke="#EA4335" strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls={false}/>
                </LineChart>
              </ResponsiveContainer>

              {/* Scenario cards */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  {
                    label: 'Base Case',
                    key:   'base_scenario',
                    color: '#FDBD00'
                  },
                  {
                    label: 'Best Case',
                    key:   'upper_scenario',
                    color: '#2DA94F'
                  },
                  {
                    label: 'Worst Case',
                    key:   'lower_scenario',
                    color: '#EA4335'
                  },
                ].map((sc, i) => {
                  const arr  = report.confidence_forecast[sc.key] || [];
                  const last = arr[arr.length - 1];
                  return (
                    <div key={i}
                      className="rounded-lg p-3 text-center"
                      style={{ background: '#0D1117' }}>
                      <p className="text-xs text-gray-400">
                        {sc.label}
                      </p>
                      <p className="text-sm font-bold mt-1"
                        style={{ color: sc.color }}>
                        {last?.value !== undefined
                          ? `${Number(last.value).toFixed(2)}B`
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {last?.year || 'N/A'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No forecast data available.
            </p>
          )}
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {activeTab === 'insights' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            AI Generated Insights — Based on Real Statistical Analysis
          </p>
          {report.automated_insights?.length > 0 ? (
            report.automated_insights.map((ins, i) => (
              <div key={i} className="rounded-xl p-4"
                style={{
                  background:  '#1E2130',
                  borderLeft: `4px solid ${
                    impactStyle[ins.impact]?.color || '#3A81F1'
                  }`
                }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: impactStyle[ins.impact]?.bg
                        || 'rgba(58,129,241,0.1)',
                      color: impactStyle[ins.impact]?.color || '#3A81F1'
                    }}>
                    {ins.type}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: impactStyle[ins.impact]?.bg
                        || 'rgba(58,129,241,0.1)',
                      color: impactStyle[ins.impact]?.color || '#3A81F1'
                    }}>
                    {ins.impact} Impact
                  </span>
                </div>
                <p className="text-sm text-white font-medium mb-1">
                  {ins.finding}
                </p>
                <p className="text-xs text-gray-400">
                  📌 Evidence: {ins.evidence}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No automated insights available.
            </p>
          )}
        </div>
      )}

      {/* ── VERDICT ── */}
      {activeTab === 'verdict' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-6"
            style={{
              background: vStyle.bg,
              border:     `1px solid ${vStyle.color}44`
            }}>
            <div className="flex items-center gap-6 mb-5">
              <div className="text-center">
                <p className="text-5xl font-bold"
                  style={{ color: vStyle.color }}>
                  {verdict.rating}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Analyst Rating
                </p>
              </div>
              <div className="flex-1 border-l border-gray-800 pl-5">
                <p className="text-sm font-semibold text-white mb-2">
                  🔑 Key Finding
                </p>
                <p className="text-sm text-gray-200 leading-relaxed">
                  {verdict.key_finding}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-400 mb-2">
                📋 Recommendation
              </p>
              <p className="text-sm text-gray-200 leading-relaxed">
                {verdict.recommendation}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: verdict.confidence === 'High'
                    ? 'rgba(45,169,79,0.15)'
                    : 'rgba(253,189,0,0.15)',
                  color: verdict.confidence === 'High'
                    ? '#2DA94F' : '#FDBD00'
                }}>
                {verdict.confidence} Confidence
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}