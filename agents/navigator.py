# agents/navigator.py

import plotly.graph_objects as go
import numpy as np
from utils.llm_client import ask_llm
from utils.data_store import update_memory, get_full_memory

MAX_RETRIES = 2

def validate_phases(phases):
    if not phases or len(phases) != 3:
        return False, "Must have exactly 3 phases."
    for i, phase in enumerate(phases):
        if not phase.get("title"):
            return False, f"Phase {i+1} missing title."
        if len(phase.get("tasks", [])) < 3:
            return False, f"Phase {i+1} needs at least 3 tasks."
    return True, "Phases valid."

def generate_phases_with_llm(market_research, project_details, approach, attempt=1):
    industry      = project_details.get("industry",      "Technology")
    objective     = project_details.get("objective",     "Launch product")
    target_market = project_details.get("target_market", "general")
    budget        = project_details.get("budget",        "$50,000")
    timeline      = project_details.get("timeline",      "6 months")
    llm_analysis  = market_research.get("llm_analysis",  "")
    insights      = market_research.get("insights",      [])
    memory        = get_full_memory()

    system_prompt = f"""You are an expert project strategist with deep
    experience in {industry}. Generate exactly 3 highly practical and
    specific roadmap phases based on the real market research provided.

    STRICT REQUIREMENTS:
    - Each phase must directly relate to {industry} and {objective}
    - Tasks must be specific and actionable, not generic
    - Each phase must build logically on the previous one
    - The {approach.upper()} approach must be clearly reflected
    - Also provide a one sentence description for each phase
    - Attempt number: {attempt}

    Respond ONLY in this exact format:

    PHASE 1:
    Title: [phase title]
    Description: [one sentence describing this phase]
    Task 1: [specific task]
    Task 2: [specific task]
    Task 3: [specific task]

    PHASE 2:
    Title: [phase title]
    Description: [one sentence describing this phase]
    Task 1: [specific task]
    Task 2: [specific task]
    Task 3: [specific task]

    PHASE 3:
    Title: [phase title]
    Description: [one sentence describing this phase]
    Task 1: [specific task]
    Task 2: [specific task]
    Task 3: [specific task]"""

    user_prompt = f"""
    PROJECT CONTEXT:
    - Industry      : {industry}
    - Objective     : {objective}
    - Target Market : {target_market}
    - Budget        : {budget}
    - Timeline      : {timeline}
    - Approach      : {approach.upper()}

    PREVIOUS AGENT CONTEXT:
    {memory}

    MARKET RESEARCH SUMMARY:
    {llm_analysis[:600]}

    KEY MARKET INSIGHTS:
    {chr(10).join(insights[:5])}

    Generate a highly specific {approach} 3-phase roadmap.
    Every task must directly address the market research findings above.
    """

    response = ask_llm(system_prompt, user_prompt, max_tokens=1000)
    return parse_llm_phases(response)

def parse_llm_phases(response):
    phases = []
    try:
        lines         = response.strip().split('\n')
        current_phase = None
        for line in lines:
            line = line.strip()
            if line.startswith("PHASE"):
                if current_phase:
                    phases.append(current_phase)
                current_phase = {"title": "", "description": "", "tasks": []}
            elif line.startswith("Title:") and current_phase is not None:
                current_phase["title"]       = line.replace("Title:", "").strip()
            elif line.startswith("Description:") and current_phase is not None:
                current_phase["description"] = line.replace("Description:", "").strip()
            elif line.startswith("Task") and current_phase is not None:
                task = line.split(":", 1)[-1].strip()
                if task:
                    current_phase["tasks"].append(task)
        if current_phase:
            phases.append(current_phase)
    except:
        pass

    if len(phases) != 3:
        phases = [
            {
                "title":       "Research & Planning",
                "description": "Conduct thorough market research and define project scope.",
                "tasks":       ["Define scope", "Analyze market", "Set milestones"]
            },
            {
                "title":       "Development & Execution",
                "description": "Build and test the core product based on research findings.",
                "tasks":       ["Build MVP", "Test product", "Gather feedback"]
            },
            {
                "title":       "Launch & Optimize",
                "description": "Launch the product and optimize based on real user data.",
                "tasks":       ["Go to market", "Monitor KPIs", "Iterate quickly"]
            },
        ]
    return phases

