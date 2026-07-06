#!/usr/bin/env python3
"""Fix 403 on cPanel shared hosting — add .htaccess for SPA routing."""

import pexpect, sys

HOST = "66.29.141.60"
PORT = "21098"
USER = "idubsdok"
PASSWORD = "MOromaOYaPmt"
SSH_OPTS = (
    "-o StrictHostKeyChecking=no "
    "-o UserKnownHostsFile=/dev/null "
    "-o PreferredAuthentications=password "
    "-o PubkeyAuthentication=no "
    f"-p {PORT}"
)

def ssh(cmd, timeout=30):
    child = pexpect.spawn(f'ssh {SSH_OPTS} {USER}@{HOST} "{cmd}"', timeout=timeout, encoding='utf-8')
    child.logfile = sys.stdout
    i = child.expect(['password:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
    if i == 0:
        child.sendline(PASSWORD)
        child.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=timeout)
    child.close()

# 1. Check current state
ssh("ls -la ~/public_html/ && echo '---' && cat ~/public_html/.htaccess 2>/dev/null || echo 'No .htaccess'")

# 2. Remove the parking page that causes 403
ssh("rm -f ~/public_html/parking-page.shtml")

# 3. Write proper .htaccess for React SPA (client-side routing)
htaccess = r"""
Options -MultiViews -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite actual files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html for React Router
  RewriteRule ^ index.html [QSA,L]
</IfModule>

# Proper MIME types for JS modules
<IfModule mod_mime.c>
  AddType application/javascript .js .mjs
  AddType text/css .css
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
""".strip()

# Write .htaccess via heredoc
cmd = f"cat > ~/public_html/.htaccess << 'HTEOF'\n{htaccess}\nHTEOF"
ssh(cmd)

# 4. Fix permissions
ssh("chmod 755 ~/public_html && chmod 644 ~/public_html/index.html ~/public_html/.htaccess && chmod 755 ~/public_html/assets")

# 5. Verify
ssh("cat ~/public_html/.htaccess && echo '---PERMS---' && ls -la ~/public_html/")

print("\n✅ Fix applied! Try visiting http://66.29.141.60 again.")
