#!/bin/bash

# Turbolearn AI Backend Test Script
echo "🚀 Testing Turbolearn AI Backend Endpoints"
echo "=========================================="

# Base URL (adjust if needed)
BASE_URL="http://localhost:8080"
AUTH_TOKEN="Bearer db928c0e-674d-40c3-816a-b9d940279615"

echo ""
echo "1. Testing Note-Taking Endpoint..."
echo "----------------------------------"
curl -X POST "$BASE_URL/v1/turbolearn/take-notes" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -d '{
    "content": "Today we learned about machine learning algorithms including supervised learning, unsupervised learning, and reinforcement learning. The key concepts were neural networks, deep learning, and practical applications in various industries.",
    "subject": "Machine Learning",
    "notesType": "lecture"
  }' \
  | jq '.'

echo ""
echo "2. Testing Quiz Generation Endpoint..."
echo "--------------------------------------"
curl -X POST "$BASE_URL/v1/turbolearn/generate-quiz" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -d '{
    "notes": "Machine learning algorithms include supervised learning, unsupervised learning, and reinforcement learning. Neural networks and deep learning are key concepts with practical applications.",
    "difficulty": "medium",
    "questionCount": 5,
    "quizType": "multiple_choice"
  }' \
  | jq '.'

echo ""
echo "3. Testing Story Generation Endpoint..."
echo "---------------------------------------"
curl -X POST "$BASE_URL/v1/turbolearn/generate-story" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -d '{
    "prompt": "Tell me a bedtime story about a friendly robot",
    "character": "Doraemon",
    "voice": "Doraemon",
    "sceneCount": 5,
    "genre": "bedtime"
  }' \
  | jq '.'

echo ""
echo "✅ All tests completed!"
echo "======================"
echo ""
echo "To test the full voice integration:"
echo "1. Start the backend: cd backend && ./gradlew bootRun"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Go to http://localhost:3000/voice"
echo "4. Say: 'Take notes about artificial intelligence'"
echo "5. Say: 'Generate quiz from my notes'"
echo "6. Say: 'Tell me a bedtime story'"
echo ""
echo "🎉 Enjoy your Turbolearn AI voice assistant!"
