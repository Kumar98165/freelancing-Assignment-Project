import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def init_db():
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="98165mkm"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM pg_database WHERE datname='supermarket_pos_db'")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE supermarket_pos_db")
        print("Successfully created database 'supermarket_pos_db'.")
    else:
        print("Database 'supermarket_pos_db' already exists.")
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    init_db()
