#!/usr/bin/env python3
"""
Simple test script to verify the note-taking agent implementation
"""

import json
import os
import sys

def test_file_structure():
    """Test that all required files are created"""
    print("🔍 Testing file structure...")
    
    required_files = [
        "frontend/components/MCP/NoteTaking/NoteTakingWidget.tsx",
        "frontend/components/MCP/NoteTaking/NoteTakingMCPConfig.ts",
        "frontend/components/MCP/NoteTaking/index.ts",
        "frontend/app/api/turbolearn/youtube-notes/route.ts",
        "frontend/app/api/upload/route.ts",
        "mock-backend/server.js",
        "evaluation_dataset.json",
        "test_note_taking_agent.js",
        "NOTE_TAKING_AGENT_README.md"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        return False
    else:
        print("✅ All required files present")
        return True

def test_evaluation_dataset():
    """Test that evaluation dataset is valid JSON"""
    print("\n📊 Testing evaluation dataset...")
    
    try:
        with open("evaluation_dataset.json", "r") as f:
            dataset = json.load(f)
        
        # Check required fields
        required_fields = ["dataset_name", "version", "total_samples", "samples"]
        for field in required_fields:
            if field not in dataset:
                print(f"❌ Missing field: {field}")
                return False
        
        # Check sample count
        if len(dataset["samples"]) != dataset["total_samples"]:
            print(f"❌ Sample count mismatch: {len(dataset['samples'])} != {dataset['total_samples']}")
            return False
        
        print(f"✅ Evaluation dataset valid with {dataset['total_samples']} samples")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in evaluation dataset: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading evaluation dataset: {e}")
        return False

def test_mcp_widget():
    """Test MCP widget component structure"""
    print("\n🧩 Testing MCP widget component...")
    
    try:
        with open("frontend/components/MCP/NoteTaking/NoteTakingWidget.tsx", "r") as f:
            content = f.read()
        
        # Check for required imports and components
        required_elements = [
            "import React",
            "NoteTakingWidget",
            "FileUpload",
            "NoteContent",
            "handleFileUpload",
            "handleYoutubeProcessing",
            "generateStudyMaterial"
        ]
        
        missing_elements = []
        for element in required_elements:
            if element not in content:
                missing_elements.append(element)
        
        if missing_elements:
            print(f"❌ Missing elements in widget: {missing_elements}")
            return False
        
        print("✅ MCP widget component structure valid")
        return True
        
    except Exception as e:
        print(f"❌ Error reading widget component: {e}")
        return False

def test_api_endpoints():
    """Test API endpoint structure"""
    print("\n🔌 Testing API endpoints...")
    
    # Test YouTube notes endpoint
    try:
        with open("frontend/app/api/turbolearn/youtube-notes/route.ts", "r") as f:
            youtube_content = f.read()
        
        if "POST" not in youtube_content or "youtubeUrl" not in youtube_content:
            print("❌ YouTube notes endpoint missing required elements")
            return False
        
        print("✅ YouTube notes endpoint valid")
        
    except Exception as e:
        print(f"❌ Error reading YouTube endpoint: {e}")
        return False
    
    # Test upload endpoint
    try:
        with open("frontend/app/api/upload/route.ts", "r") as f:
            upload_content = f.read()
        
        if "POST" not in upload_content or "formData" not in upload_content:
            print("❌ Upload endpoint missing required elements")
            return False
        
        print("✅ Upload endpoint valid")
        
    except Exception as e:
        print(f"❌ Error reading upload endpoint: {e}")
        return False
    
    return True

def test_backend_server():
    """Test backend server structure"""
    print("\n🖥️ Testing backend server...")
    
    try:
        with open("mock-backend/server.js", "r") as f:
            content = f.read()
        
        # Check for required endpoints
        required_endpoints = [
            "/v1/turbolearn/take-notes",
            "/v1/turbolearn/youtube-notes",
            "/v1/turbolearn/generate-quiz",
            "/v1/turbolearn/generate-flashcards",
            "/v1/turbolearn/generate-summary",
            "/v1/turbolearn/generate-action-items",
            "/v1/turbolearn/generate-key-points"
        ]
        
        missing_endpoints = []
        for endpoint in required_endpoints:
            if endpoint not in content:
                missing_endpoints.append(endpoint)
        
        if missing_endpoints:
            print(f"❌ Missing endpoints: {missing_endpoints}")
            return False
        
        print("✅ Backend server structure valid")
        return True
        
    except Exception as e:
        print(f"❌ Error reading backend server: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Note-Taking Agent Implementation Test")
    print("=" * 50)
    
    tests = [
        test_file_structure,
        test_evaluation_dataset,
        test_mcp_widget,
        test_api_endpoints,
        test_backend_server
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Implementation is ready.")
        return 0
    else:
        print("⚠️ Some tests failed. Please review the implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
