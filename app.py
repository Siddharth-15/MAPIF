# app.py

import streamlit as st
import sys
import os
import base64
import pandas as pd
sys.path.append(os.path.dirname(__file__))

from utils.data_store import update_store, get_store, reset_store
from agents.inquirer import run_inquirer
from agents.analyst import run_analyst
from agents.visionary import run_visionary
from agents.navigator import run_navigator
from agents.guardian import run_guardian
from agents.advisor import run_advisor
from orchestrator import run_orchestrator

st.set_page_config(page_title="AI Agent Dashboard", layout="wide", page_icon="🤖")

st.markdown("""
    <style>
    .agent-header {
        background: linear-gradient(90deg, #1e2130, #2d3250);
        padding: 15px 20px;
        border-radius: 10px;
        border-left: 5px solid #4fc3f7;
        margin-bottom: 10px;
    }
    .risk-card {
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 8px;
    }
    </style>
""", unsafe_allow_html=True)

st.title("🤖 Intelligent Agent Collaboration System")
st.caption("Powered by Groq LLaMA3 · World Bank API · Real-time Web Scraping")
st.markdown("---")

if "pipeline_done" not in st.session_state:
    st.session_state.pipeline_done = False
if "agent_logs" not in st.session_state:
    st.session_state.agent_logs = []

with st.sidebar:
    st.header("📋 Project Setup")
    project_name  = st.text_input("Project Name",   placeholder="e.g. SmartHealth App")
    industry      = st.text_input("Industry",        placeholder="e.g. Healthcare")
    target_market = st.text_input("Target Market",   placeholder="e.g. Hospitals and Clinics")
    objective     = st.text_area("Objective",        placeholder="e.g. Automate patient scheduling")
    budget        = st.text_input("Budget",          placeholder="e.g. $50,000")
    timeline      = st.text_input("Timeline",        placeholder="e.g. 6 months")
    run_button    = st.button("🚀 Run All Agents",   use_container_width=True)
    reset_button  = st.button("🔄 Reset",            use_container_width=True)

    st.markdown("---")
    st.markdown("### 🧠 Agent Status")
    agent_status = {
        "1 — Inquirer":  "⏳",
        "2 — Analyst":   "⏳",
        "3 — Visionary": "⏳",
        "4 — Navigator": "⏳",
        "5 — Guardian":  "⏳",
        "6 — Advisor":   "⏳",
    }
    status_placeholders = {}
    for agent, status in agent_status.items():
        status_placeholders[agent] = st.sidebar.empty()
        status_placeholders[agent].markdown(f"{status} Agent {agent}")

def update_agent_status(name, status):
    emoji = "✅" if status == "done" else "🔄" if status == "running" else "❌"
    status_placeholders[name].markdown(f"{emoji} Agent {name}")

if reset_button:
    reset_store()
    st.session_state.pipeline_done = False
    st.session_state.agent_logs    = []
    st.rerun()

