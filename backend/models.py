# backend/models.py

from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime

# --- Auth Models ---
class UserRegister(BaseModel):
    username  : str
    email     : str
    password  : str

class UserLogin(BaseModel):
    email    : str
    password : str

class UserResponse(BaseModel):
    id         : int
    username   : str
    email      : str
    created_at : str

class TokenResponse(BaseModel):
    access_token : str
    token_type   : str
    user         : UserResponse

# --- Project Models ---
class ProjectCreate(BaseModel):
    project_name  : str
    industry      : str
    target_market : str
    objective     : str
    budget        : str
    timeline      : str

class ProjectResponse(BaseModel):
    id              : int
    user_id         : int
    project_name    : str
    industry        : str
    target_market   : str
    objective       : str
    budget          : str
    timeline        : str
    status          : str
    viability_score : int
    created_at      : str

class ProjectListResponse(BaseModel):
    projects     : list
    total_count  : int

# --- Agent Models ---
class AgentOutputCreate(BaseModel):
    project_id  : int
    agent_name  : str
    output_data : str

class AgentOutputResponse(BaseModel):
    id          : int
    project_id  : int
    agent_name  : str
    output_data : str
    created_at  : str

# --- Pipeline Models ---
class PipelineRequest(BaseModel):
    project_id     : int
    project_details: dict

class PipelineResponse(BaseModel):
    success  : bool
    message  : str
    data     : Optional[Any] = None

# --- General Response ---
class GeneralResponse(BaseModel):
    success : bool
    message : str
    data    : Optional[Any] = None