# backend/check_db.py

import sqlite3
import json

conn = sqlite3.connect('ai_agent.db')
conn.row_factory = sqlite3.Row

cursor = conn.execute(
    "SELECT * FROM agent_outputs ORDER BY id DESC LIMIT 10"
)
rows = cursor.fetchall()

for row in rows:
    print("---")
    print("Agent:", row["agent_name"])
    print("Project ID:", row["project_id"])
    print("Data preview:", row["output_data"][:150])

conn.close()