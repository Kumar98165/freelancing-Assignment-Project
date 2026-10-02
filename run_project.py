#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import threading

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')

def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def install_backend():
    print_header("Step 1/4: Checking Backend Python Dependencies")
    req_file = os.path.join(BACKEND_DIR, 'requirements.txt')
    if os.path.exists(req_file):
        try:
            print("[INFO] Installing/verifying backend dependencies...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', req_file], check=True, cwd=BACKEND_DIR)
            print("[SUCCESS] Backend dependencies installed.")
        except Exception as e:
            print(f"[WARNING] Could not install requirements automatically: {e}")

def seed_database():
    print_header("Step 2/4: Initializing & Seeding Database")
    seed_file = os.path.join(BACKEND_DIR, 'seed.py')
    if os.path.exists(seed_file):
        try:
            print("[INFO] Running database seed script...")
            subprocess.run([sys.executable, seed_file], check=True, cwd=BACKEND_DIR)
            print("[SUCCESS] Database seeded successfully.")
        except Exception as e:
            print(f"[WARNING] Database seed script note: {e}")

def install_frontend():
    print_header("Step 3/4: Checking Frontend Node Dependencies")
    node_modules = os.path.join(FRONTEND_DIR, 'node_modules')
    if not os.path.exists(node_modules):
        try:
            print("[INFO] node_modules not found. Running 'npm install'...")
            subprocess.run(['npm', 'install'], check=True, cwd=FRONTEND_DIR, shell=True)
            print("[SUCCESS] Frontend dependencies installed.")
        except Exception as e:
            print(f"[WARNING] Could not run npm install: {e}")
    else:
        print("[SUCCESS] Frontend node_modules already exists.")

def stream_output(process, prefix):
    for line in iter(process.stdout.readline, ''):
        if line:
            print(f"[{prefix}] {line.strip()}")

def run_services():
    print_header("Step 4/4: Launching Backend (Flask) & Frontend (Vite)")
    print("  🚀 Backend API : http://127.0.0.1:5000")
    print("  🚀 Frontend UI : http://localhost:5173")
    print("  Press Ctrl+C at any time to stop all services.")
    print("=" * 60 + "\n")

    # Start Flask Backend
    backend_proc = subprocess.Popen(
        [sys.executable, 'run.py'],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Start Vite Frontend
    frontend_proc = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=True
    )

    t1 = threading.Thread(target=stream_output, args=(backend_proc, 'BACKEND'), daemon=True)
    t2 = threading.Thread(target=stream_output, args=(frontend_proc, 'FRONTEND'), daemon=True)
    t1.start()
    t2.start()

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("[ERROR] Backend process terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("[ERROR] Frontend process terminated unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down services...")
    finally:
        try:
            backend_proc.terminate()
            frontend_proc.terminate()
        except Exception:
            pass
        print("[SUCCESS] All services stopped.")

def main():
    print_header("TzSuperPOS - 1-Click Master Application Launcher")
    install_backend()
    seed_database()
    install_frontend()
    run_services()

if __name__ == '__main__':
    main()
