import os
import psycopg2
from psycopg2.extras import DictCursor
import uuid
from datetime import datetime

# Connect using environment variables or placeholder
SOURCE_DB_URL = os.getenv('SOURCE_DATABASE_URL', 'postgres://user:password@localhost:5432/source_db')
TARGET_DB_URL = os.getenv('DATABASE_URL', 'postgres://user:password@localhost:5432/target_db')

src_conn = psycopg2.connect(SOURCE_DB_URL)
src_cur = src_conn.cursor(cursor_factory=DictCursor)

tgt_conn = psycopg2.connect(TARGET_DB_URL)
tgt_cur = tgt_conn.cursor(cursor_factory=DictCursor)

try:
    # 1. Migrate Users
    print("Migrating users...")
    src_cur.execute("SELECT * FROM \"user\" WHERE email IN ('daengpython@gmail.com', 'alan.pln50@gmail.com')")
    users = src_cur.fetchall()
    
    for u in users:
        tgt_cur.execute(
            """
            INSERT INTO users (id, email, name, picture, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
            """,
            (u['id'], u['email'], u['name'], None, u['created_at'], u['created_at'])
        )
    print(f"Migrated {len(users)} users.")

    # Get the user ID for daengpython@gmail.com to link plans and last_read to primary account
    # Alternatively we can just use the exact user_ids from source
    
    # 2. Migrate Plans -> Khatam Plans
    print("Migrating plans...")
    src_cur.execute("""
        SELECT p.*, m.id as member_id, u.id as user_id 
        FROM plan p
        JOIN member m ON m.plan_id = p.id
        JOIN "user" u ON u.name = m.name
        WHERE u.email IN ('daengpython@gmail.com', 'alan.pln50@gmail.com')
    """)
    plans = src_cur.fetchall()
    
    for p in plans:
        # some plan ids in old db might not be valid UUIDs, let's just generate a new one
        # or try to use the old member id if it's uuid
        try:
            plan_uuid = str(uuid.UUID(p['member_id']))
        except:
            plan_uuid = str(uuid.uuid4())
            
        # Avoid duplicate plans if run multiple times
        tgt_cur.execute("SELECT id FROM khatam_plans WHERE id = %s", (plan_uuid,))
        if not tgt_cur.fetchone():
            tgt_cur.execute(
                """
                INSERT INTO khatam_plans (id, user_id, title, target_date, is_completed, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                (plan_uuid, p['user_id'], f"Khatam Target - {p['name']}", p['target_khatam'], False, p['created_at'])
            )
    print(f"Migrated {len(plans)} plans.")

    # 3. Migrate Progress -> reading_sessions
    print("Migrating progress to reading_sessions...")
    src_cur.execute("""
        SELECT p.*, m.name, u.id as user_id 
        FROM progress p
        JOIN member m ON p.member_id = m.id
        JOIN "user" u ON u.name = m.name
        WHERE u.email IN ('daengpython@gmail.com', 'alan.pln50@gmail.com')
        ORDER BY p.created_at ASC
    """)
    progress_records = src_cur.fetchall()
    
    count = 0
    for r in progress_records:
        tgt_cur.execute("SELECT id FROM reading_sessions WHERE id = %s", (r['id'],))
        if not tgt_cur.fetchone():
            tgt_cur.execute(
                """
                INSERT INTO reading_sessions (id, user_id, start_juz, start_surah, start_page, start_ayah, end_juz, end_surah, end_page, end_ayah, total_ayah_read, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (r['id'], r['user_id'], r['start_juz'], r['start_surah'], r['start_page'], r['start_ayat'], r['end_juz'], r['end_surah'], r['end_page'], r['end_ayat'], r['amount'], r['created_at'])
            )
            count += 1
    
    print(f"Migrated {count} reading sessions.")

    # 4. Set Last Read
    print("Setting last_read...")
    # Get the absolute latest progress
    src_cur.execute("""
        SELECT p.*, u.id as user_id
        FROM progress p
        JOIN member m ON p.member_id = m.id
        JOIN "user" u ON u.name = m.name
        WHERE u.email IN ('daengpython@gmail.com', 'alan.pln50@gmail.com')
        ORDER BY p.created_at DESC
        LIMIT 1
    """)
    last_prog = src_cur.fetchone()
    
    if last_prog:
        tgt_cur.execute(
            """
            INSERT INTO last_read (user_id, surah_number, ayah_number, juz_number, page_number, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                surah_number = EXCLUDED.surah_number,
                ayah_number = EXCLUDED.ayah_number,
                juz_number = EXCLUDED.juz_number,
                page_number = EXCLUDED.page_number,
                updated_at = EXCLUDED.updated_at
            """,
            (last_prog['user_id'], last_prog['end_surah'], last_prog['end_ayat'], last_prog['end_juz'], last_prog['end_page'], last_prog['created_at'])
        )
        print(f"Set last_read for user {last_prog['user_id']} to Surah {last_prog['end_surah']} Ayah {last_prog['end_ayat']}")

    tgt_conn.commit()
    print("Migration completed successfully!")

except Exception as e:
    tgt_conn.rollback()
    print(f"An error occurred: {e}")

finally:
    src_cur.close()
    src_conn.close()
    tgt_cur.close()
    tgt_conn.close()
