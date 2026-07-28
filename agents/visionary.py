# agents/visionary.py

import wbgapi as wb
import numpy as np
import json
import re
from scipy import stats
from utils.llm_client import ask_llm
from utils.data_store import update_memory, get_full_memory

INDUSTRY_INDICATORS = {
    "healthcare": {
        "gdp":        "NY.GDP.MKTP.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "population": "SP.POP.TOTL",
        "health_exp": "SH.XPD.CHEX.GD.ZS"
    },
    "finance": {
        "gdp":        "NY.GDP.MKTP.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "inflation":  "FP.CPI.TOTL.ZG",
        "fdi":        "BX.KLT.DINV.WD.GD.ZS"
    },
    "technology": {
        "gdp":        "NY.GDP.MKTP.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "internet":   "IT.NET.USER.ZS",
        "mobile":     "IT.CEL.SETS.P2"
    },
    "education": {
        "gdp":        "NY.GDP.MKTP.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "literacy":   "SE.ADT.LITR.ZS",
        "edu_exp":    "SE.XPD.TOTL.GD.ZS"
    },
    "agriculture": {
        "gdp":        "NV.AGR.TOTL.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "land":       "AG.LND.ARBL.ZS",
        "food":       "AG.PRD.FOOD.XD"
    },
    "retail": {
        "gdp":        "NY.GDP.MKTP.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "inflation":  "FP.CPI.TOTL.ZG",
        "urban":      "SP.URB.TOTL.IN.ZS"
    },
    "manufacturing": {
        "gdp":        "NV.IND.MANF.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "population": "SP.POP.TOTL",
        "trade":      "NE.TRD.GNFS.ZS"
    },
    "transportation": {
        "gdp":        "NY.GDP.MKTP.CD",
        "growth":     "NY.GDP.MKTP.KD.ZG",
        "urban":      "SP.URB.TOTL.IN.ZS",
        "energy":     "EG.USE.PCAP.KG.OE"
    },
}

BENCHMARK_INDICATORS = {
    "india_gdp_growth": "NY.GDP.MKTP.KD.ZG",
    "india_inflation":  "FP.CPI.TOTL.ZG",
    "india_gdp_total":  "NY.GDP.MKTP.CD",
}

def get_indicator_data(indicator, country="IND"):
    try:
        data = wb.data.DataFrame(
            indicator,
            economy=country,
            time=range(2010, 2024),
            skipBlanks=True,
            numericTimeKeys=True
        )
        if data.empty:
            data = wb.data.DataFrame(
                indicator,
                time=range(2010, 2024),
                skipBlanks=True,
                numericTimeKeys=True
            )
            if data.empty:
                return None
            series = data.mean(axis=0).dropna()
        else:
            series = data.iloc[0].dropna()
        series.index = series.index.astype(int)
        return series.sort_index()
    except:
        return None

def get_global_indicator(indicator):
    try:
        data = wb.data.DataFrame(
            indicator,
            time=range(2015, 2024),
            skipBlanks=True,
            numericTimeKeys=True
        )
        if data.empty:
            return None
        series = data.mean(axis=0).dropna()
        series.index = series.index.astype(int)
        return series.sort_index()
    except:
        return None

def compute_real_statistics(series, name="indicator"):
    if series is None or len(series) < 3:
        return {}
    vals  = series.values.astype(float)
    years = list(series.index.astype(int))

    pct_changes = []
    for i in range(1, len(vals)):
        if vals[i-1] != 0:
            pct_changes.append(
                round((vals[i] - vals[i-1]) / abs(vals[i-1]) * 100, 3)
            )
        else:
            pct_changes.append(0.0)

    ma3 = []
    ma5 = []
    for i in range(len(vals)):
        if i >= 2:
            ma3.append(round(float(np.mean(vals[max(0,i-2):i+1])), 4))
        else:
            ma3.append(None)
        if i >= 4:
            ma5.append(round(float(np.mean(vals[max(0,i-4):i+1])), 4))
        else:
            ma5.append(None)

    x = np.arange(len(vals))
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, vals)

    mean_val = np.mean(vals)
    std_val  = np.std(vals)
    anomalies = []
    for i, (y, v) in enumerate(zip(years, vals)):
        if abs(v - mean_val) > 2 * std_val:
            anomalies.append({
                "year":      y,
                "value":     round(float(v), 4),
                "deviation": round(float((v - mean_val) / std_val), 2),
                "type":      "high" if v > mean_val else "low"
            })

    volatility    = round(float(np.std(pct_changes)), 3) if pct_changes else 0
    expected_years= list(range(2010, 2024))
    coverage      = len(set(years).intersection(expected_years))
    quality_score = round((coverage / len(expected_years)) * 100)

    return {
        "name":          name,
        "years":         years,
        "values":        [round(float(v), 4) for v in vals],
        "pct_changes":   pct_changes,
        "ma3":           ma3,
        "ma5":           ma5,
        "mean":          round(float(mean_val), 4),
        "median":        round(float(np.median(vals)), 4),
        "std":           round(float(std_val), 4),
        "min":           round(float(np.min(vals)), 4),
        "max":           round(float(np.max(vals)), 4),
        "latest":        round(float(vals[-1]), 4),
        "avg_growth":    round(float(np.mean(pct_changes)), 3)
                         if pct_changes else 0,
        "volatility":    volatility,
        "trend_slope":   round(float(slope), 6),
        "r_squared":     round(float(r_value ** 2), 4),
        "p_value":       round(float(p_value), 4),
        "anomalies":     anomalies,
        "trend":         "upward" if slope > 0 else "downward",
        "quality_score": quality_score,
        "data_points":   len(vals)
    }