if run_button:
    if not all([project_name, industry, target_market, objective, budget, timeline]):
        st.sidebar.error("Please fill in all fields before running.")
    else:
        reset_store()
        st.session_state.agent_logs = []

        project_details = {
            "project_name":  project_name,
            "industry":      industry,
            "target_market": target_market,
            "objective":     objective,
            "budget":        budget,
            "timeline":      timeline
        }
        update_store("project_details", project_details)

        progress   = st.progress(0, text="Starting pipeline...")
        log_box    = st.empty()

        def log(msg):
            st.session_state.agent_logs.append(msg)
            log_box.info("\n".join(st.session_state.agent_logs[-4:]))

        # --- Agent 1 ---
        update_agent_status("1 — Inquirer", "running")
        progress.progress(10, text="🔍 Agent 1 — The Inquirer validating project details...")
        validation = run_inquirer(project_details)
        update_store("validation", validation)

        score = validation["viability_score"]
        if score >= 70:
            score_color = "#4caf50"
            score_label = "Strong"
        elif score >= 40:
            score_color = "#ffa500"
            score_label = "Moderate"
        else:
            score_color = "#ff4c4c"
            score_label = "Weak"

        if not validation["is_valid"] and score < 30:
            st.error(
                f"⚠️ Agent 1 flagged this project as not viable "
                f"(Score: {score}/100). {validation['feedback']}"
            )
            st.warning("💡 Suggestions: " +
                       " | ".join(validation["suggestions"]))
            st.stop()

        log(f"🔍 Agent 1 — Inquirer: Project validated. "
            f"Viability Score: {score}/100 ({score_label})")
        update_agent_status("1 — Inquirer", "done")

        # --- Agent 2 ---
        update_agent_status("2 — Analyst", "running")
        progress.progress(20, text="📊 Agent 2 — The Analyst researching market...")
        market_research = run_analyst(project_details)
        market_research = run_orchestrator(
            "The Analyst", market_research, project_details
        )
        if market_research is None:
            st.error("Pipeline stopped at Agent 2.")
            st.stop()
        update_store("market_research", market_research)
        log("📊 Agent 2 — Analyst: Market research completed with AI insights.")
        update_agent_status("2 — Analyst", "done")

        # --- Agent 3 ---
        update_agent_status("3 — Visionary", "running")
        progress.progress(38, text="🎨 Agent 3 — The Visionary generating dashboard...")
        visionary_output = run_visionary(market_research, project_details)
        visionary_output = run_orchestrator(
            "The Visionary", visionary_output, project_details
        )
        if visionary_output is None:
            st.error("Pipeline stopped at Agent 3.")
            st.stop()
        update_store("visionary_output", visionary_output)
        update_store("llm_prediction",   visionary_output["llm_prediction"])
        log("🎨 Agent 3 — Visionary: Predicted dashboard generated.")
        update_agent_status("3 — Visionary", "done")

        # --- Agent 4 ---
        update_agent_status("4 — Navigator", "running")
        progress.progress(55, text="🗺️ Agent 4 — The Navigator building roadmaps...")
        roadmap = run_navigator(project_details, market_research)
        roadmap = run_orchestrator(
            "The Navigator", roadmap, project_details
        )
        if roadmap is None:
            st.error("Pipeline stopped at Agent 4.")
            st.stop()
        update_store("roadmap", roadmap)
        log("🗺️ Agent 4 — Navigator: Dual roadmaps built with AI.")
        update_agent_status("4 — Navigator", "done")

        # --- Agent 5 ---
        update_agent_status("5 — Guardian", "running")
        progress.progress(72, text="🛡️ Agent 5 — The Guardian assessing risks...")
        market_research["project_details"] = project_details
        risk_summary = run_guardian(roadmap, market_research)
        risk_summary = run_orchestrator(
            "The Guardian", risk_summary, project_details
        )
        if risk_summary is None:
            st.error("Pipeline stopped at Agent 5.")
            st.stop()
        update_store("risks", risk_summary)
        log("🛡️ Agent 5 — Guardian: Risk assessment completed.")
        update_agent_status("5 — Guardian", "done")

        # --- Agent 6 ---
        update_agent_status("6 — Advisor", "running")
        progress.progress(88, text="💡 Agent 6 — The Advisor writing final report...")
        feedback = run_advisor(project_details, market_research, roadmap, risk_summary)
        feedback = run_orchestrator(
            "The Advisor", feedback, project_details
        )
        if feedback is None:
            st.error("Pipeline stopped at Agent 6.")
            st.stop()
        update_store("feedback", feedback)
        log("💡 Agent 6 — Advisor: Final advisory report generated.")
        update_agent_status("6 — Advisor", "done")

        progress.progress(100, text="✅ All agents completed successfully!")
        st.session_state.pipeline_done = True

