"""Immutable Analysis Snapshot Persistence and Diff Service."""

from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.schemas.snapshot import AnalysisSnapshot, AnalysisSnapshotCreate


_in_memory_snapshots: Dict[str, AnalysisSnapshot] = {}


class SnapshotService:
    """Manages immutable versioned analysis snapshots and cross-snapshot comparisons."""

    @classmethod
    def create_snapshot(
        cls,
        user_id: str,
        request: AnalysisSnapshotCreate,
        db: Optional[Session] = None,
    ) -> AnalysisSnapshot:
        """Create and store an immutable snapshot of an analysis."""
        snapshot_id = f"snp-{str(uuid.uuid4())[:6]}"
        now = datetime.now(timezone.utc)

        snapshot = AnalysisSnapshot(
            id=snapshot_id,
            user_id=user_id,
            title=request.title.strip(),
            symbol=request.symbol.strip().upper(),
            asset_class=request.asset_class,
            current_price=request.current_price,
            target_price=request.target_price,
            projected_return_percent=request.projected_return_percent,
            risk_level=request.risk_level,
            notes=request.notes,
            scenario_stressed=request.scenario_stressed,
            snapshot_payload=request.snapshot_payload,
            created_at=now,
        )

        _in_memory_snapshots[snapshot_id] = snapshot
        return snapshot

    @classmethod
    def list_snapshots(
        cls,
        user_id: str,
        symbol: Optional[str] = None,
    ) -> List[AnalysisSnapshot]:
        """List snapshots for user with optional symbol filter."""
        results = list(_in_memory_snapshots.values())
        results = [s for s in results if s.user_id == user_id]
        if symbol:
            sym_clean = symbol.strip().upper()
            results = [s for s in results if s.symbol == sym_clean]

        results.sort(key=lambda s: s.created_at, reverse=True)
        return results

    @classmethod
    def get_snapshot(cls, snapshot_id: str, user_id: str) -> AnalysisSnapshot:
        """Fetch individual immutable snapshot."""
        snp = _in_memory_snapshots.get(snapshot_id)
        if not snp or snp.user_id != user_id:
            raise NotFoundError(f"Analysis snapshot '{snapshot_id}' not found")
        return snp

    @classmethod
    def delete_snapshot(cls, snapshot_id: str, user_id: str) -> bool:
        """Delete snapshot from archive."""
        snp = _in_memory_snapshots.get(snapshot_id)
        if not snp or snp.user_id != user_id:
            raise NotFoundError(f"Analysis snapshot '{snapshot_id}' not found")
        del _in_memory_snapshots[snapshot_id]
        return True

    @classmethod
    def compare_snapshots(cls, id_a: str, id_b: str, user_id: str) -> Dict:
        """Generate side-by-side delta between two analysis snapshots."""
        snp_a = cls.get_snapshot(id_a, user_id)
        snp_b = cls.get_snapshot(id_b, user_id)

        price_diff = round(snp_b.target_price - snp_a.target_price, 2)
        return_diff = round(snp_b.projected_return_percent - snp_a.projected_return_percent, 2)

        return {
            "snapshot_a": snp_a.model_dump(),
            "snapshot_b": snp_b.model_dump(),
            "target_price_delta": price_diff,
            "projected_return_delta": return_diff,
            "comparison_summary": (
                f"Between {snp_a.title} ({snp_a.created_at.strftime('%d-%b-%Y')}) and "
                f"{snp_b.title} ({snp_b.created_at.strftime('%d-%b-%Y')}), target price shifted "
                f"by ₹{price_diff:+.2f} ({return_diff:+.2f}% projected return delta)."
            ),
        }
