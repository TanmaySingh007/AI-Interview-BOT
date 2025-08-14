#!/usr/bin/env python3
"""
Simple connection test script
"""

import requests
import time

def test_connection():
    base_url = "http://localhost:5000"
    
    print("🔌 Testing Backend Connection...")
    print("=" * 40)
    
    # Test basic connectivity
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✅ Basic connection: {response.status_code}")
        print(f"   Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("❌ Connection refused - Backend not running")
        print("   Please start the backend with: python app.py")
        return False
    except requests.exceptions.Timeout:
        print("❌ Connection timeout - Backend not responding")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test API endpoints
    try:
        response = requests.get(f"{base_url}/api/test", timeout=5)
        print(f"✅ API test: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False
    
    print("\n🎉 Backend is accessible and working!")
    return True

if __name__ == "__main__":
    test_connection()
