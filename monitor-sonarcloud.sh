#!/bin/bash

# Monitor SonarCloud Status
# Usage: ./monitor-sonarcloud.sh

PROJECT_KEY="alfiemohamad_ai-innovation-checker"
SONAR_URL="https://sonarcloud.io"

echo "🔍 Monitoring SonarCloud Status for: $PROJECT_KEY"
echo "Dashboard: $SONAR_URL/project/overview?id=$PROJECT_KEY"
echo ""

# Check if project exists and get metrics
echo "📊 Testing Badge URLs:"
echo ""

echo "Quality Gate Badge:"
curl -s -w "\n" "$SONAR_URL/api/project_badges/measure?project=$PROJECT_KEY&metric=alert_status"
echo ""

echo "Coverage Badge:"  
curl -s -w "\n" "$SONAR_URL/api/project_badges/measure?project=$PROJECT_KEY&metric=coverage"
echo ""

echo "Code Smells Badge:"
curl -s -w "\n" "$SONAR_URL/api/project_badges/measure?project=$PROJECT_KEY&metric=code_smells"
echo ""

echo "✨ Badge URLs for README:"
echo "[![Quality Gate Status]($SONAR_URL/api/project_badges/measure?project=$PROJECT_KEY&metric=alert_status)]($SONAR_URL/summary/new_code?id=$PROJECT_KEY)"
echo "[![Coverage]($SONAR_URL/api/project_badges/measure?project=$PROJECT_KEY&metric=coverage)]($SONAR_URL/summary/new_code?id=$PROJECT_KEY)"
echo "[![Code Smells]($SONAR_URL/api/project_badges/measure?project=$PROJECT_KEY&metric=code_smells)]($SONAR_URL/summary/new_code?id=$PROJECT_KEY)"
echo ""

echo "🔗 Direct Links:"
echo "Project Dashboard: $SONAR_URL/project/overview?id=$PROJECT_KEY"
echo "Analysis History: $SONAR_URL/project/activity?id=$PROJECT_KEY"
echo ""

echo "✅ Troubleshooting Tips:"
echo "1. Check SONAR_TOKEN is set in GitHub Secrets"  
echo "2. Verify Automatic Analysis is DISABLED"
echo "3. Wait 2-3 minutes after pipeline completion"
echo "4. Check SonarCloud project visibility (should be public)"