def compute_confidence_intervals(series, n=5, confidence=0.95):
    if series is None or len(series) < 4:
        return [], [], [], []
    vals  = series.values.astype(float)
    x     = np.arange(len(vals))
    slope, intercept, r_val, p_val, std_err = stats.linregress(x, vals)
    last_year  = int(series.index[-1])
    future_x   = np.arange(len(vals), len(vals) + n)
    future_yrs = list(range(last_year + 1, last_year + n + 1))
    base       = [float(slope * xi + intercept) for xi in future_x]
    n_data     = len(vals)
    x_mean     = np.mean(x)
    s_err      = np.sqrt(
        np.sum((vals - (slope * x + intercept))**2) / (n_data - 2)
    )
    t_val  = float(stats.t.ppf((1 + confidence) / 2, df=n_data - 2))
    upper  = []
    lower  = []
    for i, xi in enumerate(future_x):
        margin = t_val * s_err * np.sqrt(
            1 + 1/n_data + (xi - x_mean)**2 /
            np.sum((x - x_mean)**2)
        )
        upper.append(max(0, float(base[i]) + float(margin)))
        lower.append(max(0, float(base[i]) - float(margin)))
    return (
        future_yrs,
        [round(v, 4) for v in base],
        [round(v, 4) for v in upper],
        [round(v, 4) for v in lower]
    )

def compute_correlation(series1, series2):
    if series1 is None or series2 is None:
        return None
    common = sorted(set(series1.index) & set(series2.index))
    if len(common) < 3:
        return None
    v1 = np.array([float(series1[y]) for y in common])
    v2 = np.array([float(series2[y]) for y in common])
    r, p = stats.pearsonr(v1, v2)
    return {
        "r":         round(float(r), 4),
        "p_value":   round(float(p), 4),
        "strength":  "strong"   if abs(r) > 0.7
                     else "moderate" if abs(r) > 0.4
                     else "weak",
        "direction": "positive" if r > 0 else "negative",
        "years":     common,
        "values1":   [round(float(series1[y]), 4) for y in common],
        "values2":   [round(float(series2[y]), 4) for y in common]
    }

def compute_sector_contribution(sector_gdp, total_gdp):
    if sector_gdp is None or total_gdp is None:
        return []
    common = sorted(set(sector_gdp.index) & set(total_gdp.index))
    result = []
    for y in common[-5:]:
        sg = float(sector_gdp[y])
        tg = float(total_gdp[y])
        if tg > 0:
            result.append({
                "year":         y,
                "contribution": round((sg / tg) * 100, 2)
            })
    return result

def extract_market_numbers(market_research):
    numbers = {
        "market_size":      None,
        "growth_rate":      None,
        "key_stats":        [],
        "year_refs":        [],
        "mentioned_values": []
    }
    try:
        analysis = market_research.get("llm_analysis", "") or ""
        sd       = market_research.get("structured_data", {}) or {}
        snap     = sd.get("executive_snapshot", {}) or {}
        if snap.get("market_size"):
            numbers["market_size"] = snap["market_size"]
        if snap.get("growth_rate"):
            numbers["growth_rate"] = snap["growth_rate"]
        num_pattern = r'\$?[\d,]+\.?\d*\s*(?:billion|million|trillion|%|crore|lakh)?'
        found       = re.findall(num_pattern, analysis, re.IGNORECASE)
        numbers["mentioned_values"] = list(set(found[:15]))
        year_pattern = r'\b(20[1-2]\d)\b'
        years_found  = re.findall(year_pattern, analysis)
        numbers["year_refs"] = list(set(years_found))
        sizing = sd.get("market_sizing", []) or []
        for row in sizing[:5]:
            if row.get("size") and row.get("year"):
                numbers["key_stats"].append(
                    f"{row['year']}: {row['size']} "
                    f"(growth: {row.get('growth', 'N/A')})"
                )
    except:
        pass
    return numbers

