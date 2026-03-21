import sqlite3, os, sys, json

db = os.path.join(os.getcwd(), 'backend', 'database.sqlite')
if not os.path.exists(db):
    print('ERROR: DB file not found:', db)
    sys.exit(2)

conn = sqlite3.connect(db)
cur = conn.cursor()

def safe_query(q):
    try:
        cur.execute(q)
        return cur.fetchall()
    except Exception as e:
        print('ERROR-Q:', e)
        return None

cnt = safe_query("SELECT COUNT(*) FROM Products")
if cnt and len(cnt) > 0:
    print('COUNT:', cnt[0][0])
    row = safe_query("SELECT id, title, price, status FROM Products LIMIT 1")
    if row and len(row) > 0:
        print('SAMPLE:', json.dumps(row[0], ensure_ascii=False))
else:
    # try alternative table names
    for t in ('Product', 'products'):
        cnt = safe_query(f"SELECT COUNT(*) FROM {t}")
        if cnt and len(cnt) > 0:
            print('COUNT:', cnt[0][0], 'TABLE:', t)
            row = safe_query(f"SELECT id, title, price, status FROM {t} LIMIT 1")
            if row and len(row) > 0:
                print('SAMPLE:', json.dumps(row[0], ensure_ascii=False))
            break

conn.close()
