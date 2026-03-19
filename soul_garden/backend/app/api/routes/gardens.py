"""
Garden API Routes
Workspace and community management.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient as SupabaseClient

from app.db.database import get_db
from app.models.garden import Garden, GardenCreate

router = APIRouter()


@router.post("", response_model=Garden, status_code=status.HTTP_201_CREATED)
async def create_garden(
    garden_create: GardenCreate,
    db: SupabaseClient = Depends(get_db)
) -> Garden:
    """Create a new garden workspace."""
    # Generate slug if not provided
    slug = garden_create.slug or garden_create.name.lower().replace(" ", "-")
    
    garden_data = {
        "name": garden_create.name,
        "description": garden_create.description,
        "slug": slug,
        "is_public": garden_create.is_public,
    }
    
    result = await db.table("gardens").insert(garden_data).execute()
    return Garden.model_validate(result.data[0])


@router.get("", response_model=List[Garden])
async def list_gardens(
    db: SupabaseClient = Depends(get_db)
) -> List[Garden]:
    """List all gardens."""
    result = await db.table("gardens").select("*").order("created_at", desc=True).execute()
    return [Garden.model_validate(row) for row in result.data]


@router.get("/{garden_id}", response_model=Garden)
async def get_garden(
    garden_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> Garden:
    """Get garden by ID."""
    result = await db.table("gardens").select("*").eq("id", str(garden_id)).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garden {garden_id} not found"
        )
    
    return Garden.model_validate(result.data[0])


@router.get("/slug/{slug}", response_model=Garden)
async def get_garden_by_slug(
    slug: str,
    db: SupabaseClient = Depends(get_db)
) -> Garden:
    """Get garden by slug."""
    result = await db.table("gardens").select("*").eq("slug", slug).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garden with slug '{slug}' not found"
        )
    
    return Garden.model_validate(result.data[0])
