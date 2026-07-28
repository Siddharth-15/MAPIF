# agents/analyst.py

import nltk
from nltk.tokenize import sent_tokenize
from ddgs import DDGS
from datetime import datetime
import requests
import json
from utils.llm_client import ask_llm
from utils.data_store import update_memory, get_full_memory
nltk.download('punkt',     quiet=True)
nltk.download('punkt_tab', quiet=True)

MAX_RETRIES = 2

BANNED_WORDS = [
    "leverage", "synergy", "robust", "scalable", "ecosystem",
    "paradigm", "utilize", "stakeholder", "streamline",
    "cutting-edge", "best-in-class", "holistic", "disruptive",
    "value-added", "thought leader", "proactive", "deep dive",
    "move the needle", "going forward"
]

def get_industry_format(industry):
    formats = {
        "healthcare":    ["Patient Demographics","Regulatory Landscape","Technology Adoption","Key Players","Investment Trends","Challenges","Opportunities"],
        "finance":       ["Economic Indicators","Regulatory Environment","Digital Transformation","Key Players","Investment Trends","Risk Factors","Opportunities"],
        "technology":    ["Market Size & Growth","Technology Trends","Key Players","Startup Activity","Regulatory Landscape","Challenges","Opportunities"],
        "education":     ["Student Demographics","EdTech Adoption","Key Players","Government Policy","Challenges","Digital Opportunities","Future Outlook"],
        "agriculture":   ["Production Trends","AgriTech Innovation","Key Players","Government Policy","Climate Factors","Supply Chain","Opportunities"],
        "retail":        ["Consumer Behavior","E-commerce Trends","Key Players","Supply Chain","Pricing & Inflation","Challenges","Opportunities"],
        "manufacturing": ["Production Trends","Automation & Industry 4.0","Key Players","Cost Factors","Export Trends","Challenges","Opportunities"],
        "transportation":["Market Size & Growth","Urban Mobility Trends","Key Players","Regulatory Landscape","Technology Innovation","Challenges","Opportunities"],
    }
    for key in formats:
        if key in industry.lower():
            return formats[key]
    return ["Market Overview","Key Trends","Key Players","Challenges","Opportunities","Future Outlook","Recommendations"]

def generate_smart_queries(industry, target_market, objective, project_name):
    system_prompt = """Generate exactly 4 specific search queries 
    for Indian market research. Focus on getting real India-specific data.
    
    Respond ONLY in this format:
    QUERY 1: [query]
    QUERY 2: [query]
    QUERY 3: [query]
    QUERY 4: [query]"""

    user_prompt = f"""
    Industry: {industry}
    Target Market: {target_market}
    Project: {project_name}
    Country: India
    
    Generate 4 India-specific queries targeting:
    1. Indian market size and revenue statistics 2025 2026
    2. Top Indian companies and competitors in this space
    3. Latest trends in India for this industry
    4. Challenges and opportunities in Indian market
    
    Always include "India" in every query.
    Make queries specific and include year 2025 or 2026.
    """

    response = ask_llm(system_prompt, user_prompt, max_tokens=250)
    queries  = []
    for line in response.strip().split('\n'):
        if line.startswith("QUERY"):
            parts = line.split(":", 1)
            if len(parts) > 1:
                queries.append(parts[1].strip())

    if len(queries) < 4:
        queries = [
            f"{industry} market size India 2025 2026 statistics",
            f"{industry} top companies India competitors {target_market}",
            f"{industry} India latest trends technology 2026",
            f"{industry} India market challenges opportunities growth"
        ]
    return queries[:4]

def scrape_multiple_queries(queries):
    all_results = []
    seen_texts  = set()
    for query in queries:
        try:
            with DDGS() as ddgs:
                results = ddgs.text(query, max_results=5)
                for r in results:
                    text = r.get("body", "")
                    if len(text) > 60 and text not in seen_texts:
                        seen_texts.add(text)
                        all_results.append({
                            "text":   text,
                            "source": r.get("href",  ""),
                            "title":  r.get("title", ""),
                            "query":  query
                        })
        except Exception as e:
            print(f"  ✗ Search error: {str(e)}")
    return all_results

