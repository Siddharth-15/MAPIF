# orchestrator.py

import streamlit as st
from utils.llm_client import ask_llm

ALWAYS_CONTINUE_AGENTS = ["The Visionary", "The Navigator", "The Guardian"]

def evaluate_output(agent_name, output):
    if not output:
        return False, f"{agent_name} produced no output."
    if isinstance(output, str) and "LLM Error" in output:
        return False, f"{agent_name} encountered an LLM error."
    if isinstance(output, list) and len(output) == 0:
        return False, f"{agent_name} returned empty results."
    if isinstance(output, dict) and len(output) == 0:
        return False, f"{agent_name} returned empty data."
    return True, f"{agent_name} completed successfully."

def decide_next_action(agent_name, output, project_details):
    if agent_name in ALWAYS_CONTINUE_AGENTS:
        return "CONTINUE", f"{agent_name} output accepted automatically."

    industry  = project_details.get("industry", "technology")
    objective = project_details.get("objective", "launch a product")

    system_prompt = """You are an intelligent orchestrator managing a 
    multi-agent AI pipeline. Your job is to evaluate if an agent 
    produced meaningful output. 
    Only stop if there is a critical error or completely empty output.
    Always respond in exactly this format:
    DECISION: [CONTINUE or RETRY or STOP]
    REASON: [one sentence explanation]"""

    user_prompt = f"""
    Agent: {agent_name}
    Industry: {industry}
    Objective: {objective}
    Output Summary: {str(output)[:300]}

    Did this agent produce valid, non-empty output?
    Only STOP if output is completely empty or has a critical error.
    """

    response = ask_llm(system_prompt, user_prompt, max_tokens=100)

    if "STOP" in response.upper():
        return "STOP", response
    elif "RETRY" in response.upper():
        return "RETRY", response
    else:
        return "CONTINUE", response

def run_orchestrator(agent_name, output, project_details,
                     retry_func=None, max_retries=2):
    is_valid, message = evaluate_output(agent_name, output)

    if not is_valid:
        st.warning(f"⚠️ {message}")
        return output

    decision, reason = decide_next_action(agent_name, output, project_details)

    if decision == "RETRY" and retry_func and max_retries > 0:
        st.warning(f"🔄 Orchestrator retrying {agent_name}. Reason: {reason}")
        new_output = retry_func()
        return run_orchestrator(agent_name, new_output, project_details,
                                retry_func, max_retries - 1)

    elif decision == "STOP":
        st.error(f"🛑 Orchestrator stopped pipeline at {agent_name}. Reason: {reason}")
        return None

    else:
        st.success(f"✅ Orchestrator: {message}")
        return output