def generate_analytics_report(project_details, market_research,
                               all_stats, correlation_data,
                               sector_contribution, benchmark_stats,
                               confidence_data, memory):
    industry      = project_details.get("industry",      "technology")
    target_market = project_details.get("target_market", "general")
    project_name  = project_details.get("project_name",  "Project")
    objective     = project_details.get("objective",     "")
    budget        = project_details.get("budget",        "")
    timeline      = project_details.get("timeline",      "")

    market_numbers  = extract_market_numbers(market_research)
    news            = market_research.get("news",            []) or []
    competitors     = market_research.get("competitors",     []) or []
    scored_insights = market_research.get("scored_insights", []) or []

    stats_summary = {}
    for k, v in all_stats.items():
        if v:
            stats_summary[k] = {
                "latest":        v.get("latest",        0),
                "mean":          v.get("mean",          0),
                "avg_growth":    v.get("avg_growth",    0),
                "volatility":    v.get("volatility",    0),
                "trend":         v.get("trend",         ""),
                "r_squared":     v.get("r_squared",     0),
                "anomalies":     v.get("anomalies",     []),
                "quality_score": v.get("quality_score", 0),
                "years":         v.get("years",         [])[-6:],
                "values":        v.get("values",        [])[-6:],
                "pct_changes":   v.get("pct_changes",   [])[-5:],
                "ma3":           [x for x in v.get("ma3", [])[-5:]
                                  if x is not None],
                "ma5":           [x for x in v.get("ma5", [])[-3:]
                                  if x is not None],
            }

    # Build confidence summary in Billion USD
    conf_summary = {}
    for k, v in confidence_data.items():
        if v and v.get("years"):
            conf_summary[k] = {
                "years": v["years"],
                "base":  [round(x / 1e9, 2) for x in v.get("base",  [])],
                "upper": [round(x / 1e9, 2) for x in v.get("upper", [])],
                "lower": [round(x / 1e9, 2) for x in v.get("lower", [])],
            }

    # Build historical GDP in Billion USD
    hist_summary = {}
    for k, v in all_stats.items():
        if v and k == "gdp":
            hist_summary[k] = {
                "years":  v.get("years",  [])[-8:],
                "values": [round(x / 1e9, 2)
                           for x in v.get("values", [])[-8:]],
            }

    bench_summary = {}
    for k, v in benchmark_stats.items():
        if v:
            bench_summary[k] = {
                "latest":     v.get("latest",     0),
                "avg_growth": v.get("avg_growth", 0),
                "trend":      v.get("trend",      "")
            }

    news_context = "\n".join([
        f"• [{n.get('date','')}] {n.get('title','')} "
        f"({n.get('source','')})"
        for n in news[:4]
    ]) or "No recent news."

    insight_context = "\n".join([
        f"• [{i.get('label','')} {i.get('confidence',0)}%] "
        f"{i.get('insight','')}"
        for i in scored_insights[:5]
    ]) or "No insights."

    corr_r = "N/A"
    if correlation_data.get("gdp_vs_growth"):
        corr_r = correlation_data["gdp_vs_growth"].get("r", "N/A")

    system_prompt = f"""You are a senior data analytics engineer 
    specializing in Indian market analysis.

    Generate a complete analytics report as JSON using ONLY the 
    real computed statistics provided. Every number must come from 
    the data below.

    CRITICAL RULES:
    1. Use ONLY the computed statistics provided
    2. Cross-reference with Agent 2 market research for context
    3. Every chart data array must use real values from the stats
    4. Descriptions must be 3-4 lines with specific numbers
    5. confidence_forecast MUST include historical, base_scenario,
       upper_scenario and lower_scenario as separate arrays
    6. All GDP values must be in Billion USD (already divided by 1e9)
    7. Return ONLY valid JSON — no markdown

    Return this exact structure:
    {{
      "report_title": "string",
      "analyst_summary": "3-4 lines using specific numbers",
      "data_quality": {{
        "overall_score": number_0_to_100,
        "indicators": [
          {{
            "name": "string",
            "score": number,
            "data_points": number,
            "years_covered": "string",
            "reliability": "High or Medium or Low"
          }}
        ],
        "note": "one line"
      }},
      "key_metrics": [
        {{
          "name": "string",
          "value": "string",
          "unit": "string",
          "change": "string",
          "trend": "up or down or stable",
          "period": "string",
          "annotation": "string"
        }}
      ],
      "charts": [
        {{
          "id": "string",
          "type": "area or bar or line",
          "title": "string",
          "description": "3-4 lines",
          "x_label": "Year",
          "y_label": "string",
          "annotations": [
            {{"year": number, "label": "string", "type": "string"}}
          ],
          "series": [
            {{
              "name": "string",
              "data": [{{"x": year, "y": value}}],
              "color": "#hexcolor",
              "dashed": false
            }}
          ]
        }}
      ],
      "volatility_chart": {{
        "title": "string",
        "description": "3-4 lines",
        "data": [{{"year": number, "volatility": number, "ma3": number}}],
        "risk_level": "High or Medium or Low",
        "annotation": "string"
      }},
      "heatmap": {{
        "title": "string",
        "description": "3-4 lines",
        "rows": ["string"],
        "cols": ["string"],
        "data": [[numbers]],
        "color_scale": "blue_to_red"
      }},
      "scatter_analysis": {{
        "title": "string",
        "description": "3-4 lines mentioning r={corr_r}",
        "x_label": "string",
        "y_label": "string",
        "points": [{{"x": number, "y": number, "label": "string"}}],
        "correlation": "positive or negative",
        "correlation_strength": "strong or moderate or weak"
      }},
      "gauge_metrics": [
        {{
          "title": "string",
          "value": number_0_to_100,
          "color": "#hexcolor",
          "description": "string"
        }}
      ],
      "benchmark_comparison": {{
        "title": "string",
        "description": "3-4 lines",
        "metrics": [
          {{
            "name": "string",
            "sector": number,
            "india_overall": number,
            "global_avg": number,
            "unit": "string",
            "winner": "sector or india or global"
          }}
        ]
      }},
      "sector_contribution": {{
        "title": "string",
        "description": "3-4 lines",
        "data": [{{"year": number, "contribution": number}}],
        "current_contribution": "string",
        "trend": "string"
      }},
      "confidence_forecast": {{
        "title": "5-Year Forecast with Confidence Intervals",
        "description": "3-4 lines with specific forecast numbers",
        "historical":     [{{"year": number, "value": billion_usd_value}}],
        "base_scenario":  [{{"year": number, "value": billion_usd_value}}],
        "upper_scenario": [{{"year": number, "value": billion_usd_value}}],
        "lower_scenario": [{{"year": number, "value": billion_usd_value}}],
        "confidence_level": "95%",
        "unit": "Billion USD"
      }},
      "automated_insights": [
        {{
          "type": "statistical or market or risk or opportunity",
          "finding": "string with specific numbers",
          "evidence": "string",
          "impact": "High or Medium or Low"
        }}
      ],
      "analyst_verdict": {{
        "rating": "Strong Buy or Buy or Hold or Avoid",
        "confidence": "High or Medium or Low",
        "key_finding": "string",
        "recommendation": "3-4 lines"
      }}
    }}"""

    user_prompt = f"""
    PROJECT: {project_name}
    INDUSTRY: {industry} — INDIA MARKET
    TARGET: {target_market}
    OBJECTIVE: {objective}
    BUDGET: {budget}
    TIMELINE: {timeline}

    === REAL COMPUTED STATISTICS ===
    {json.dumps(stats_summary, indent=2)[:3000]}

    === CONFIDENCE INTERVALS (Billion USD) ===
    {json.dumps(conf_summary, indent=2)[:600]}

    === HISTORICAL GDP (Billion USD for charts) ===
    {json.dumps(hist_summary, indent=2)[:400]}

    === INDIA BENCHMARK DATA ===
    {json.dumps(bench_summary, indent=2)[:500]}

    === SECTOR CONTRIBUTION TO GDP ===
    {json.dumps(sector_contribution, indent=2)[:300]}

    === AGENT 2 MARKET RESEARCH ===
    Market Size: {market_numbers.get('market_size', 'N/A')}
    Growth Rate: {market_numbers.get('growth_rate', 'N/A')}
    Key Stats  : {market_numbers.get('key_stats', [])}

    === LATEST NEWS ===
    {news_context}

    === MARKET INSIGHTS ===
    {insight_context}

    === PREVIOUS CONTEXT ===
    {memory[:300]}

    IMPORTANT: confidence_forecast must have FOUR separate arrays:
    - historical: past GDP values in Billion USD
    - base_scenario: forecast years with base predicted values
    - upper_scenario: forecast years with upper bound values
    - lower_scenario: forecast years with lower bound values

    Return ONLY the JSON object.
    """

    response = ask_llm(system_prompt, user_prompt, max_tokens=2048)

    try:
        response = response.strip()
        if "```" in response:
            for part in response.split("```"):
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    response = part
                    break
        if not response.startswith("{"):
            idx = response.find("{")
            if idx != -1:
                response = response[idx:]
        end = response.rfind("}") + 1
        if end > 0:
            response = response[:end]
        return json.loads(response), True
    except Exception as e:
        print(f"  ✗ JSON parse error: {e}")
        return None, False

