"""Analysis Snapshot Persistence & Versioning API Endpoints."""

from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.snapshot import AnalysisSnapshot, AnalysisSnapshotCreate
from app.services.snapshot_service import SnapshotService


router = APIRouter()


@router.post("", response_model=AnalysisSnapshot, status_code=201, summary="Create analysis snapshot")
@router.post("/", response_model=AnalysisSnapshot, status_code=201, summary="Create analysis snapshot")
def create_snapshot(
    request: AnalysisSnapshotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalysisSnapshot:
    """Save an immutable snapshot of an analysis with targets, returns, and stress test outcomes."""
    return SnapshotService.create_snapshot(
        user_id=str(current_user.id),
        request=request,
        db=db,
    )


@router.get("", response_model=List[AnalysisSnapshot], summary="List analysis snapshots")
@router.get("/", response_model=List[AnalysisSnapshot], summary="List analysis snapshots")
def list_snapshots(
    symbol: Optional[str] = Query(None, description="Optional stock ticker filter"),
    current_user: User = Depends(get_current_user),
) -> List[AnalysisSnapshot]:
    """Retrieve all saved analysis snapshots for authenticated investor."""
    return SnapshotService.list_snapshots(
        user_id=str(current_user.id),
        symbol=symbol,
    )


@router.get("/compare", summary="Compare two analysis snapshots")
def compare_snapshots(
    id_a: str = Query(..., description="First snapshot ID"),
    id_b: str = Query(..., description="Second snapshot ID"),
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Compare targets, returns, and changes across two saved analysis snapshots."""
    return SnapshotService.compare_snapshots(id_a=id_a, id_b=id_b)


@router.get("/{snapshot_id}", response_model=AnalysisSnapshot, summary="Get snapshot detail")
def get_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
) -> AnalysisSnapshot:
    """Retrieve full data for a specific immutable snapshot."""
    return SnapshotService.get_snapshot(snapshot_id=snapshot_id)


@router.delete("/{snapshot_id}", summary="Delete an analysis snapshot")
def delete_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Delete an immutable snapshot from user's archive."""
    SnapshotService.delete_snapshot(snapshot_id=snapshot_id, user_id=str(current_user.id))
    return {"status": "deleted", "snapshot_id": snapshot_id}
