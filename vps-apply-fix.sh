#!/bin/bash
# This script applies the authController.ts fix directly on the VPS
# Run this on the VPS: bash vps-apply-fix.sh

set -e

echo "🔧 Applying refresh token fix to authController.ts..."

AUTH_FILE="/opt/lsn/apps/backend/src/controllers/authController.ts"

if [ ! -f "$AUTH_FILE" ]; then
    echo "❌ Error: authController.ts not found at $AUTH_FILE"
    exit 1
fi

# Backup the original file
cp "$AUTH_FILE" "${AUTH_FILE}.backup.$(date +%s)"
echo "✓ Backup created"

# Apply the fix using sed - insert DELETE statement before INSERT
# Find the line with "INSERT INTO refresh_tokens" in the login function and add DELETE before it
sed -i '/const refreshToken = generateRefreshToken(user.id);/a\
\
    // Delete old refresh tokens before creating a new one\
    await db.query('"'"'DELETE FROM refresh_tokens WHERE user_id = $1'"'"', [user.id]);' "$AUTH_FILE"

echo "✓ Fix applied to authController.ts"

# Remove the duplicate INSERT that might have been created
sed -i '/await db.query(\n      "INSERT INTO refresh_tokens/!b;N;/\nINSERT INTO refresh_tokens.*\n    \/\/ Delete old/!b;s/\n    \/\/ Delete old[^\n]*\n    await db.query.*\n      "INSERT INTO refresh_tokens[^)]*)\);/\n    \/\/ Delete old refresh tokens before creating a new one\n    await db.query('"'"'DELETE FROM refresh_tokens WHERE user_id = $1'"'"', [user.id]);\n    await db.query(\n      "INSERT INTO refresh_tokens/' "$AUTH_FILE"' "$AUTH_FILE"

echo "✓ Verifying the fix..."
if grep -q "DELETE FROM refresh_tokens WHERE user_id" "$AUTH_FILE"; then
    echo "✓ DELETE statement found in authController.ts"
else
    echo "⚠ Warning: Could not verify DELETE statement. Please check manually."
fi

echo ""
echo "Now rebuild and restart the backend container:"
echo "  cd /opt/lsn"
echo "  docker compose -f docker-compose.prod.yml down"
echo "  docker compose -f docker-compose.prod.yml build --no-cache backend"
echo "  docker compose -f docker-compose.prod.yml up -d"
echo "  sleep 10"
echo "  docker compose -f docker-compose.prod.yml logs backend | grep 'listening'"