def scrape_news_data(industry, target_market):
    try:
        news = []
        seen = set()
        queries = [
            f"{industry} market India news 2026",
            f"{industry} India {target_market} latest news"
        ]
        for query in queries:
            with DDGS() as ddgs:
                results = ddgs.news(query, max_results=4)
                for r in results:
                    title = r.get("title", "")
                    url   = r.get("url",   "")
                    if title and title not in seen:
                        seen.add(title)
                        news.append({
                            "title":  title,
                            "body":   r.get("body",   ""),
                            "source": r.get("source", ""),
                            "date":   r.get("date",   ""),
                            "url":    url
                        })
        return news[:6]
    except Exception as e:
        print(f"  ✗ News error: {str(e)}")
        return []

def get_wikipedia_data(industry):
    try:
        for term in [
            f"{industry} industry in India",
            f"{industry} India",
            f"{industry} industry"
        ]:
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{term.replace(' ', '_')}"
            r   = requests.get(url, timeout=8)
            if r.status_code == 200:
                extract = r.json().get("extract", "")
                if len(extract) > 100:
                    return extract[:1000]
        return ""
    except:
        return ""

def generate_structured_analysis(raw_results, news_results,
                                  wiki_data, project_details,
                                  memory, attempt=1):
    industry      = project_details.get("industry",      "technology")
    target_market = project_details.get("target_market", "general")
    objective     = project_details.get("objective",     "")
    project_name  = project_details.get("project_name",  "Project")
    budget        = project_details.get("budget",        "$50,000")
    timeline      = project_details.get("timeline",      "6 months")

    raw_text  = "\n\n".join([
        f"[Source {i+1}]: {r['text']}"
        for i, r in enumerate(raw_results[:12])
    ])
    news_text = "\n".join([
        f"• [{n['date']}] {n['title']}: {n['body'][:120]}"
        for n in news_results[:5]
    ]) or "No recent news."
    wiki_text = f"Background: {wiki_data[:500]}" if wiki_data else ""
    banned    = ", ".join(BANNED_WORDS[:10])

    system_prompt = f"""You are a senior market research analyst 
    specializing in the Indian market at a top consulting firm. 
    Generate a structured JSON market research report focused on 
    INDIA for {project_name} in the {industry} industry.
    
    IMPORTANT: All market data, statistics, companies and insights 
    must be specific to the INDIAN market. Use INR or USD values 
    relevant to India. Mention Indian companies, Indian regulations 
    and Indian market conditions.

    CRITICAL RULES:
    1. Use search results as PRIMARY source
    2. Fill gaps with accurate industry knowledge
    3. NEVER use these words: {banned}
    4. All numbers must be specific and realistic
    5. Write like a real analyst — direct and factual
    6. Attempt: {attempt} — be more specific if retrying

    Return ONLY valid JSON with this exact structure:
    {{
      "executive_snapshot": {{
        "market_size": "specific value like $189.25 billion",
        "growth_rate": "specific % like 21.3% CAGR",
        "key_opportunity": "one specific opportunity in 10 words",
        "market_size_source": "source name or estimated",
        "growth_rate_source": "source name or estimated",
        "year": "2025 or 2026"
      }},
      "market_sizing": [
        {{
          "year": "2023",
          "size": "value",
          "growth": "%",
          "note": "brief context"
        }}
      ],
      "trends": [
        {{
          "title": "trend name",
          "finding": "2-3 sentences of specific evidence",
          "impact": "High or Medium or Low",
          "evidence": "specific stat or fact from sources"
        }}
      ],
      "competitive_landscape": [
        {{
          "company": "company name",
          "strength": "what they do well",
          "weakness": "their limitation",
          "market_share": "% or estimated or unknown"
        }}
      ],
      "swot": {{
        "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
        "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
        "opportunities": ["specific opportunity 1", "specific opportunity 2", "specific opportunity 3"],
        "threats": ["specific threat 1", "specific threat 2", "specific threat 3"]
      }},
      "bottom_line": {{
        "recommendation": "2 sentences max — direct advice for this project",
        "confidence": "High or Medium or Low",
        "reasoning": "one sentence why"
      }}
    }}"""

    user_prompt = f"""
    PROJECT: {project_name}
    INDUSTRY: {industry}
    TARGET MARKET: {target_market}
    OBJECTIVE: {objective}
    BUDGET: {budget}
    TIMELINE: {timeline}

    CONTEXT: {memory[:300]}

    {wiki_text}

    LIVE SEARCH DATA ({len(raw_results)} sources):
    {raw_text[:4000]}

    RECENT NEWS:
    {news_text}

    Generate the structured JSON market research report.
    Use real numbers from sources. Fill gaps with accurate knowledge.
    Return ONLY the JSON — no markdown, no explanation.
    """

    response = ask_llm(system_prompt, user_prompt, max_tokens=2048)

    try:
        response = response.strip()
        if "```" in response:
            parts    = response.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    response = part
                    break
        response = response.strip()
        if not response.startswith("{"):
            idx = response.find("{")
            if idx != -1:
                response = response[idx:]
        end_idx = response.rfind("}") + 1
        if end_idx > 0:
            response = response[:end_idx]
        data = json.loads(response)
        return data, True
    except Exception as e:
        print(f"  ✗ JSON parse error: {e}")
        return None, False

