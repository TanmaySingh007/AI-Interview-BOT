#!/usr/bin/env python3
"""
Simple test script to verify the backend is working correctly
"""

import requests
import json

def test_backend():
    base_url = "http://localhost:5000"
    
    print("🧪 Testing AI Interview Bot Backend...")
    print("=" * 50)
    
    # Test 1: Basic connectivity
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Basic connectivity: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Basic connectivity failed: {e}")
        return False
    
    # Test 2: Test endpoint
    try:
        response = requests.get(f"{base_url}/api/test")
        print(f"✅ Test endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Test endpoint failed: {e}")
        return False
    
    # Test 3: AI service test
    try:
        response = requests.get(f"{base_url}/api/test-ai")
        print(f"✅ AI service test: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ AI service test failed: {e}")
        return False
    
    # Test 4: Get roles
    try:
        response = requests.get(f"{base_url}/api/roles")
        print(f"✅ Get roles: {response.status_code}")
        data = response.json()
        print(f"   Roles: {data.get('roles', [])}")
    except Exception as e:
        print(f"❌ Get roles failed: {e}")
        return False
    
    # Test 5: Start interview
    try:
        interview_data = {
            "role_title": "Software Engineer",
            "role_description": "We are looking for a skilled software engineer with experience in full-stack development."
        }
        
        response = requests.post(
            f"{base_url}/api/start-interview",
            json=interview_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"✅ Start interview: {response.status_code}")
        data = response.json()
        print(f"   Interview ID: {data.get('interview_id', 'None')}")
        print(f"   Questions count: {len(data.get('questions', []))}")
        print(f"   First question: {data.get('questions', [])[0] if data.get('questions') else 'None'}")
        
        if data.get('status') == 'success':
            print("🎉 Interview started successfully!")
            return True
        else:
            print(f"❌ Interview start failed: {data}")
            return False
            
    except Exception as e:
        print(f"❌ Start interview failed: {e}")
        return False

if __name__ == "__main__":
    success = test_backend()
    if success:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the backend logs for details.")
