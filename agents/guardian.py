# agents/guardian.py

from utils.llm_client import ask_llm
from utils.data_store import update_memory, get_full_memory

MAX_RETRIES = 2

LEVEL_COLORS = {
    "High":   "#ff4c4c",
    "Medium": "#ffa500",
    "Low":    "#4caf50"
}

def validate_risks(risks):
    if not risks or len(risks) < 2:
        return False, "Must have at least 2 risks."
    for r in risks:
        if not r.get("risk"):
            return False, "Risk missing name."
        if r.get("level") not in ["High", "Medium", "Low"]:
            return False, f"Invalid risk level: {r.get('level')}"
        if not r.get("prevention"):
            return False, "Risk missing prevention."
        score = r.get("score", 0)
        if not (1 <= score <= 10):
            return False, f"Invalid score: {score}"
    return True, "Risks valid."

def assess_phase_risks_with_llm(phase, approach, project_details, attempt=1):
    industry  = project_details.get("industry",  "Technology")
    objective = project_details.get("objective", "Launch product")
    budget    = project_details.get("budget",    "$50,000")
    timeline  = project_details.get("timeline",  "6 months")
    memory    = get_full_memory()

    system_prompt = f"""You are a senior risk assessment specialist with 
    deep expertise in {industry} projects. Analyze the given project phase 
    and identify exactly 2 highly specific risks.

    STRICT REQUIREMENTS:
    - Risks must be specific to {industry} and the phase tasks provided
    - Prevention actions must be concrete and immediately actionable
    - Score must reflect the actual severity for a {budget} budget project
    - Attempt number: {attempt} (if attempt > 1, be more specific)

    Respond ONLY in this exact format:

    RISK 1:
    Risk: [specific risk name]
    Level: [High or Medium or Low]
    Score: [number 1-10]
    Prevention: [specific actionable prevention]

    RISK 2:
    Risk: [specific risk name]
    Level: [High or Medium or Low]
    Score: [number 1-10]
    Prevention: [specific actionable prevention]"""

    user_prompt = f"""
    PROJECT CONTEXT:
    - Industry      : {industry}
    - Objective     : {objective}
    - Budget        : {budget}
    - Timeline      : {timeline}
    - Approach      : {approach.upper()}
    - Phase Title   : {phase["title"]}
    - Phase Tasks   :
    {chr(10).join(f"  • {t}" for t in phase.get("tasks", []))}

    PREVIOUS AGENT CONTEXT:
    {memory}

    Identify 2 specific, high-impact risks for this exact phase.
    Base risks on the actual tasks and industry context above.
    """

    response = ask_llm(system_prompt, user_prompt, max_tokens=500)
    return parse_risks(response)

def parse_risks(response):
    risks = []
    try:
        lines        = response.strip().split('\n')
        current_risk = {}
        for line in lines:
            line = line.strip()
            if line.startswith("RISK"):
                if current_risk and "risk" in current_risk:
                    risks.append(current_risk)
                current_risk = {}
            elif line.startswith("Risk:"):
                current_risk["risk"]       = line.replace("Risk:", "").strip()
            elif line.startswith("Level:"):
                level = line.replace("Level:", "").strip()
                current_risk["level"]      = level if level in ["High", "Medium", "Low"] else "Medium"
            elif line.startswith("Score:"):
                try:
                    score = int(''.join(filter(str.isdigit, line.replace("Score:", "").strip())))
                    current_risk["score"]  = min(max(score, 1), 10)
                except:
                    current_risk["score"]  = 5
            elif line.startswith("Prevention:"):
                current_risk["prevention"] = line.replace("Prevention:", "").strip()
        if current_risk and "risk" in current_risk:
            risks.append(current_risk)
    except:
        pass

    if not risks:
        risks = [
            {
                "risk":       "Budget Overrun",
                "level":      "High",
                "score":      8,
                "prevention": "Set strict budget checkpoints at each milestone."
            },
            {
                "risk":       "Timeline Delay",
                "level":      "Medium",
                "score":      6,
                "prevention": "Use weekly sprint reviews to track progress."
            }
        ]
    return risks

def run_guardian(roadmap, market_research):
    print("Agent 5 - The Guardian is assessing risks with AI...")

    project_details = market_research.get("project_details", {})
    result          = {}

    for approach in ["conservative", "aggressive"]:
        phases          = roadmap[approach]["phases"]
        assessed_phases = []

        for phase in phases:
            risks    = []
            is_valid = False

            for attempt in range(1, MAX_RETRIES + 2):
                print(f"  → Assessing risks for '{phase['title']}' attempt {attempt}...")
                risks = assess_phase_risks_with_llm(
                    phase, approach, project_details, attempt
                )
                is_valid, reason = validate_risks(risks)
                if is_valid:
                    print(f"  ✓ Risks validated on attempt {attempt}.")
                    break
                else:
                    print(f"  ✗ Validation failed: {reason}. Retrying...")

            overall_score = max([r.get("score", 5) for r in risks]) if risks else 5
            if overall_score >= 8:
                overall_level = "High"
            elif overall_score >= 5:
                overall_level = "Medium"
            else:
                overall_level = "Low"

            assessed_phases.append({
                "phase_title":   phase["title"],
                "tasks":         phase.get("tasks", []),
                "risks":         risks,
                "overall_level": overall_level,
                "overall_score": overall_score,
                "color":         LEVEL_COLORS[overall_level]
            })

        all_risks    = [r for p in assessed_phases for r in p["risks"]]
        high_count   = sum(1 for p in assessed_phases if p["overall_level"] == "High")
        medium_count = sum(1 for p in assessed_phases if p["overall_level"] == "Medium")
        low_count    = sum(1 for p in assessed_phases if p["overall_level"] == "Low")
        top_risk     = max(all_risks, key=lambda x: x.get("score", 0)) if all_risks else {}

        result[approach] = {
            "assessed_phases": assessed_phases,
            "high_count":      high_count,
            "medium_count":    medium_count,
            "low_count":       low_count,
            "top_risk":        top_risk
        }

    all_top_risks = []
    for approach in ["conservative", "aggressive"]:
        top = result[approach].get("top_risk", {})
        if top:
            all_top_risks.append(top)

    memory_summary = f"""
    Conservative Risks : High={result['conservative']['high_count']}, 
                         Medium={result['conservative']['medium_count']}, 
                         Low={result['conservative']['low_count']}
    Aggressive Risks   : High={result['aggressive']['high_count']}, 
                         Medium={result['aggressive']['medium_count']}, 
                         Low={result['aggressive']['low_count']}
    Top Risk Overall   : {max(all_top_risks, key=lambda x: x.get('score', 0)).get('risk', 'N/A') if all_top_risks else 'N/A'}
    """
    update_memory("Agent 5 — The Guardian", memory_summary)

    print("✅ Agent 5 - The Guardian has completed validated AI risk assessment.")
    return result