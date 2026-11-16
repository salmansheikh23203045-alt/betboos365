#!/bin/bash
# BetBoos365 cPanel Application Backup Script
# Run this on the cPanel server via SSH or Terminal
# Date: 2026-11-16

set -e  # Exit on any error

# Configuration
APP_DIR="/home/betboosc/bb365app"
BACKUP_DIR="/home/betboosc"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="bb365app_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

echo "=== BetBoos365 Application Backup ==="
echo "Source: ${APP_DIR}"
echo "Destination: ${BACKUP_PATH}"
echo ""

# Check if source directory exists
if [ ! -d "${APP_DIR}" ]; then
    echo "ERROR: Application directory does not exist: ${APP_DIR}"
    exit 1
fi

# Change to parent directory
cd "${BACKUP_DIR}"

# Create backup with exclusions
echo "Creating backup archive..."
tar -czf "${BACKUP_NAME}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.log' \
    --exclude='.npm' \
    --exclude='.cache' \
    -C "${BACKUP_DIR}" \
    "bb365app"

# Verify backup was created
if [ ! -f "${BACKUP_PATH}" ]; then
    echo "ERROR: Backup archive was not created!"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)

echo ""
echo "=== Backup Complete ==="
echo "Archive: ${BACKUP_PATH}"
echo "Size: ${BACKUP_SIZE}"
echo ""
echo "Backup preserved:"
echo "  ✓ Application files"
echo "  ✓ Configuration (.bb365-secrets.json if present)"
echo "  ✓ Scripts"
echo "  ✓ Prisma schema and migrations"
echo ""
echo "Excluded from backup:"
echo "  ✗ node_modules (will be reinstalled)"
echo "  ✗ .next (will be rebuilt)"
echo "  ✗ Log files"
echo ""
echo "To restore this backup:"
echo "  cd /home/betboosc"
echo "  rm -rf bb365app"
echo "  tar -xzf ${BACKUP_NAME}.tar.gz"
echo ""
