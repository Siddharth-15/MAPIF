# backend/routes/projects.py

from fastapi               import APIRouter, HTTPException, Depends
from fastapi.security      import HTTPBearer, HTTPAuthorizationCredentials
from pydantic              import BaseModel
from models                import GeneralResponse
from auth                  import verify_token
from supabase_client       import supabase

router   = APIRouter()
security = HTTPBearer()

class ProjectCreate(BaseModel):
    project_name:  str
    industry:      str
    target_market: str
    objective:     str
    budget:        str
    timeline:      str

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token   = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token.")
    return payload


@router.get("/list", response_model=GeneralResponse)
async def list_projects(
    current_user: dict = Depends(get_current_user)
):
    try:
        result = supabase.table("projects")\
            .select("*")\
            .eq("user_id", current_user["user_id"])\
            .order("created_at", desc=True)\
            .execute()

        return GeneralResponse(
            success = True,
            message = "Projects fetched.",
            data    = {"projects": result.data or []}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create", response_model=GeneralResponse)
async def create_project(
    project:      ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        result = supabase.table("projects").insert({
            "user_id":        current_user["user_id"],
            "project_name":   project.project_name,
            "industry":       project.industry,
            "target_market":  project.target_market,
            "objective":      project.objective,
            "budget":         project.budget,
            "timeline":       project.timeline,
            "status":         "pending",
            "viability_score": 0
        }).execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create project in database."
            )

        new_project = result.data[0]
        project_id  = new_project["id"]

        print(f"  ✅ Project created with ID: {project_id}")

        return GeneralResponse(
            success = True,
            message = "Project created successfully.",
            data    = {
                "project":    new_project,
                "project_id": project_id
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"  ✗ Project create error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}", response_model=GeneralResponse)
async def get_project(
    project_id:   int,
    current_user: dict = Depends(get_current_user)
):
    try:
        proj = supabase.table("projects")\
            .select("*")\
            .eq("id",      project_id)\
            .eq("user_id", current_user["user_id"])\
            .execute()

        if not proj.data:
            raise HTTPException(404, "Project not found.")

        outputs = supabase.table("agent_outputs")\
            .select("*")\
            .eq("project_id", project_id)\
            .execute()

        return GeneralResponse(
            success = True,
            message = "Project fetched.",
            data    = {
                "project": proj.data[0],
                "outputs": outputs.data or []
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}", response_model=GeneralResponse)
async def delete_project(
    project_id:   int,
    current_user: dict = Depends(get_current_user)
):
    try:
        supabase.table("projects")\
            .delete()\
            .eq("id",      project_id)\
            .eq("user_id", current_user["user_id"])\
            .execute()

        return GeneralResponse(
            success = True,
            message = "Project deleted successfully."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))