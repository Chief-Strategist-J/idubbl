#!/usr/bin/env python3
"""
iDubbl Frontend-Only Deployment Script
Builds frontend locally and uploads dist/ to the server web root.
"""

import pexpect
import sys
import subprocess
import os

HOST = "66.29.141.60"
PORT = "21098"
USER = "idubsdok"
PASSWORD = "MOromaOYaPmt"
LOCAL_FRONTEND = "/home/btpl-lap-22/live/idubbl/frontend"

SSH_OPTS = (
    "-o StrictHostKeyChecking=no "
    "-o UserKnownHostsFile=/dev/null "
    "-o PreferredAuthentications=password "
    "-o PubkeyAuthentication=no "
    f"-p {PORT}"
)

def log(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")

def ssh(cmd, timeout=60):
    full = f"ssh {SSH_OPTS} {USER}@{HOST} \"{cmd}\""
    print(f"\n[SSH] {cmd}")
    child = pexpect.spawn(full, timeout=timeout, encoding='utf-8')
    child.logfile = sys.stdout
    i = child.expect(['password:', pexpect.EOF, pexpect.TIMEOUT], timeout=20)
    if i == 0:
        child.sendline(PASSWORD)
        child.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=timeout)
    child.close()
    return child.exitstatus

def ssh_output(cmd, timeout=60):
    full = f"ssh {SSH_OPTS} {USER}@{HOST} \"{cmd}\""
    child = pexpect.spawn(full, timeout=timeout, encoding='utf-8')
    i = child.expect(['password:', pexpect.EOF, pexpect.TIMEOUT], timeout=20)
    if i == 0:
        child.sendline(PASSWORD)
        child.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=timeout)
    out = child.before or ""
    child.close()
    return out.strip()

def rsync(local_src, remote_dst, timeout=300):
    cmd = (
        f"rsync -avz --progress "
        f"-e 'ssh {SSH_OPTS}' "
        f"{local_src}/ {USER}@{HOST}:{remote_dst}/"
    )
    print(f"\n[RSYNC] {local_src} → {remote_dst}")
    child = pexpect.spawn(cmd, timeout=timeout, encoding='utf-8')
    child.logfile = sys.stdout
    i = child.expect(['password:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
    if i == 0:
        child.sendline(PASSWORD)
        child.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=timeout)
    child.close()
    return child.exitstatus

# ── STEP 0: Find web root on server ─────────────────────────────────────────
log("STEP 0: Finding web root on server...")
web_root = ssh_output(
    "if [ -d ~/public_html ]; then echo ~/public_html; "
    "elif [ -d ~/www ]; then echo ~/www; "
    "elif [ -d ~/htdocs ]; then echo ~/htdocs; "
    "else echo ~/public_html; fi"
)
print(f"\n  Web root detected: {web_root}")

# ── STEP 1: Build frontend locally with correct env ──────────────────────────
log("STEP 1: Building frontend locally...")

# Backend on Render (production URL from render.yaml)
BACKEND_URL = "https://idubbl-backend.onrender.com"

env_content = f"VITE_API_URL={BACKEND_URL}\n"
env_path = os.path.join(LOCAL_FRONTEND, ".env.production")
with open(env_path, "w") as f:
    f.write(env_content)
print(f"  ✅ Written .env.production: VITE_API_URL={BACKEND_URL}")

result = subprocess.run(
    ["npm", "install"],
    cwd=LOCAL_FRONTEND,
    capture_output=False
)
if result.returncode != 0:
    print("❌ npm install failed"); sys.exit(1)

result = subprocess.run(
    ["npm", "run", "build"],
    cwd=LOCAL_FRONTEND,
    env={**os.environ, "VITE_API_URL": BACKEND_URL},
    capture_output=False
)
if result.returncode != 0:
    print("❌ Build failed"); sys.exit(1)

print("\n✅ Frontend built successfully!")

# ── STEP 2: Upload dist to server ────────────────────────────────────────────
log(f"STEP 2: Uploading dist/ to {web_root}...")
status = rsync(f"{LOCAL_FRONTEND}/dist", web_root)
if status != 0:
    print("❌ Upload failed"); sys.exit(1)
print("\n✅ Files uploaded!")

# ── STEP 3: Verify ───────────────────────────────────────────────────────────
log("STEP 3: Verifying files on server...")
ssh(f"ls -la {web_root}/ | head -20")

log("DEPLOYMENT COMPLETE!")
print(f"\n🚀 Frontend is live at: http://{HOST}")
print(f"🔧 Backend API (Render): {BACKEND_URL}")
