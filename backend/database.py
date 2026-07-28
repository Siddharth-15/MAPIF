# backend/database.py

import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "ai_agent.db")

async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:

        # Users table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT    UNIQUE NOT NULL,
                email       TEXT    UNIQUE NOT NULL,
                password    TEXT    NOT NULL,
                created_at  TEXT    DEFAULT (datetime('now'))
            )
        """)

        # Projects table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER NOT NULL,
                project_name    TEXT    NOT NULL,
                industry        TEXT    NOT NULL,
                target_market   TEXT    NOT NULL,
                objective       TEXT    NOT NULL,
                budget          TEXT    NOT NULL,
                timeline        TEXT    NOT NULL,
                status          TEXT    DEFAULT 'completed',
                viability_score INTEGER DEFAULT 0,
                created_at      TEXT    DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Agent outputs table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agent_outputs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id      INTEGER NOT NULL,
                agent_name      TEXT    NOT NULL,
                output_data     TEXT    NOT NULL,
                created_at      TEXT    DEFAULT (datetime('now')),
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)

        await db.commit()
        print("✅ Database initialized successfully.")