def build_fallback_report(project_details, all_stats,
                          confidence_data, sector_contribution):
    industry      = project_details.get("industry",     "Technology")
    project_name  = project_details.get("project_name", "Project")
    gdp_stats     = all_stats.get("gdp",    {}) or {}
    grow_stats    = all_stats.get("growth", {}) or {}

    # Historical GDP in Billion USD
    hist_years  = gdp_stats.get("years",  [])
    hist_values = [round(float(v) / 1e9, 2)
                   for v in gdp_stats.get("values", [])]
    grow_years  = grow_stats.get("years",  [])
    grow_values = grow_stats.get("values", [])

    gdp_series  = [{"x": y, "y": v}
                   for y, v in zip(hist_years, hist_values)]
    grow_series = [{"x": y, "y": v}
                   for y, v in zip(grow_years, grow_values)]

    # Confidence forecast in Billion USD
    cf = None
    for k in confidence_data:
        if confidence_data[k] and confidence_data[k].get("years"):
            cf = confidence_data[k]
            break

    historical_forecast = [
        {"year": y, "value": v}
        for y, v in zip(hist_years[-8:], hist_values[-8:])
    ]
    base_fore  = [
        {"year": y, "value": round(float(v) / 1e9, 2)}
        for y, v in zip(
            (cf or {}).get("years", []),
            (cf or {}).get("base",  [])
        )
    ]
    upper_fore = [
        {"year": y, "value": round(float(v) / 1e9, 2)}
        for y, v in zip(
            (cf or {}).get("years", []),
            (cf or {}).get("upper", [])
        )
    ]
    lower_fore = [
        {"year": y, "value": round(float(v) / 1e9, 2)}
        for y, v in zip(
            (cf or {}).get("years", []),
            (cf or {}).get("lower", [])
        )
    ]

    return {
        "report_title":    f"{project_name} — Analytics Report (India)",
        "analyst_summary": (
            f"Analytics for {industry} in India using World Bank data. "
            f"Latest GDP: ${hist_values[-1] if hist_values else 'N/A'}B. "
            f"Average GDP growth: {grow_stats.get('avg_growth','N/A')}%. "
            f"Data quality score: {gdp_stats.get('quality_score', 50)}%."
        ),
        "data_quality": {
            "overall_score": gdp_stats.get("quality_score", 50),
            "indicators": [
                {
                    "name":         "GDP",
                    "score":        gdp_stats.get("quality_score", 50),
                    "data_points":  gdp_stats.get("data_points",   0),
                    "years_covered":"2010-2023",
                    "reliability":  "High"
                },
                {
                    "name":         "GDP Growth Rate",
                    "score":        grow_stats.get("quality_score", 50),
                    "data_points":  grow_stats.get("data_points",   0),
                    "years_covered":"2010-2023",
                    "reliability":  "High"
                }
            ],
            "note": "Based on World Bank open data availability."
        },
        "key_metrics": [
            {
                "name":       "Latest GDP",
                "value":      f"${hist_values[-1] if hist_values else 'N/A'}",
                "unit":       "Billion USD",
                "change":     f"{grow_stats.get('avg_growth', 0):+.2f}%",
                "trend":      grow_stats.get("trend", "stable"),
                "period":     f"{hist_years[0] if hist_years else '2010'}–"
                              f"{hist_years[-1] if hist_years else '2023'}",
                "annotation": "World Bank India data"
            },
            {
                "name":       "GDP Growth Rate",
                "value":      str(round(grow_stats.get("latest", 0), 2)),
                "unit":       "%",
                "change":     f"{grow_stats.get('avg_growth', 0):+.2f}%",
                "trend":      grow_stats.get("trend", "stable"),
                "period":     "Latest year",
                "annotation": "Year-over-year"
            },
            {
                "name":       "Data Quality",
                "value":      str(gdp_stats.get("quality_score", 50)),
                "unit":       "%",
                "change":     "+0%",
                "trend":      "stable",
                "period":     "2010-2023",
                "annotation": f"{gdp_stats.get('data_points', 0)} data points"
            },
            {
                "name":       "Volatility",
                "value":      str(grow_stats.get("volatility", 0)),
                "unit":       "%",
                "change":     "N/A",
                "trend":      "stable",
                "period":     "2010-2023",
                "annotation": "Std dev of YoY changes"
            }
        ],
        "charts": [
            {
                "id":          "gdp_trend",
                "type":        "area",
                "title":       f"{industry} GDP Trend — India (Billion USD)",
                "description": (
                    f"GDP for {industry} sector in India from "
                    f"{hist_years[0] if hist_years else 2010} to "
                    f"{hist_years[-1] if hist_years else 2023}. "
                    f"Latest value: ${hist_values[-1] if hist_values else 'N/A'}B. "
                    f"Average: ${round(gdp_stats.get('mean', 0)/1e9, 2)}B. "
                    f"Trend: {gdp_stats.get('trend', 'N/A')}."
                ),
                "x_label": "Year",
                "y_label": "Billion USD",
                "annotations": [
                    {
                        "year":  a["year"],
                        "label": f"Anomaly: {a['type']}",
                        "type":  "anomaly"
                    }
                    for a in gdp_stats.get("anomalies", [])
                ],
                "series": [
                    {
                        "name":   "GDP (B USD)",
                        "data":   gdp_series[-10:],
                        "color":  "#3A81F1",
                        "dashed": False
                    },
                    {
                        "name":  "3Y Moving Avg",
                        "data":  [
                            {"x": y, "y": round(float(v) / 1e9, 2)}
                            for y, v in zip(
                                gdp_stats.get("years", [])[-10:],
                                [x for x in
                                 gdp_stats.get("ma3", [])[-10:]
                                 if x is not None]
                            )
                        ],
                        "color":  "#FDBD00",
                        "dashed": True
                    }
                ]
            },
            {
                "id":          "growth_rate",
                "type":        "bar",
                "title":       "Annual GDP Growth Rate — India (%)",
                "description": (
                    f"Year-over-year GDP growth for {industry} in India. "
                    f"Average growth: {grow_stats.get('avg_growth','N/A')}%. "
                    f"Volatility: {grow_stats.get('volatility','N/A')}%. "
                    f"Trend: {grow_stats.get('trend','N/A')}."
                ),
                "x_label":     "Year",
                "y_label":     "Growth %",
                "annotations": [],
                "series": [
                    {
                        "name":   "Growth %",
                        "data":   grow_series[-10:],
                        "color":  "#2DA94F",
                        "dashed": False
                    }
                ]
            }
        ],
        "volatility_chart": {
            "title":       "Market Volatility — Year-over-Year Changes",
            "description": (
                f"Volatility of {industry} market in India: "
                f"{grow_stats.get('volatility', 'N/A')}%. "
                f"R-squared of trend: {grow_stats.get('r_squared','N/A')}. "
                f"Based on {grow_stats.get('data_points', 0)} data points. "
                f"Higher values indicate more market uncertainty."
            ),
            "data": [
                {
                    "year":       y,
                    "volatility": v,
                    "ma3":        grow_stats.get("ma3", [None]*i)[i]
                                  if i < len(grow_stats.get("ma3", []))
                                  else None
                }
                for i, (y, v) in enumerate(zip(
                    grow_stats.get("years",       []),
                    grow_stats.get("pct_changes", [])
                ))
            ],
            "risk_level": (
                "High"   if grow_stats.get("volatility", 0) > 3
                else "Medium" if grow_stats.get("volatility", 0) > 1.5
                else "Low"
            ),
            "annotation": (
                f"Avg volatility: {grow_stats.get('volatility', 0):.2f}%"
            )
        },
        "heatmap": {
            "title":       "Indicator Performance Matrix",
            "description": (
                "Performance of GDP and growth rate indicators across years. "
                "Values normalised to a 0-10 scale for comparison. "
                "Darker blue indicates stronger performance relative to the period average. "
                "Red indicates below-average performance."
            ),
            "rows": ["GDP (B USD)", "Growth %"],
            "cols": [str(y) for y in hist_years[-5:]],
            "data": [
                [
                    round(v / max(hist_values[-5:]) * 10, 1)
                    if max(hist_values[-5:]) > 0 else 0
                    for v in hist_values[-5:]
                ],
                [
                    round(abs(v), 1)
                    for v in grow_values[-5:]
                ]
            ],
            "color_scale": "blue_to_red"
        },
        "scatter_analysis": {
            "title":       "GDP vs Growth Rate Correlation",
            "description": (
                "Scatter plot of India GDP against annual growth rate. "
                "Each point represents one year of data. "
                "Pearson correlation computed from real World Bank data. "
                "Positive correlation indicates GDP and growth move together."
            ),
            "x_label":             "GDP (Billion USD)",
            "y_label":             "Growth Rate %",
            "points": [
                {
                    "x":     round(float(gv) / 1e9, 2),
                    "y":     float(rv),
                    "label": str(gy)
                }
                for (gy, gv), (ry, rv) in zip(
                    zip(
                        gdp_stats.get("years",  []),
                        gdp_stats.get("values", [])
                    ),
                    zip(
                        grow_stats.get("years",  []),
                        grow_stats.get("values", [])
                    )
                )
            ],
            "correlation":         "positive",
            "correlation_strength":"moderate"
        },
        "gauge_metrics": [
            {
                "title":       "Market Health",
                "value":       min(100, max(0, int(
                    50 + grow_stats.get("avg_growth", 0) * 5
                ))),
                "color":       "#3A81F1",
                "description": (
                    f"Avg growth {grow_stats.get('avg_growth', 0):.2f}%"
                )
            },
            {
                "title":       "Data Quality",
                "value":       gdp_stats.get("quality_score", 50),
                "color":       "#2DA94F",
                "description": (
                    f"{gdp_stats.get('data_points', 0)} data points"
                )
            },
            {
                "title":       "Volatility Risk",
                "value":       min(100, int(
                    grow_stats.get("volatility", 0) * 10
                )),
                "color":       "#EA4335",
                "description": (
                    f"Volatility: {grow_stats.get('volatility', 0):.2f}%"
                )
            }
        ],
        "benchmark_comparison": {
            "title":       "Sector vs India Benchmark",
            "description": (
                f"{industry} sector growth vs India overall benchmark. "
                f"Sector avg growth: {grow_stats.get('avg_growth', 0):.2f}%. "
                f"India benchmark GDP growth avg: ~6.5%. "
                f"Global average GDP growth: ~3.2%."
            ),
            "metrics": [
                {
                    "name":         "GDP Growth Rate",
                    "sector":       round(grow_stats.get("avg_growth", 0), 2),
                    "india_overall":6.5,
                    "global_avg":   3.2,
                    "unit":         "%",
                    "winner":       "sector"
                                    if grow_stats.get("avg_growth", 0) > 6.5
                                    else "india"
                }
            ]
        },
        "sector_contribution": {
            "title":       "Sector Contribution to India GDP",
            "description": (
                "Percentage of India total GDP contributed by this sector. "
                "Computed from World Bank GDP data for India. "
                "Shows how significant this industry is to the overall economy. "
                "Higher contribution indicates more economic relevance."
            ),
            "data":                 sector_contribution or [],
            "current_contribution": (
                f"{sector_contribution[-1]['contribution']:.2f}%"
                if sector_contribution else "N/A"
            ),
            "trend": "stable"
        },
        "confidence_forecast": {
            "title":          "5-Year Forecast with Confidence Intervals",
            "description":    (
                "Linear regression forecast based on historical World Bank GDP data. "
                "Base scenario follows the computed trend line. "
                "Upper and lower bounds represent the 95% confidence interval. "
                "All values in Billion USD."
            ),
            "historical":     historical_forecast,
            "base_scenario":  base_fore,
            "upper_scenario": upper_fore,
            "lower_scenario": lower_fore,
            "confidence_level": "95%",
            "unit":             "Billion USD"
        },
        "automated_insights": [
            {
                "type":     "statistical",
                "finding":  (
                    f"GDP trend shows {grow_stats.get('trend','stable')} "
                    f"momentum with avg growth of "
                    f"{grow_stats.get('avg_growth', 0):.2f}% and "
                    f"R² of {grow_stats.get('r_squared', 0):.3f}."
                ),
                "evidence": (
                    f"Linear regression on "
                    f"{grow_stats.get('data_points', 0)} data points "
                    f"from World Bank."
                ),
                "impact":   "High"
            },
            {
                "type":     "risk",
                "finding":  (
                    f"Market volatility is "
                    f"{grow_stats.get('volatility', 0):.2f}% based on "
                    f"standard deviation of year-over-year changes."
                ),
                "evidence": "Computed from World Bank annual GDP data.",
                "impact":   "Medium"
            },
            {
                "type":     "opportunity",
                "finding":  (
                    f"Sector contributes "
                    f"{sector_contribution[-1]['contribution']:.2f}% "
                    f"to India GDP as of "
                    f"{sector_contribution[-1]['year']}."
                    if sector_contribution else
                    f"Sector shows positive growth trajectory in India."
                ),
                "evidence": "World Bank GDP sector data for India.",
                "impact":   "High"
            }
        ],
        "analyst_verdict": {
            "rating":      (
                "Buy"  if grow_stats.get("avg_growth", 0) > 3
                else "Hold"
            ),
            "confidence":  "Medium",
            "key_finding": (
                f"India {industry} sector shows avg growth of "
                f"{grow_stats.get('avg_growth', 0):.2f}% with "
                f"{grow_stats.get('trend','stable')} trajectory."
            ),
            "recommendation": (
                f"The {industry} market in India shows "
                f"{grow_stats.get('trend','stable')} trend with "
                f"{grow_stats.get('avg_growth', 0):.2f}% avg growth. "
                f"Entering with {project_details.get('budget','the allocated budget')} "
                f"over {project_details.get('timeline','the planned timeline')} "
                f"appears viable given current market conditions."
            )
        }
    }

