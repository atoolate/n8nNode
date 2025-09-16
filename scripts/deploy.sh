#!/bin/bash

# Define paths
PACKAGE_DIR="/home/alexdelaet/n8nNode"
N8N_DIR="/home/alexdelaet/n8n-local-test"

# Step 1: Navigate to the package directory and build the package
echo "Building the package..."
cd "$PACKAGE_DIR" || exit
npm run build

# Step 2: Link the package globally
echo "Linking the package globally..."
npm link

# Step 3: Navigate to the n8n directory
echo "Navigating to the n8n directory..."
cd "$N8N_DIR" || exit

# Step 4: Link the package to the local n8n instance
echo "Linking the package to the local n8n instance..."
npm link n8n-nodes-ittes-ai

# Step 5: Start n8n with custom nodes
echo "Starting n8n with custom nodes..."
N8N_CUSTOM_EXTENSIONS="/home/alexdelaet/n8nNode" npx n8n