def build_plotly_mindmap(title, phases_data, accent_color, progress_values):
    fig = go.Figure()

    # --- Layout positions ---
    center_x, center_y = 0.5, 0.5
    phase_positions     = [(0.1, 0.5), (0.5, 0.5), (0.9, 0.5)]
    task_offsets        = [(-0.12, -0.18), (0.0, -0.18), (0.12, -0.18)]

    phase_colors  = [accent_color, "#4caf50", "#ff7043"]
    task_colors   = ["#4fc3f7",    "#81c784", "#ff8a65"]
    connect_colors= [accent_color, "#4caf50", "#ff7043"]

    # --- Connection: center to phase 1 ---
    fig.add_trace(go.Scatter(
        x=[center_x, phase_positions[0][0]],
        y=[center_y, phase_positions[0][1]],
        mode='lines',
        line=dict(color=accent_color, width=3),
        hoverinfo='none', showlegend=False
    ))

    # --- Connections between phases ---
    for i in range(len(phase_positions) - 1):
        fig.add_trace(go.Scatter(
            x=[phase_positions[i][0],     phase_positions[i+1][0]],
            y=[phase_positions[i][1],     phase_positions[i+1][1]],
            mode='lines',
            line=dict(color=connect_colors[i+1], width=3,
                      dash='dot' if i == 1 else 'solid'),
            hoverinfo='none', showlegend=False
        ))

    # --- Center node ---
    fig.add_trace(go.Scatter(
        x=[center_x], y=[center_y],
        mode='markers+text',
        marker=dict(size=55, color='#1e2a3a',
                    line=dict(color=accent_color, width=3)),
        text=["🚀<br>START"],
        textposition='middle center',
        textfont=dict(color=accent_color, size=11),
        hovertext="Project Start — Click a phase to explore",
        hoverinfo='text',
        showlegend=False
    ))

    # --- Phase nodes + task nodes ---
    for i, (phase, (px, py)) in enumerate(zip(phases_data, phase_positions)):
        progress      = progress_values[i]
        progress_color= "#4caf50" if progress >= 70 else \
                        "#ffa500" if progress >= 40 else "#ff4c4c"

        # Connection from phase to tasks
        for j, (tx_off, ty_off) in enumerate(task_offsets):
            tx = px + tx_off
            ty = py + ty_off
            fig.add_trace(go.Scatter(
                x=[px, tx], y=[py, ty],
                mode='lines',
                line=dict(color=task_colors[i], width=1.5, dash='dash'),
                hoverinfo='none', showlegend=False
            ))

            task_text = phase["tasks"][j] if j < len(phase["tasks"]) else ""
            short     = task_text[:28] + "..." if len(task_text) > 28 else task_text
            fig.add_trace(go.Scatter(
                x=[tx], y=[ty],
                mode='markers+text',
                marker=dict(size=38, color='#151c28',
                            line=dict(color=task_colors[i], width=1.5)),
                text=[f"<b>{short}</b>"],
                textposition='middle center',
                textfont=dict(color='#dddddd', size=7),
                hovertext=f"<b>Task {j+1}:</b><br>{task_text}",
                hoverinfo='text',
                showlegend=False
            ))

        # Phase node
        phase_title_short = phase["title"][:18] + "..." \
                            if len(phase["title"]) > 18 else phase["title"]
        hover_text = (
            f"<b>Phase {i+1}: {phase['title']}</b><br><br>"
            f"📋 <i>{phase.get('description', '')}</i><br><br>"
            f"✅ Task 1: {phase['tasks'][0]}<br>"
            f"✅ Task 2: {phase['tasks'][1]}<br>"
            f"✅ Task 3: {phase['tasks'][2]}<br><br>"
            f"📊 Progress: {progress}%"
        )

        fig.add_trace(go.Scatter(
            x=[px], y=[py],
            mode='markers+text',
            marker=dict(
                size=72,
                color='#1a2a3a',
                line=dict(color=phase_colors[i], width=3),
                symbol='circle'
            ),
            text=[f"<b>Phase {i+1}</b><br>{phase_title_short}<br>"
                  f"<span style='color:{progress_color}'>{progress}%</span>"],
            textposition='middle center',
            textfont=dict(color='white', size=8),
            hovertext=hover_text,
            hoverinfo='text',
            customdata=[i],
            showlegend=False,
            name=f"phase_{i}"
        ))

        # Progress arc indicator
        theta = np.linspace(0, 2 * np.pi * progress / 100, 50)
        r     = 0.055
        arc_x = px + r * np.cos(theta)
        arc_y = py + r * np.sin(theta)
        fig.add_trace(go.Scatter(
            x=arc_x, y=arc_y,
            mode='lines',
            line=dict(color=progress_color, width=4),
            hoverinfo='none', showlegend=False
        ))

    # --- Step labels ---
    for sx, label in [(0.3, "Step 1 → 2"), (0.7, "Step 2 → 3")]:
        fig.add_annotation(
            x=sx, y=0.56,
            text=label,
            showarrow=False,
            font=dict(color="#888888", size=10),
            bgcolor="rgba(0,0,0,0)"
        )

    # --- Title ---
    fig.add_annotation(
        x=0.5, y=0.98,
        text=f"<b>{title}</b>",
        showarrow=False,
        font=dict(color="white", size=14),
        xref="paper", yref="paper"
    )

    fig.update_layout(
        height        = 520,
        paper_bgcolor = "#0d1117",
        plot_bgcolor  = "#0d1117",
        xaxis=dict(
            showgrid=False, zeroline=False,
            showticklabels=False, range=[-0.05, 1.05]
        ),
        yaxis=dict(
            showgrid=False, zeroline=False,
            showticklabels=False, range=[0.15, 1.05]
        ),
        margin    = dict(l=20, r=20, t=40, b=20),
        hoverlabel= dict(
            bgcolor   = "#1e2130",
            font_size = 12,
            font_color= "white",
            bordercolor="#4fc3f7"
        ),
        dragmode='pan'
    )

    return fig