if st.session_state.pipeline_done:
    project_details = get_store("project_details")
    market_research = get_store("market_research")
    visualizations  = get_store("visualizations")
    llm_prediction  = get_store("llm_prediction")
    roadmap         = get_store("roadmap")
    risk_summary    = get_store("risks")
    feedback        = get_store("feedback")

    st.success("✅ Pipeline completed! Explore results below.")

    # --- Agent 1 ---
    with st.expander("🔍 Agent 1 — The Inquirer", expanded=False):
        validation = get_store("validation")
        st.subheader("Project Check Report")

        score       = validation["viability_score"]
        score_color = "#4caf50" if score >= 70 else \
                      "#ffa500" if score >= 40 else "#ff4c4c"
        score_label = "Strong"   if score >= 70 else \
                      "Moderate" if score >= 40 else "Needs Work"
        score_emoji = "🟢"       if score >= 70 else \
                      "🟡"       if score >= 40 else "🔴"

        # Main score card
        st.markdown(f"""
            <div style="background:#1e2130; padding:20px;
            border-radius:12px; border-left:5px solid {score_color};
            margin-bottom:16px;">
            <h2 style="color:{score_color}; margin:0">
            {score_emoji} {score}/100 — {score_label}</h2>
            <p style="color:#aaaaaa; margin:6px 0 0; font-size:14px">
            This score shows how ready your project is to move forward.
            A score above 70 means you are good to go!</p>
            </div>
        """, unsafe_allow_html=True)

        # Check cards
        c1, c2, c3, c4 = st.columns(4)
        checks = [
            (c1, "Industry fit",   "industry_check",  "Does your industry match your goal?"),
            (c2, "Budget",         "budget_check",    "Is your budget enough?"),
            (c3, "Timeline",       "timeline_check",  "Is your timeline realistic?"),
            (c4, "Target market",  "market_check",    "Does your audience make sense?"),
        ]
        for col, label, key, tooltip in checks:
            check = validation.get(key, "PASS")
            emoji = "✅" if check == "PASS" else "❌"
            color = "#4caf50" if check == "PASS" else "#ff4c4c"
            col.markdown(f"""
                <div style="background:#1e2130; padding:12px;
                border-radius:8px; text-align:center;
                border-top:3px solid {color}; margin-bottom:8px">
                <p style="color:#888; margin:0; font-size:11px">{label}</p>
                <h3 style="color:{color}; margin:4px 0">{emoji} {check}</h3>
                <p style="color:#666; margin:0; font-size:10px">{tooltip}</p>
                </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Strength / Weakness / Opportunity
        st.markdown("#### What we found about your project")
        sw1, sw2, sw3 = st.columns(3)
        sw1.markdown(f"""
            <div style="background:#1a2a1a; padding:14px;
            border-radius:8px; border-left:3px solid #4caf50;">
            <p style="color:#4caf50; margin:0; font-size:12px">
            💪 What is good</p>
            <p style="color:white; margin:6px 0 0; font-size:13px">
            {validation.get('strength', 'N/A')}</p>
            </div>
        """, unsafe_allow_html=True)
        sw2.markdown(f"""
            <div style="background:#2a1a1a; padding:14px;
            border-radius:8px; border-left:3px solid #ff4c4c;">
            <p style="color:#ff4c4c; margin:0; font-size:12px">
            ⚠️ What needs work</p>
            <p style="color:white; margin:6px 0 0; font-size:13px">
            {validation.get('weakness', 'N/A')}</p>
            </div>
        """, unsafe_allow_html=True)
        sw3.markdown(f"""
            <div style="background:#1a1a2a; padding:14px;
            border-radius:8px; border-left:3px solid #4fc3f7;">
            <p style="color:#4fc3f7; margin:0; font-size:12px">
            🚀 A good chance to use</p>
            <p style="color:white; margin:6px 0 0; font-size:13px">
            {validation.get('opportunity', 'N/A')}</p>
            </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Feedback
        st.markdown("#### 💬 What our AI thinks")
        st.info(validation.get("feedback", ""))

        # Suggestions
        suggestions = validation.get("suggestions", [])
        if suggestions:
            st.markdown("#### 💡 Simple steps to improve your project")
            for i, s in enumerate(suggestions, 1):
                st.markdown(f"""
                    <div style="background:#1e2130; padding:12px;
                    border-radius:8px; margin-bottom:8px;
                    border-left:3px solid #4fc3f7;">
                    <span style="color:#4fc3f7; font-weight:bold">
                    Step {i}.</span>
                    <span style="color:white"> {s}</span>
                    </div>
                """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Budget and Timeline estimates
        st.markdown("#### 📊 What we recommend")
        col1, col2 = st.columns(2)
        col1.markdown(f"""
            <div style="background:#1e2130; padding:16px;
            border-radius:8px; border-left:3px solid #4caf50;">
            <p style="color:#888; margin:0; font-size:12px">
            💰 A more realistic budget would be</p>
            <h4 style="color:#4caf50; margin:6px 0">
            {validation.get('budget_estimate', 'N/A')}</h4>
            <p style="color:#666; margin:0; font-size:11px">
            Based on similar projects in this industry</p>
            </div>
        """, unsafe_allow_html=True)
        col2.markdown(f"""
            <div style="background:#1e2130; padding:16px;
            border-radius:8px; border-left:3px solid #ff7043;">
            <p style="color:#888; margin:0; font-size:12px">
            ⏱️ A more realistic time would be</p>
            <h4 style="color:#ff7043; margin:6px 0">
            {validation.get('timeline_estimate', 'N/A')}</h4>
            <p style="color:#666; margin:0; font-size:11px">
            Based on similar projects in this industry</p>
            </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Project details
        st.markdown("#### 📋 Your project details")
        st.json(project_details)

    # --- Agent 2 ---
    with st.expander("📊 Agent 2 — The Analyst", expanded=False):
        st.subheader("AI-Powered Market Analysis")
        st.markdown(market_research.get("llm_analysis", ""))
        st.subheader("Raw Market Insights")
        for i, insight in enumerate(market_research.get("insights", []), 1):
            st.write(f"{i}. {insight}")

    # --- Agent 3 ---
    with st.expander("🎨 Agent 3 — The Visionary", expanded=True):
        visionary_output = get_store("visionary_output")
        kpis= visionary_output["kpis"]

        st.markdown("""
            <div style="background:#0d1117; padding:16px;
            border-radius:12px; margin-bottom:16px;
            border: 1px solid #1e2130;">
            <h3 style="color:white; margin:0">
            📊 Market Intelligence Dashboard</h3>
            <p style="color:#888; margin:4px 0 0">
            Powered by World Bank API · Real-time Predictions</p>
            </div>
        """, unsafe_allow_html=True)

        # KPI Cards Row
        c1, c2, c3, c4 = st.columns(4)
        c1.markdown(f"""
            <div style="background:#1e2130; padding:16px;
            border-radius:10px; border-left:4px solid #4fc3f7;
            text-align:center;">
            <p style="color:#888; margin:0; font-size:12px">Latest GDP</p>
            <h2 style="color:#4fc3f7; margin:4px 0">
            ${round(kpis['latest_gdp']/1e12, 2)}T</h2>
            </div>
        """, unsafe_allow_html=True)
        c2.markdown(f"""
            <div style="background:#1e2130; padding:16px;
            border-radius:10px; border-left:4px solid #4caf50;
            text-align:center;">
            <p style="color:#888; margin:0; font-size:12px">Growth Rate</p>
            <h2 style="color:#4caf50; margin:4px 0">
            {round(kpis['latest_growth'], 2)}%</h2>
            </div>
        """, unsafe_allow_html=True)
        c3.markdown(f"""
            <div style="background:#1e2130; padding:16px;
            border-radius:10px; border-left:4px solid #ff7043;
            text-align:center;">
            <p style="color:#888; margin:0; font-size:12px">Market Score</p>
            <h2 style="color:#ff7043; margin:4px 0">
            {kpis['market_score']}/100</h2>
            </div>
        """, unsafe_allow_html=True)
        c4.markdown(f"""
            <div style="background:#1e2130; padding:16px;
            border-radius:10px; border-left:4px solid #ce93d8;
            text-align:center;">
            <p style="color:#888; margin:0; font-size:12px">Avg Growth</p>
            <h2 style="color:#ce93d8; margin:4px 0">
            {round(kpis['avg_growth'], 2)}%</h2>
            </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        # Gauge Charts Row
        g1, g2, g3 = st.columns(3)
        with g1:
            st.plotly_chart(visionary_output["gauge_market"],
                            use_container_width=True)
        with g2:
            st.plotly_chart(visionary_output["gauge_growth"],
                            use_container_width=True)
        with g3:
            st.plotly_chart(visionary_output["gauge_risk"],
                            use_container_width=True)

        # Main Dashboard
        st.plotly_chart(visionary_output["main_dashboard"],
                        use_container_width=True)

        # LLM Prediction
        st.markdown("### 🔮 AI Market Prediction Report")
        st.markdown(visionary_output["llm_prediction"])

    # --- Agent 4 ---
    with st.expander("🗺️ Agent 4 — The Navigator", expanded=True):
        st.subheader("AI-Generated Interactive Roadmaps")
        st.caption("💡 Hover over phase nodes to see full description · Scroll to zoom · Drag to pan")

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("### 🛡️ Roadmap A — Conservative")
            fig_con = roadmap["conservative"]["plotly_fig"]
            st.plotly_chart(fig_con, use_container_width=True)

            st.markdown("#### Phase Details")
            for i, phase in enumerate(roadmap["conservative"]["phases"], 1):
                with st.expander(f"Phase {i}: {phase['title']}", expanded=False):
                    st.markdown(f"📋 **Description:** {phase.get('description', '')}")
                    st.markdown("**Tasks:**")
                    for task in phase["tasks"]:
                        st.write(f"  ✅ {task}")

        with col2:
            st.markdown("### 🚀 Roadmap B — Aggressive")
            fig_agg = roadmap["aggressive"]["plotly_fig"]
            st.plotly_chart(fig_agg, use_container_width=True)

            st.markdown("#### Phase Details")
            for i, phase in enumerate(roadmap["aggressive"]["phases"], 1):
                with st.expander(f"Phase {i}: {phase['title']}", expanded=False):
                    st.markdown(f"📋 **Description:** {phase.get('description', '')}")
                    st.markdown("**Tasks:**")
                    for task in phase["tasks"]:
                        st.write(f"  ✅ {task}")

    # --- Agent 5 ---
    with st.expander("🛡️ Agent 5 — The Guardian", expanded=True):
        st.subheader("AI Risk Assessment on Both Roadmaps")

        for approach, label, emoji in [
            ("conservative", "Conservative Roadmap", "🛡️"),
            ("aggressive",   "Aggressive Roadmap",   "🚀")
        ]:
            st.markdown(f"### {emoji} {label}")
            data = risk_summary[approach]

            col1, col2, col3 = st.columns(3)
            col1.metric("🔴 High Risks",   data["high_count"])
            col2.metric("🟡 Medium Risks", data["medium_count"])
            col3.metric("🟢 Low Risks",    data["low_count"])

            for phase in data["assessed_phases"]:
                level       = phase["overall_level"]
                color       = phase["color"]
                emoji_level = "🔴" if level == "High" else "🟡" if level == "Medium" else "🟢"

                st.markdown(
                    f"""<div style="background-color:{color}22;
                    border-left:5px solid {color};
                    padding:10px; border-radius:6px;
                    margin-bottom:10px;">
                    <b style="color:{color}">{emoji_level} Phase: {phase['phase_title']}</b>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <b>Overall Risk: {level} ({phase['overall_score']}/10)</b>
                    </div>""",
                    unsafe_allow_html=True
                )

                risk_data = []
                for r in phase["risks"]:
                    risk_data.append({
                        "Risk":       r.get("risk",       "N/A"),
                        "Level":      r.get("level",      "N/A"),
                        "Score":      f"{r.get('score', 0)}/10",
                        "Prevention": r.get("prevention", "N/A")
                    })
                st.table(pd.DataFrame(risk_data))
            st.markdown("---")

    # --- Agent 6 ---
    with st.expander("💡 Agent 6 — The Advisor", expanded=True):
        st.subheader("AI-Powered Final Advisory Report")
        st.markdown(feedback)