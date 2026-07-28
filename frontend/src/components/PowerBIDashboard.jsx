// frontend/src/components/PowerBIDashboard.jsx

import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, RadialBarChart,
  RadialBar
} from 'recharts';

// --- KPI Card ---
const KPICard = ({ kpi }) => (
  <div className="rounded-xl p-4 flex flex-col gap-2"
    style={{
      background:  '#1E2130',
      borderLeft:  `4px solid ${kpi.color}`,
      minWidth:    0
    }}>
    <div className="flex items-center justify-between">
      <span className="text-xl">{kpi.icon}</span>
      <span className="text-xs px-2 py-0.5 rounded-full"
        style={{
          background: kpi.trend === 'up'
            ? 'rgba(45,169,79,0.15)' : 'rgba(234,67,53,0.15)',
          color: kpi.trend === 'up' ? '#2DA94F' : '#EA4335'
        }}>
        {kpi.change}
      </span>
    </div>
    <p className="text-2xl font-bold" style={{ color: kpi.color }}>
      {kpi.value}
    </p>
    <p className="text-xs text-gray-400">{kpi.title}</p>
  </div>
);

// --- Gauge ---
const GaugeChart = ({ gauge }) => {
  const pct  = (gauge.value / gauge.max) * 100;
  const data = [
    { value: gauge.value,            fill: gauge.color },
    { value: gauge.max - gauge.value, fill: '#1E2130'  }
  ];
  return (
    <div className="rounded-xl p-4 flex flex-col items-center"
      style={{ background: '#1E2130' }}>
      <p className="text-sm font-medium text-white mb-2">{gauge.title}</p>
      <div style={{ width: 120, height: 80, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="80%"
            innerRadius="60%" outerRadius="100%"
            startAngle={180} endAngle={0}
            data={data}
          >
            <RadialBar dataKey="value" cornerRadius={4}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{
          position:  'absolute',
          bottom:    0,
          left:      '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <p className="text-lg font-bold"
            style={{ color: gauge.color }}>
            {gauge.value}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {gauge.description}
      </p>
    </div>
  );
};

// --- Heatmap ---
const Heatmap = ({ heatmap }) => {
  const maxVal = Math.max(...heatmap.data.flat());
  const getColor = (val) => {
    const intensity = val / maxVal;
    const r = Math.round(58  + (234 - 58)  * intensity);
    const g = Math.round(129 + (67  - 129) * intensity);
    const b = Math.round(241 + (53  - 241) * intensity);
    return `rgb(${r},${g},${b})`;
  };
  return (
    <div className="rounded-xl p-4" style={{ background: '#1E2130' }}>
      <p className="text-sm font-medium text-white mb-3">
        {heatmap.title}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-gray-400 p-1"></th>
              {heatmap.cols.map((col, i) => (
                <th key={i} className="text-gray-400 p-1 text-center">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.rows.map((row, i) => (
              <tr key={i}>
                <td className="text-gray-400 p-1 pr-2">{row}</td>
                {heatmap.data[i]?.map((val, j) => (
                  <td key={j} className="p-1 text-center rounded"
                    style={{
                      background: getColor(val),
                      color:      'white',
                      fontWeight: 'bold'
                    }}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">{heatmap.insight}</p>
    </div>
  );
};

// --- Data Table ---
const DataTable = ({ table }) => (
  <div className="rounded-xl p-4" style={{ background: '#1E2130' }}>
    <p className="text-sm font-medium text-white mb-3">{table.title}</p>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {table.columns.map((col, i) => (
              <th key={i}
                className="text-left py-2 pr-4 text-gray-400
                  text-xs font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}
              className="border-b border-gray-800 hover:bg-gray-800
                transition">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-gray-300 text-xs">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg p-3 shadow-xl"
        style={{
          background: '#0D1117',
          border:     '1px solid #2D3250'
        }}>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold"
            style={{ color: entry.color || entry.fill }}>
            {entry.name}: {typeof entry.value === 'number'
              ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Dashboard ---
export default function PowerBIDashboard({ config }) {
  const [activeSection, setActiveSection] = useState('overview');

  if (!config) return (
    <div className="text-gray-400 text-center py-8">
      No dashboard data available.
    </div>
  );

  const sections = [
    { id: 'overview',  label: '📊 Overview'  },
    { id: 'trends',    label: '📈 Trends'    },
    { id: 'analysis',  label: '🔍 Analysis'  },
    { id: 'forecast',  label: '🔮 Forecast'  },
    { id: 'insights',  label: '💡 Insights'  },
  ];

  const themeColor = config.theme_color || '#3A81F1';

  return (
    <div className="w-full" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Dashboard Header */}
      <div className="rounded-2xl p-6 mb-6"
        style={{
          background: `linear-gradient(135deg, #1E2130, #0D1117)`,
          border:     `1px solid ${themeColor}33`
        }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {config.dashboard_title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {config.dashboard_subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5
            rounded-full text-xs"
            style={{
              background: themeColor + '22',
              color:      themeColor,
              border:     `1px solid ${themeColor}44`
            }}>
            <span className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: themeColor }}/>
            AI Generated · Live Data
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {sections.map(s => (
            <button key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all"
              style={{
                background: activeSection === s.id
                  ? themeColor : '#2D3250',
                color: activeSection === s.id ? 'white' : '#9ca3af'
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="flex flex-col gap-6">

          {/* KPI Cards */}
          {config.kpis?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider
                mb-3">
                Key Performance Indicators
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {config.kpis.map((kpi, i) => (
                  <KPICard key={i} kpi={kpi} />
                ))}
              </div>
            </div>
          )}

          {/* Gauges */}
          {config.gauges?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider
                mb-3">
                Market Health Indicators
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {config.gauges.map((gauge, i) => (
                  <GaugeChart key={i} gauge={gauge} />
                ))}
              </div>
            </div>
          )}

          {/* Data Table */}
          {config.data_table && (
            <div>
              <p className="text-xs text-gray-400 uppercase
                tracking-wider mb-3">
                Market Data Summary
              </p>
              <DataTable table={config.data_table} />
            </div>
          )}
        </div>
      )}

      {/* Trends Section */}
      {activeSection === 'trends' && (
        <div className="flex flex-col gap-6">
          {config.line_charts?.map((chart, i) => (
            <div key={i} className="rounded-xl p-4"
              style={{ background: '#1E2130' }}>
              <p className="text-sm font-medium text-white mb-1">
                {chart.title}
              </p>
              <p className="text-xs text-gray-500 mb-4">{chart.insight}</p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chart.labels.map((label, idx) => ({
                  name: label,
                  ...Object.fromEntries(
                    chart.datasets.map(ds => [ds.label, ds.data[idx]])
                  )
                }))}>
                  <defs>
                    {chart.datasets.map((ds, di) => (
                      <linearGradient key={di}
                        id={`gradient${i}${di}`}
                        x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={ds.color}
                          stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={ds.color}
                          stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#2D3250" />
                  <XAxis dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2D3250' }} />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2D3250' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                  {chart.datasets.map((ds, di) => (
                    <Area key={di} type="monotone"
                      dataKey={ds.label}
                      stroke={ds.color}
                      strokeWidth={2.5}
                      strokeDasharray={ds.dashed ? "5 5" : "0"}
                      fill={`url(#gradient${i}${di})`} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Analysis Section */}
      {activeSection === 'analysis' && (
        <div className="flex flex-col gap-6">

          {/* Bar Charts */}
          {config.bar_charts?.map((chart, i) => (
            <div key={i} className="rounded-xl p-4"
              style={{ background: '#1E2130' }}>
              <p className="text-sm font-medium text-white mb-1">
                {chart.title}
              </p>
              <p className="text-xs text-gray-500 mb-4">{chart.insight}</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chart.labels.map((label, idx) => ({
                  name: label,
                  ...Object.fromEntries(
                    chart.datasets.map(ds => [ds.label, ds.data[idx]])
                  )
                }))}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#2D3250" />
                  <XAxis dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2D3250' }} />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2D3250' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                  {chart.datasets.map((ds, di) => (
                    <Bar key={di} dataKey={ds.label} radius={[4,4,0,0]}>
                      {chart.labels.map((_, idx) => (
                        <Cell key={idx}
                          fill={ds.colors?.[idx] || themeColor} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}

          {/* Pie Charts */}
          {config.pie_charts?.map((chart, i) => (
            <div key={i} className="rounded-xl p-4"
              style={{ background: '#1E2130' }}>
              <p className="text-sm font-medium text-white mb-1">
                {chart.title}
              </p>
              <p className="text-xs text-gray-500 mb-4">{chart.insight}</p>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chart.labels.map((label, idx) => ({
                        name:  label,
                        value: chart.data[idx]
                      }))}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chart.labels.map((_, idx) => (
                        <Cell key={idx}
                          fill={chart.colors?.[idx] || themeColor} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}

          {/* Heatmap */}
          {config.heatmap && (
            <Heatmap heatmap={config.heatmap} />
          )}
        </div>
      )}

      {/* Forecast Section */}
      {activeSection === 'forecast' && config.forecast_chart && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl p-4"
            style={{ background: '#1E2130' }}>
            <p className="text-sm font-medium text-white mb-1">
              {config.forecast_chart.title}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {config.forecast_chart.insight}
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={[
                ...config.forecast_chart.historical_labels.map(
                  (label, i) => ({
                    name:       label,
                    historical: config.forecast_chart.historical_data[i],
                    forecast:   null
                  })
                ),
                ...config.forecast_chart.forecast_labels.map(
                  (label, i) => ({
                    name:       label,
                    historical: null,
                    forecast:   config.forecast_chart.forecast_data[i]
                  })
                )
              ]}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0"
                    x2="0" y2="1">
                    <stop offset="5%"  stopColor={themeColor}
                      stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={themeColor}
                      stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="foreGrad" x1="0" y1="0"
                    x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FDBD00"
                      stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#FDBD00"
                      stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3250" />
                <XAxis dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#2D3250' }} />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#2D3250' }}
                  label={{
                    value:    config.forecast_chart.unit,
                    angle:    -90,
                    position: 'insideLeft',
                    fill:     '#9ca3af',
                    fontSize: 10
                  }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Area type="monotone" dataKey="historical"
                  name="Historical"
                  stroke={themeColor} strokeWidth={2.5}
                  fill="url(#histGrad)"
                  connectNulls={false} />
                <Area type="monotone" dataKey="forecast"
                  name="Forecast"
                  stroke="#FDBD00" strokeWidth={2.5}
                  strokeDasharray="6 3"
                  fill="url(#foreGrad)"
                  connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights Section */}
      {activeSection === 'insights' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            AI Generated Market Insights
          </p>
          {config.summary_insights?.map((insight, i) => (
            <div key={i} className="rounded-xl p-4 flex items-start gap-4"
              style={{
                background:  '#1E2130',
                borderLeft: `3px solid ${themeColor}`
              }}>
              <span className="text-lg flex-shrink-0">
                {['📈','🎯','⚡','🔍','🚀'][i % 5]}
              </span>
              <p className="text-gray-300 text-sm leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}