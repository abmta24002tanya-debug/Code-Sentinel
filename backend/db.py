import os
import json
import aiosqlite

DB_PATH = os.environ.get("DB_PATH", "/tmp/sentinel.db")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                findings TEXT DEFAULT '[]',
                summary TEXT DEFAULT NULL,
                progress INTEGER NOT NULL DEFAULT 0,
                current_step TEXT DEFAULT NULL,
                created_at TEXT NOT NULL,
                completed_at TEXT DEFAULT NULL
            )
        """)
        await db.commit()

        async with db.execute("PRAGMA table_info(scans)") as cursor:
            rows = await cursor.fetchall()
            columns = [row[1] for row in rows]

        if "progress" not in columns:
            await db.execute("ALTER TABLE scans ADD COLUMN progress INTEGER NOT NULL DEFAULT 0")
        if "current_step" not in columns:
            await db.execute("ALTER TABLE scans ADD COLUMN current_step TEXT DEFAULT NULL")
        await db.commit()


def _row_to_dict(row, cursor):
    cols = [d[0] for d in cursor.description]
    d = dict(zip(cols, row))
    d["findings"] = json.loads(d["findings"] or "[]")
    d["summary"] = json.loads(d["summary"]) if d["summary"] else None
    return d

async def create_scan(scan_id: str, url: str) -> dict:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO scans (id, url, status, findings, progress, current_step, created_at) VALUES (?, ?, 'queued', '[]', 0, 'Queued', ?)",
            (scan_id, url, now)
        )
        await db.commit()
    return {"scanId": scan_id, "url": url, "status": "queued", "createdAt": now,
            "completedAt": None, "findings": [], "summary": None, "progress": 0, "currentStep": "Queued"}

async def get_scan(scan_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)) as cursor:
            row = await cursor.fetchone()
            if row is None:
                return None
            d = dict(row)
            d["findings"] = json.loads(d["findings"] or "[]")
            d["summary"] = json.loads(d["summary"]) if d["summary"] else None
            # Normalize keys to camelCase
            return {
                "scanId": d["id"],
                "url": d["url"],
                "status": d["status"],
                "progress": d.get("progress", 0),
                "currentStep": d.get("current_step"),
                "createdAt": d["created_at"],
                "completedAt": d["completed_at"],
                "findings": d["findings"],
                "summary": d["summary"],
            }

async def update_scan(scan_id: str, status: str, findings=None, summary=None, completed_at=None, progress=None, current_step=None):
    parts = ["status = ?"]
    vals = [status]
    if findings is not None:
        parts.append("findings = ?")
        vals.append(json.dumps(findings))
    if summary is not None:
        parts.append("summary = ?")
        vals.append(json.dumps(summary))
    if completed_at is not None:
        parts.append("completed_at = ?")
        vals.append(completed_at)
    if progress is not None:
        parts.append("progress = ?")
        vals.append(progress)
    if current_step is not None:
        parts.append("current_step = ?")
        vals.append(current_step)
    vals.append(scan_id)
    sql = f"UPDATE scans SET {', '.join(parts)} WHERE id = ?"
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(sql, vals)
        await db.commit()