def build_fallback_analysis(project_details, raw_results):
    industry     = project_details.get("industry",     "Technology")
    target_market= project_details.get("target_market","general")
    project_name = project_details.get("project_name", "Project")

    insights = []
    try:
        all_text  = " ".join([r["text"] for r in raw_results[:5]])
        sentences = sent_tokenize(all_text)
        keywords  = ["market","growth","billion","million","%","trend","company"]
        insights  = [s for s in sentences
                     if any(k in s.lower() for k in keywords)][:5]
    except:
        pass

    return {
        "executive_snapshot": {
            "market_size":        "Data being gathered",
            "growth_rate":        "Data being gathered",
            "key_opportunity":    f"Growing demand in {industry} sector",
            "market_size_source": "Live search",
            "growth_rate_source": "Live search",
            "year":               "2025"
        },
        "market_sizing": [
            {"year": "2023", "size": "N/A", "growth": "N/A", "note": "Data collection in progress"},
            {"year": "2024", "size": "N/A", "growth": "N/A", "note": "Data collection in progress"},
            {"year": "2025", "size": "N/A", "growth": "N/A", "note": "Projected"},
        ],
        "trends": [
            {
                "title":    f"Digital Growth in {industry}",
                "finding":  insights[0] if insights else f"The {industry} market is growing rapidly.",
                "impact":   "High",
                "evidence": insights[1] if len(insights) > 1 else "Based on live search data."
            }
        ],
        "competitive_landscape": [
            {
                "company":      "Major Player 1",
                "strength":     "Market leader with wide reach",
                "weakness":     "High pricing",
                "market_share": "Unknown"
            }
        ],
        "swot": {
            "strengths":     [f"Growing {industry} market", "Clear target audience", "Strong objective"],
            "weaknesses":    ["Budget constraints", "Timeline pressure", "Market competition"],
            "opportunities": [f"Expanding {target_market} segment", "Technology adoption", "Digital transformation"],
            "threats":       ["Established competitors", "Regulatory changes", "Economic uncertainty"]
        },
        "bottom_line": {
            "recommendation": f"The {industry} market shows potential for {project_name}. Focus on differentiating from existing players.",
            "confidence":     "Medium",
            "reasoning":      "Based on available market data and industry trends."
        }
    }

