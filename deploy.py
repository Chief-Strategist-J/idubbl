#!/usr/bin/env python3
"""
iDubbl Deployment Script
Deploys the app to 66.29.141.60 via SSH password auth using pexpect
"""

import pexpect
import sys
import os
import time

HOST = "66.29.141.60"
PORT = "21098"
USER = "idubsdok"
PROJECT_DIR = "/home/btpl-lap-22/live/idubbl"
REMOTE_DIR = "/home/idubsdok/idubbl"

def load_local_env():
    env_vars = {}
    env_path = os.path.join(PROJECT_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        env_vars[key] = val
    return env_vars

local_env = load_local_env()
PASSWORD = os.environ.get("DEPLOY_SSH_PASSWORD") or local_env.get("DEPLOY_SSH_PASSWORD") or "MOromaOYaPmt"

SSH_OPTS = [
    "-o", "StrictHostKeyChecking=no",
    "-o", "UserKnownHostsFile=/dev/null",
    "-o", "PreferredAuthentications=password",
    "-o", "PubkeyAuthentication=no",
    "-p", PORT,
]

def log(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")

def run_ssh_cmd(cmd, timeout=120):
    """Run a command on the remote server via SSH."""
    full_cmd = f"ssh {' '.join(SSH_OPTS)} {USER}@{HOST} '{cmd}'"
    print(f"\n[CMD] {full_cmd}")
    child = pexpect.spawn(full_cmd, timeout=timeout, encoding='utf-8')
    child.logfile = sys.stdout
    idx = child.expect(['password:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
    if idx == 0:
        child.sendline(PASSWORD)
        child.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=timeout)
    output = child.before
    child.close()
    return child.exitstatus, output

def rsync_project():
    """Rsync project files to remote server."""
    log("STEP 1: Uploading project files via rsync...")
    cmd = [
        "rsync", "-avz", "--progress",
        "--exclude=node_modules",
        "--exclude=.git",
        "--exclude=dist",
        "--exclude=.env",
        "-e", f"ssh {' '.join(SSH_OPTS)}",
        f"{PROJECT_DIR}/",
        f"{USER}@{HOST}:{REMOTE_DIR}/"
    ]
    import subprocess
    proc = pexpect.spawn(" ".join(cmd), timeout=300, encoding='utf-8')
    proc.logfile = sys.stdout
    idx = proc.expect(['password:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
    if idx == 0:
        proc.sendline(PASSWORD)
        proc.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=300)
    proc.close()
    return proc.exitstatus

def main():
    log("iDubbl Deployment Started")
    
    # Step 0: Test connectivity
    log("STEP 0: Testing SSH connection...")
    status, out = run_ssh_cmd("echo 'Connected OK' && whoami && pwd")
    if status != 0:
        print(f"\n❌ SSH connection failed! Exit: {status}")
        sys.exit(1)
    print("\n✅ SSH connection successful!")

    # Step 1: Check Docker
    log("STEP 1: Checking Docker on remote server...")
    status, out = run_ssh_cmd("docker --version && docker compose version")
    if status != 0:
        print("\n❌ Docker not found on server. Please install Docker first.")
        sys.exit(1)
    print("\n✅ Docker is available!")

    # Step 2: Create remote directory
    log("STEP 2: Creating remote project directory...")
    run_ssh_cmd(f"mkdir -p {REMOTE_DIR}")

    # Step 3: Rsync files
    status = rsync_project()
    if status != 0:
        print(f"\n❌ Rsync failed! Exit: {status}")
        sys.exit(1)
    print("\n✅ Files uploaded successfully!")

    # Step 4: Upload backend .env
    log("STEP 4: Uploading backend .env...")
    backend_env_content = open(f"{PROJECT_DIR}/backend/.env").read()
    # Add production VITE_API_URL as info (used in docker-compose build arg)
    escaped = backend_env_content.replace("'", "'\\''")
    run_ssh_cmd(f"mkdir -p {REMOTE_DIR}/backend && echo '{escaped}' > {REMOTE_DIR}/backend/.env")

    # Step 5: Create root .env with VITE_API_URL pointing to server
    log("STEP 5: Setting up production environment...")
    
    # Dynamically build root env from local configuration to prevent hardcoding secrets
    env_vars = load_local_env()
    env_vars["VITE_API_URL"] = f"http://{HOST}:5000"
    
    # Exclude deployment-only local keys
    keys_to_exclude = {"DEPLOY_SSH_PASSWORD"}
    root_env = "\n".join(f"{k}={v}" for k, v in env_vars.items() if k not in keys_to_exclude)
    
    escaped_root = root_env.replace("'", "'\\''")
    run_ssh_cmd(f"echo '{escaped_root}' > {REMOTE_DIR}/.env")

    # Step 6: Stop any existing containers
    log("STEP 6: Stopping any existing containers...")
    run_ssh_cmd(f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yaml down 2>/dev/null || true")

    # Step 7: Build and run
    log("STEP 7: Building and launching Docker containers...")
    status, out = run_ssh_cmd(
        f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yaml up -d --build 2>&1",
        timeout=600
    )

    # Step 8: Check status
    log("STEP 8: Checking running containers...")
    run_ssh_cmd("docker ps")

    log("DEPLOYMENT COMPLETE!")
    print(f"\n🚀 Your site should be live at: http://{HOST}")
    print(f"🔧 Backend API at: http://{HOST}:5000")

if __name__ == "__main__":
    main()
