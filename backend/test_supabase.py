# backend/test_supabase.py

from supabase_client import supabase

try:
    result = supabase.table("users").select("id").limit(1).execute()
    print("✅ Supabase connection successful!")
    print(f"   Users in DB: {len(result.data)}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    