def score_insight_confidence(insight, raw_results):
    words   = [w for w in insight.lower().split() if len(w) > 4]
    matches = sum(1 for r in raw_results
                  if any(w in r["text"].lower() for w in words))
    total   = len(raw_results)
    if total == 0:
        return 50
    return min(max(round((matches / total) * 100), 10), 95)

def extract_scored_insights(structured_data, raw_results):
    insights = []
    try:
        for trend in structured_data.get("trends", []):
            text       = trend.get("finding", "")
            confidence = score_insight_confidence(text, raw_results)
            insights.append({
                "insight":    text,
                "confidence": confidence,
                "label":      "High"   if confidence >= 70
                              else "Medium" if confidence >= 40
                              else "Low"
            })
        for opp in structured_data.get("swot", {}).get("opportunities", []):
            confidence = score_insight_confidence(opp, raw_results)
            insights.append({
                "insight":    opp,
                "confidence": confidence,
                "label":      "High"   if confidence >= 70
                              else "Medium" if confidence >= 40
                              else "Low"
            })
    except:
        pass
    return insights[:8]

def run_analyst(project_details):
    print("Agent 2 - The Analyst is conducting professional market research...")

    industry      = project_details.get("industry",      "technology")
    target_market = project_details.get("target_market", "general")
    project_name  = project_details.get("project_name",  "Project")
    objective     = project_details.get("objective",     "")
    scraped_at    = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("  → Generating smart search queries...")
    queries = generate_smart_queries(
        industry, target_market, objective, project_name
    )
    print(f"  → Queries: {queries}")

    print("  → Running multi-query search...")
    raw_results = scrape_multiple_queries(queries)
    print(f"  → Found {len(raw_results)} unique results")

    print("  → Fetching latest news...")
    news_results = scrape_news_data(industry, target_market)
    print(f"  → Found {len(news_results)} news articles")

    print("  → Fetching Wikipedia context...")
    wiki_data = get_wikipedia_data(industry)

    memory           = get_full_memory()
    structured_data  = None
    is_valid         = False

    for attempt in range(1, MAX_RETRIES + 2):
        print(f"  → Analysis attempt {attempt}...")
        structured_data, is_valid = generate_structured_analysis(
            raw_results, news_results, wiki_data,
            project_details, memory, attempt
        )
        if is_valid:
            print(f"  ✓ Structured analysis generated on attempt {attempt}.")
            break
        else:
            print(f"  ✗ JSON parse failed. Retrying...")

    if not is_valid or structured_data is None:
        print("  → Using fallback analysis.")
        structured_data = build_fallback_analysis(
            project_details, raw_results
        )

    scored_insights = extract_scored_insights(structured_data, raw_results)
    plain_insights  = [i["insight"] for i in scored_insights]

    memory_summary = f"""
    Industry         : {industry}
    Target Market    : {target_market}
    Scraped At       : {scraped_at}
    Queries Used     : {queries}
    Results Found    : {len(raw_results)} text, {len(news_results)} news
    Market Size      : {structured_data.get('executive_snapshot', {}).get('market_size', 'N/A')}
    Growth Rate      : {structured_data.get('executive_snapshot', {}).get('growth_rate', 'N/A')}
    Key Opportunity  : {structured_data.get('executive_snapshot', {}).get('key_opportunity', 'N/A')}
    """
    update_memory("Agent 2 — The Analyst", memory_summary)

    market_research = {
        "query":            " | ".join(queries),
        "queries":          queries,
        "raw_data":         [r["text"] for r in raw_results],
        "insights":         plain_insights,
        "scored_insights":  scored_insights,
        "structured_data":  structured_data,
        "llm_analysis":     json.dumps(structured_data),
        "news":             news_results,
        "wiki_data":        wiki_data,
        "scraped_at":       scraped_at,
        "is_valid":         is_valid,
        "summary": f"Professional market research for {industry} "
                   f"targeting {target_market}."
    }

    print("✅ Agent 2 completed professional structured market research.")
    return market_research