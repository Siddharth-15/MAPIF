# agents/advisor.py

from utils.llm_client import ask_llm
from utils.data_store import update_memory, get_full_memory

MAX_RETRIES = 2

def validate_report(report):
    required_sections = [
        "executive summary",
        "market analysis",
        "strategic recommendations",
        "roadmap evaluation",
        "risk mitigation",
        "budget",
        "next steps"
    ]
    report_lower = report.lower()
    missing      = [s for s in required_sections if s not in report_lower]
    if missing:
        return False, f"Missing sections: {', '.join(missing)}"
    if len(report) < 800:
        return False, "Report too short — needs more detail."
    return True, "Report valid."

def generate_report_with_llm(project_details, market_research,
                              roadmap, risk_summary, memory, attempt=1):
    project_name  = project_details.get("project_name",  "the project")
    industry      = project_details.get("industry",      "the industry")
    target_market = project_details.get("target_market", "the target market")
    objective     = project_details.get("objective",     "the objective")
    budget        = project_details.get("budget",        "the budget")
    timeline      = project_details.get("timeline",      "the timeline")

    llm_analysis  = market_research.get("llm_analysis",  "")
    insights      = market_research.get("insights",      [])

    con_phases    = roadmap["conservative"]["phases"]
    agg_phases    = roadmap["aggressive"]["phases"]
    con_risks     = risk_summary["conservative"]
    agg_risks     = risk_summary["aggressive"]
    con_top_risk  = con_risks.get("top_risk", {})
    agg_top_risk  = agg_risks.get("top_risk", {})

    system_prompt = f"""You are a world-class business advisor and strategy 
    consultant with 25 years of experience in {industry}. Generate a 
    comprehensive, highly specific final advisory report based on ALL 
    the agent outputs provided.

    STRICT REQUIREMENTS:
    - Every recommendation must be specific to {project_name} and {industry}
    - Reference actual data from market research and risk assessment
    - Compare conservative vs aggressive approaches with specific reasoning
    - Include specific budget allocation suggestions for {budget}
    - Include specific timeline milestones for {timeline}
    - Attempt number: {attempt} (if attempt > 1, be more detailed)

    You MUST include ALL these sections with exact headings:
    1. EXECUTIVE SUMMARY
    2. MARKET ANALYSIS FINDINGS
    3. STRATEGIC RECOMMENDATIONS
    4. ROADMAP EVALUATION
    5. RISK MITIGATION STRATEGY
    6. BUDGET & TIMELINE ASSESSMENT
    7. FINAL VERDICT & NEXT STEPS"""

    user_prompt = f"""
    PROJECT DETAILS:
    - Name          : {project_name}
    - Industry      : {industry}
    - Target Market : {target_market}
    - Objective     : {objective}
    - Budget        : {budget}
    - Timeline      : {timeline}

    COMPLETE AGENT MEMORY & CONTEXT:
    {memory}

    MARKET RESEARCH SUMMARY:
    {llm_analysis[:700]}

    KEY MARKET INSIGHTS:
    {chr(10).join(f"  • {i}" for i in insights[:5])}

    CONSERVATIVE ROADMAP:
    {chr(10).join([f"  Phase {i+1}: {p['title']} → {', '.join(p['tasks'][:2])}"
                   for i, p in enumerate(con_phases)])}

    AGGRESSIVE ROADMAP:
    {chr(10).join([f"  Phase {i+1}: {p['title']} → {', '.join(p['tasks'][:2])}"
                   for i, p in enumerate(agg_phases)])}

    RISK SUMMARY:
    Conservative — High: {con_risks['high_count']}, 
                  Medium: {con_risks['medium_count']}, 
                  Low: {con_risks['low_count']}
    Top Risk    : {con_top_risk.get('risk', 'N/A')}
    Prevention  : {con_top_risk.get('prevention', 'N/A')}

    Aggressive  — High: {agg_risks['high_count']}, 
                  Medium: {agg_risks['medium_count']}, 
                  Low: {agg_risks['low_count']}
    Top Risk    : {agg_top_risk.get('risk', 'N/A')}
    Prevention  : {agg_top_risk.get('prevention', 'N/A')}

    Generate a highly specific, actionable advisory report for {project_name}.
    Reference specific data points from the market research and risk assessment.
    Make concrete budget allocation suggestions and timeline milestones.
    """

    return ask_llm(system_prompt, user_prompt, max_tokens=2048)

def run_advisor(project_details, market_research, roadmap, risk_summary):
    print("Agent 6 - The Advisor is generating AI-powered final report...")

    memory   = get_full_memory()
    report   = ""
    is_valid = False

    for attempt in range(1, MAX_RETRIES + 2):
        print(f"  → Report generation attempt {attempt}...")
        report = generate_report_with_llm(
            project_details, market_research,
            roadmap, risk_summary, memory, attempt
        )
        is_valid, reason = validate_report(report)
        if is_valid:
            print(f"  ✓ Report validated on attempt {attempt}.")
            break
        else:
            print(f"  ✗ Validation failed: {reason}. Retrying...")

    memory_summary = f"""
    Final Report Generated : Yes
    Is Valid               : {is_valid}
    Report Preview         : {report[:300]}...
    """
    update_memory("Agent 6 — The Advisor", memory_summary)

    print("✅ Agent 6 - The Advisor has completed the validated AI advisory report.")
    return report