def run_navigator(project_details, market_research):
    print("Agent 4 - The Navigator is building interactive mindmap roadmaps...")

    roadmap = {}

    for approach, accent, center in [
        ("conservative", "#4fc3f7", "#4fc3f7"),
        ("aggressive",   "#ff7043", "#ff7043"),
    ]:
        phases   = []
        is_valid = False

        for attempt in range(1, MAX_RETRIES + 2):
            print(f"  → {approach.title()} roadmap attempt {attempt}...")
            phases = generate_phases_with_llm(
                market_research, project_details, approach, attempt
            )
            is_valid, reason = validate_phases(phases)
            if is_valid:
                print(f"  ✓ {approach.title()} roadmap validated on attempt {attempt}.")
                break
            else:
                print(f"  ✗ Validation failed: {reason}. Retrying...")

        progress_values = [33, 66, 100]

        fig = build_plotly_mindmap(
            f"{'🛡️' if approach == 'conservative' else '🚀'} "
            f"Roadmap {'A' if approach == 'conservative' else 'B'} "
            f"— {approach.title()} Approach",
            phases,
            accent_color    = accent,
            progress_values = progress_values
        )

        roadmap[approach] = {
            "phases":  phases,
            "plotly_fig": fig
        }

    memory_summary = f"""
    Conservative Phases: {[p['title'] for p in roadmap['conservative']['phases']]}
    Aggressive Phases  : {[p['title'] for p in roadmap['aggressive']['phases']]}
    Key Tasks (Con)    : {roadmap['conservative']['phases'][0]['tasks'][0]}
    Key Tasks (Agg)    : {roadmap['aggressive']['phases'][0]['tasks'][0]}
    """
    update_memory("Agent 4 — The Navigator", memory_summary)

    print("✅ Agent 4 - The Navigator has built interactive Plotly mindmap roadmaps.")
    return roadmap