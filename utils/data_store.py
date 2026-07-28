# utils/data_store.py

data_store = {
    "project_details": {},
    "market_research": {},
    "visualizations":  [],
    "llm_prediction":  "",
    "roadmap":         {},
    "risks":           {},
    "feedback":        "",
    "agent_memory":    {}
}

def update_store(key, value):
    data_store[key] = value

def get_store(key):
    return data_store.get(key, None)

def update_memory(agent_name, summary):
    if "agent_memory" not in data_store:
        data_store["agent_memory"] = {}
    data_store["agent_memory"][agent_name] = summary

def get_full_memory():
    memory = data_store.get("agent_memory", {})
    if not memory:
        return "No previous agent context available."
    result = "=== AGENT MEMORY (Context from previous agents) ===\n"
    for agent, summary in memory.items():
        result += f"\n[{agent}]:\n{summary}\n"
    return result

def reset_store():
    global data_store
    data_store = {
        "project_details": {},
        "market_research": {},
        "visualizations":  [],
        "llm_prediction":  "",
        "roadmap":         {},
        "risks":           {},
        "feedback":        "",
        "agent_memory":    {}
    }