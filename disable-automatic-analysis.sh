#!/bin/bash

# Script to disable Automatic Analysis via SonarCloud API
# Usage: ./disable-automatic-analysis.sh

# Set your project key and token
PROJECT_KEY="alfiemohamad_ai-innovation-checker"
SONAR_TOKEN="your_sonar_token_here"  # Replace with your actual token
SONAR_URL="https://sonarcloud.io"

echo "🔧 Disabling Automatic Analysis for project: $PROJECT_KEY"

# Disable automatic analysis
curl -X POST \
  -u "$SONAR_TOKEN:" \
  "$SONAR_URL/api/settings/set" \
  -d "key=sonar.analysis.mode" \
  -d "value=publish" \
  -d "component=$PROJECT_KEY"

echo ""
echo "✅ Automatic Analysis should now be disabled"
echo "🔄 Please verify in SonarCloud web interface:"
echo "   https://sonarcloud.io/project/administration/analysis_method?id=$PROJECT_KEY"