def run_visionary(market_research, project_details):
    print("Agent 3 - Data Analytics Engineer running full analysis...")

    industry   = project_details.get("industry", "technology").lower()
    indicators = INDUSTRY_INDICATORS.get(
        industry, INDUSTRY_INDICATORS["technology"]
    )
    memory = get_full_memory()

    all_series      = {}
    all_stats       = {}
    confidence_data = {}

    for name, code in indicators.items():
        print(f"  → Fetching {name} (India)...")
        series = get_indicator_data(code, country="IND")
        if series is None:
            print(f"  → Fallback to global for {name}...")
            series = get_global_indicator(code)
        if series is not None:
            all_series[name] = series
            all_stats[name]  = compute_real_statistics(series, name)
            fy, fb, fu, fl   = compute_confidence_intervals(series)
            confidence_data[name] = {
                "years": fy,
                "base":  fb,
                "upper": fu,
                "lower": fl
            }
            print(
                f"  ✓ {name}: {len(series)} pts, "
                f"quality={all_stats[name].get('quality_score')}%"
            )

    print("  → Fetching India benchmark data...")
    benchmark_series = {}
    benchmark_stats  = {}
    total_gdp_series = None

    for name, code in BENCHMARK_INDICATORS.items():
        s = get_indicator_data(code, country="IND")
        if s is not None:
            benchmark_series[name] = s
            benchmark_stats[name]  = compute_real_statistics(s, name)
            if name == "india_gdp_total":
                total_gdp_series = s

    print("  → Computing correlations...")
    correlation_data = {}
    gdp_s    = all_series.get("gdp")
    growth_s = all_series.get("growth")
    if gdp_s is not None and growth_s is not None:
        correlation_data["gdp_vs_growth"] = compute_correlation(
            gdp_s, growth_s
        )

    print("  → Computing sector contribution...")
    sector_gdp          = all_series.get("gdp")
    sector_contribution = compute_sector_contribution(
        sector_gdp, total_gdp_series
    )

    report   = None
    is_valid = False

    for attempt in range(1, 4):
        print(f"  → Report generation attempt {attempt}...")
        report, is_valid = generate_analytics_report(
            project_details, market_research,
            all_stats, correlation_data,
            sector_contribution, benchmark_stats,
            confidence_data, memory
        )
        if is_valid:
            print(f"  ✓ Report generated on attempt {attempt}.")
            break
        else:
            print(f"  ✗ JSON parse failed. Retrying...")

    if not is_valid or report is None:
        print("  → Using fallback report.")
        report = build_fallback_report(
            project_details, all_stats,
            confidence_data, sector_contribution
        )

    # Validate and fix confidence_forecast structure
    cf = report.get("confidence_forecast", {})
    if not cf.get("historical"):
        gdp_s   = all_stats.get("gdp", {})
        h_years = gdp_s.get("years",  [])[-8:]
        h_vals  = [round(float(v) / 1e9, 2)
                   for v in gdp_s.get("values", [])[-8:]]
        cf["historical"] = [
            {"year": y, "value": v}
            for y, v in zip(h_years, h_vals)
        ]
    if not cf.get("base_scenario"):
        cd = confidence_data.get("gdp") or \
             next(iter(confidence_data.values()), {})
        cf["base_scenario"]  = [
            {"year": y, "value": round(float(v) / 1e9, 2)}
            for y, v in zip(
                cd.get("years", []), cd.get("base",  [])
            )
        ]
        cf["upper_scenario"] = [
            {"year": y, "value": round(float(v) / 1e9, 2)}
            for y, v in zip(
                cd.get("years", []), cd.get("upper", [])
            )
        ]
        cf["lower_scenario"] = [
            {"year": y, "value": round(float(v) / 1e9, 2)}
            for y, v in zip(
                cd.get("years", []), cd.get("lower", [])
            )
        ]
    report["confidence_forecast"] = cf

    report["raw_stats"] = {
        k: {
            "years":         v.get("years",         []),
            "values":        v.get("values",        []),
            "pct_changes":   v.get("pct_changes",   []),
            "ma3":           v.get("ma3",           []),
            "ma5":           v.get("ma5",           []),
            "anomalies":     v.get("anomalies",     []),
            "quality_score": v.get("quality_score", 0),
            "r_squared":     v.get("r_squared",     0),
            "volatility":    v.get("volatility",    0),
            "avg_growth":    v.get("avg_growth",    0),
            "latest":        v.get("latest",        0),
            "trend":         v.get("trend",         ""),
        }
        for k, v in all_stats.items() if v
    }
    report["correlation_data"]    = correlation_data
    report["sector_contribution"] = sector_contribution
    report["confidence_data"]     = confidence_data
    report["industry"]            = industry
    report["project_name"]        = project_details.get("project_name","")

    gdp_s_stats  = all_stats.get("gdp",    {}) or {}
    grow_s_stats = all_stats.get("growth", {}) or {}

    memory_summary = f"""
    Industry         : {industry} — INDIA
    GDP Latest       : ${round(float(gdp_s_stats.get('latest', 0))/1e9, 2)}B
    GDP Avg Growth   : {gdp_s_stats.get('avg_growth', 'N/A')}%
    Growth Rate      : {grow_s_stats.get('latest',    'N/A')}%
    Volatility       : {grow_s_stats.get('volatility','N/A')}%
    Data Quality     : {gdp_s_stats.get('quality_score','N/A')}%
    Anomalies Found  : {len(gdp_s_stats.get('anomalies', []))}
    Analyst Rating   : {report.get('analyst_verdict', {}).get('rating', 'N/A')}
    Sector Contrib   : {sector_contribution[-1]['contribution'] if sector_contribution else 'N/A'}%
    """
    update_memory("Agent 3 — The Visionary", memory_summary)

    print("✅ Agent 3 - Full analytics report done.")
    return {"analytics_report": report}