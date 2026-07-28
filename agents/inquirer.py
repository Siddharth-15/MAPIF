# agents/inquirer.py

from utils.llm_client import ask_llm
from utils.data_store import update_memory

def validate_inputs_with_llm(project_details):
    industry      = project_details.get("industry",      "")
    objective     = project_details.get("objective",     "")
    budget        = project_details.get("budget",        "")
    timeline      = project_details.get("timeline",      "")
    target_market = project_details.get("target_market", "")
    project_name  = project_details.get("project_name",  "")

    system_prompt = """You are a friendly business advisor helping someone 
    understand if their project idea is good. 
    
    VERY IMPORTANT RULES:
    - Use simple everyday language — no technical terms
    - Write as if explaining to a friend who is not a business expert
    - Keep sentences short and clear
    - Use plain words instead of business jargon
    - Examples of words to AVOID: 
      "leverage", "synergy", "scalability", "stakeholders", 
      "interoperability", "paradigm", "robust", "utilize"
    - Instead use: 
      "use", "teamwork", "can grow", "people involved",
      "works together", "new way", "strong", "use"

    Respond ONLY in this exact format:

    VIABILITY_SCORE: [number 0-100]
    IS_VALID: [YES or NO]
    INDUSTRY_CHECK: [PASS or FAIL]
    BUDGET_CHECK: [PASS or FAIL]
    TIMELINE_CHECK: [PASS or FAIL]
    MARKET_CHECK: [PASS or FAIL]
    FEEDBACK: [2-3 short simple sentences about the project in plain English]
    SUGGESTIONS: [3 simple practical suggestions separated by |]
    BUDGET_ESTIMATE: [realistic budget range in simple terms]
    TIMELINE_ESTIMATE: [realistic timeline in simple terms]
    STRENGTH: [one simple sentence about what is good about this project]
    WEAKNESS: [one simple sentence about what needs improvement]
    OPPORTUNITY: [one simple sentence about a good chance this project can use]"""

    user_prompt = f"""
    Project Name  : {project_name}
    Industry      : {industry}
    Target Market : {target_market}
    Objective     : {objective}
    Budget        : {budget}
    Timeline      : {timeline}

    Please check if this project idea makes sense and give simple 
    easy to understand feedback. Avoid any complicated words.
    """

    return ask_llm(system_prompt, user_prompt, max_tokens=700)

def parse_validation(response):
    result = {
        "viability_score":   50,
        "is_valid":          True,
        "industry_check":    "PASS",
        "budget_check":      "PASS",
        "timeline_check":    "PASS",
        "market_check":      "PASS",
        "feedback":          "",
        "suggestions":       [],
        "budget_estimate":   "",
        "timeline_estimate": "",
        "strength":          "",
        "weakness":          "",
        "opportunity":       ""
    }

    try:
        lines = response.strip().split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith("VIABILITY_SCORE:"):
                try:
                    result["viability_score"]   = int(
                        ''.join(filter(str.isdigit,
                        line.replace("VIABILITY_SCORE:", "").strip()))
                    )
                except:
                    result["viability_score"]   = 50
            elif line.startswith("IS_VALID:"):
                result["is_valid"]              = "YES" in line.upper()
            elif line.startswith("INDUSTRY_CHECK:"):
                result["industry_check"]        = "PASS" if "PASS" in line.upper() else "FAIL"
            elif line.startswith("BUDGET_CHECK:"):
                result["budget_check"]          = "PASS" if "PASS" in line.upper() else "FAIL"
            elif line.startswith("TIMELINE_CHECK:"):
                result["timeline_check"]        = "PASS" if "PASS" in line.upper() else "FAIL"
            elif line.startswith("MARKET_CHECK:"):
                result["market_check"]          = "PASS" if "PASS" in line.upper() else "FAIL"
            elif line.startswith("FEEDBACK:"):
                result["feedback"]              = line.replace("FEEDBACK:", "").strip()
            elif line.startswith("SUGGESTIONS:"):
                raw = line.replace("SUGGESTIONS:", "").strip()
                result["suggestions"]           = [s.strip() for s in raw.split("|")]
            elif line.startswith("BUDGET_ESTIMATE:"):
                result["budget_estimate"]       = line.replace("BUDGET_ESTIMATE:", "").strip()
            elif line.startswith("TIMELINE_ESTIMATE:"):
                result["timeline_estimate"]     = line.replace("TIMELINE_ESTIMATE:", "").strip()
            elif line.startswith("STRENGTH:"):
                result["strength"]              = line.replace("STRENGTH:", "").strip()
            elif line.startswith("WEAKNESS:"):
                result["weakness"]              = line.replace("WEAKNESS:", "").strip()
            elif line.startswith("OPPORTUNITY:"):
                result["opportunity"]           = line.replace("OPPORTUNITY:", "").strip()
    except:
        pass

    return result

def run_inquirer(project_details):
    print("Agent 1 - The Inquirer is validating project details...")

    raw_response = validate_inputs_with_llm(project_details)
    validation   = parse_validation(raw_response)

    memory_summary = f"""
    Project Name     : {project_details.get('project_name',  '')}
    Industry         : {project_details.get('industry',      '')}
    Target Market    : {project_details.get('target_market', '')}
    Objective        : {project_details.get('objective',     '')}
    Budget           : {project_details.get('budget',        '')}
    Timeline         : {project_details.get('timeline',      '')}
    Viability Score  : {validation['viability_score']}/100
    Is Valid         : {validation['is_valid']}
    Strength         : {validation['strength']}
    Weakness         : {validation['weakness']}
    Opportunity      : {validation['opportunity']}
    Budget Estimate  : {validation['budget_estimate']}
    Timeline Estimate: {validation['timeline_estimate']}
    """
    update_memory("Agent 1 — The Inquirer", memory_summary)

    print(f"✅ Agent 1 - Validation complete. "
          f"Viability Score: {validation['viability_score']}/100")
    return validation