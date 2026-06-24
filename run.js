const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Parse .env file if it exists at the root
const envPath = path.join(__dirname, '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const firstEqual = line.indexOf('=');
    if (firstEqual === -1) return;
    const key = line.substring(0, firstEqual).trim();
    let val = line.substring(firstEqual + 1).trim();
    // remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    envVars[key] = val;
  });
}

// 2. Set environment variables
const runEnv = Object.assign({}, process.env, envVars);

// Helper to run a command and return a promise
function runCommand(command, args, cwd, prefix) {
  return new Promise((resolve, reject) => {
    console.log(`[System] Running ${command} ${args.join(' ')} in ${cwd}...`);
    const cmd = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
    const child = spawn(cmd, args, { cwd, env: runEnv, shell: true });

    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line) console.log(`${prefix} ${line}`);
      });
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line) console.error(`${prefix} ${line}`);
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${prefix} exited with code ${code}`));
      }
    });
  });
}

// Helper to spawn a long-running process
function spawnProcess(command, args, cwd, prefix) {
  const cmd = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
  const child = spawn(cmd, args, { cwd, env: runEnv, shell: true });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`${prefix} ${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.error(`${prefix} [Error] ${line}`);
    });
  });

  return child;
}

async function main() {
  const backendDir = path.join(__dirname, 'backend');
  const frontendDir = path.join(__dirname, 'frontend');

  // Check and install dependencies if node_modules is missing
  if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
    console.log('[System] Installing backend dependencies...');
    await runCommand('npm', ['install'], backendDir, '[Backend-Install]');
  }
  if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log('[System] Installing frontend dependencies...');
    await runCommand('npm', ['install'], frontendDir, '[Frontend-Install]');
  }

  console.log('[System] Starting development servers...');
  const backendProcess = spawnProcess('npm', ['run', 'dev'], backendDir, '\x1b[36m[Backend]\x1b[0m');
  const frontendProcess = spawnProcess('npm', ['run', 'dev'], frontendDir, '\x1b[32m[Frontend]\x1b[0m');

  const cleanup = () => {
    console.log('\n[System] Stopping development servers...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(err => {
  console.error('[System Error]', err);
  process.exit(1);
});
