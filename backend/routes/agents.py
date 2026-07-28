# backend/routes/agents.py

import sys
import os
from supabase_client import supabase
from typing import Any, AsyncGenerator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import GeneralResponse
from auth import verify_token 
from supabase_client import supabase

#Agents imports
from agents.inquirer  import run_inquirer
from agents.analyst   import run_analyst
from agents.visionary import run_visionary
from agents.navigator import run_navigator
from agents.guardian  import run_guardian
from agents.advisor   import run_advisor
from orchestrator     import run_orchestrator
from utils.data_store import update_store, reset_store

router = APIRouter()
security = HTTPBearer()

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header."
        )
    token   = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )
    return payload


# Try to import get_db from the project's database module. If it's not
# present, provide a clear stub that raises an error at runtime so the
# developer knows to implement the dependency.
try:
    from database import get_db  # adjust import path if your project uses a different module
except Exception:
    async def get_db() -> AsyncGenerator:
        raise Exception("get_db dependency not found. Please implement get_db in backend.database or adjust the import in routes.agents")

def safe_serialize(obj):
    try:
        import plotly
        if hasattr(obj, 'to_json'):
            return obj.to_json()
        elif isinstance(obj, dict):
            return {k: safe_serialize(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [safe_serialize(i) for i in obj]
        elif isinstance(obj, bytes):
            return obj.decode('utf-8')
        else:
            return obj
    except:
        return str(obj)

@router.post("/run/{project_id}", response_model=GeneralResponse)
async def run_pipeline(
    project_id      : int,
    project_details : dict,
    db              : Any = Depends(get_db),
    user            : dict       = Depends(get_current_user)
):
    try:
        reset_store()
        update_store("project_details", project_details)
        results = {}

        # --- Agent 1 ---
        validation = run_inquirer(project_details)
        update_store("validation", validation)
        results["agent1"] = validation
        supabase.table("agent_outputs").insert({
            "project_id":  project_id,
            "agent_name":  "Agent 1 — Inquirer",
            "output_data": safe_serialize(validation)
        }).execute()

        # --- Agent 2 ---
        market_research = run_analyst(project_details)
        market_research = run_orchestrator(
            "The Analyst", market_research, project_details
        )
        if market_research is None:
            raise HTTPException(
                status_code=500,
                detail="Pipeline stopped at Agent 2."
            )
        update_store("market_research", market_research)
        results["agent2"] = {
            "query":           market_research.get("query",           ""),
            "queries":         market_research.get("queries",         []),
            "insights":        market_research.get("insights",        []),
            "scored_insights": market_research.get("scored_insights", []),
            "structured_data": market_research.get("structured_data", {}),
            "llm_analysis":    market_research.get("llm_analysis",    ""),
            "news":            market_research.get("news",            []),
            "wiki_data":       market_research.get("wiki_data",       ""),
            "scraped_at":      market_research.get("scraped_at",      ""),
            "is_valid":        market_research.get("is_valid",        False),
            "summary":         market_research.get("summary",         "")
        }
        supabase.table("agent_outputs").insert({
            "project_id":  project_id,
            "agent_name":  "Agent 2 — Analyst",
            "output_data": safe_serialize(results["agent2"])
        }).execute()

        # --- Agent 3 ---
        visionary_raw    = run_visionary(market_research, project_details)
        visionary_output = run_orchestrator(
            "The Visionary", visionary_raw, project_details
        )
        if visionary_output is None:
            visionary_output = visionary_raw

        update_store("visionary_output", visionary_output)

        analytics_report = {}
        if isinstance(visionary_output, dict):
            analytics_report = visionary_output.get("analytics_report", {})

        results["agent3"] = {"analytics_report": analytics_report}

        supabase.table("agent_outputs").insert({
            "project_id":  project_id,
            "agent_name":  "Agent 3 — Visionary",
            "output_data": safe_serialize(results["agent3"])
        }).execute()

        # --- Agent 4 ---
        roadmap = run_navigator(project_details, market_research)
        roadmap = run_orchestrator(
            "The Navigator", roadmap, project_details
        )
        if roadmap is None:
            raise HTTPException(
                status_code=500,
                detail="Pipeline stopped at Agent 4."
            )
        update_store("roadmap", roadmap)
        results["agent4"] = {
            "conservative": {
                "phases": roadmap["conservative"]["phases"]
            },
            "aggressive": {
                "phases": roadmap["aggressive"]["phases"]
            }
        }
        supabase.table("agent_outputs").insert({
            "project_id":  project_id,
            "agent_name":  "Agent 4 — Navigator",
            "output_data": safe_serialize(results["agent4"])
        }).execute()
        

        # --- Agent 5 ---
        market_research["project_details"] = project_details
        risk_summary = run_guardian(roadmap, market_research)
        risk_summary = run_orchestrator(
            "The Guardian", risk_summary, project_details
        )
        if risk_summary is None:
            raise HTTPException(
                status_code=500,
                detail="Pipeline stopped at Agent 5."
            )
        update_store("risks", risk_summary)
        results["agent5"] = safe_serialize(risk_summary)
        supabase.table("agent_outputs").insert({
            "project_id":  project_id,
            "agent_name":  "Agent 5 — Guardian",
            "output_data": safe_serialize(results["agent5"])
        }).execute()

        # --- Agent 6 ---
        feedback = run_advisor(
            project_details, market_research, roadmap, risk_summary
        )
        feedback = run_orchestrator(
            "The Advisor", feedback, project_details
        )
        if feedback is None:
            raise HTTPException(
                status_code=500,
                detail="Pipeline stopped at Agent 6."
            )
        update_store("feedback", feedback)
        results["agent6"] = {"report": feedback}
        supabase.table("agent_outputs").insert({
            "project_id":  project_id,
            "agent_name":  "Agent 6 — Advisor",
            "output_data": safe_serialize(results["agent6"])
        }).execute()

        # Update viability score
        score = validation.get("viability_score", 0)
        supabase.table("projects").update({
            "viability_score": score,
            "status":          "completed"
        }).eq("id", project_id).execute()

    

        return GeneralResponse(
            success = True,
            message = "Pipeline completed successfully!",
            data    = results
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/outputs/{project_id}", response_model=GeneralResponse)
async def get_agent_outputs(
    project_id : int,
    db         : Any = Depends(get_db),
    user       : dict       = Depends(get_current_user)
):
    try:
        async with db.execute(
            """SELECT * FROM agent_outputs
               WHERE project_id = ?
               ORDER BY created_at ASC""",
            (project_id,)
        ) as cursor:
            rows = await cursor.fetchall()

        outputs = []
        for row in rows:
            r = dict(row)
            try:
                r["output_data"] = json.loads(r["output_data"])
            except:
                pass
            outputs.append(r)

        return GeneralResponse(
            success = True,
            message = f"{len(outputs)} agent outputs found.",
            data    = {"outputs": outputs}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))