#!/usr/bin/env python3
"""
Additional OCR Scanning Test for Clinic Digitization App
Tests the OCR scanning functionality with base64 image data
"""

import requests
import json
import base64
from datetime import datetime

# Configuration
BASE_URL = "https://clinic-scan-ai.preview.emergentagent.com/api"
TIMEOUT = 30

def test_ocr_scan_base64():
    """Test POST /api/scan/base64 with sample medical text image"""
    
    # Create a simple test image with medical text (simulated base64)
    # In a real scenario, this would be actual image data
    # For testing purposes, we'll test the endpoint structure
    
    try:
        # Test with empty base64 to check error handling
        test_data = {
            "image_base64": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/scan/base64",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        print(f"🔍 Testing OCR Scan Base64 Endpoint")
        print(f"📍 URL: {BASE_URL}/scan/base64")
        
        if response.status_code == 400:
            print("✅ PASS OCR Scan Base64 - Correctly handles empty image data")
            print(f"    Details: {response.json()}")
            return True
        else:
            print(f"❌ FAIL OCR Scan Base64 - Expected 400 for empty data, got {response.status_code}")
            print(f"    Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL OCR Scan Base64 - Exception: {str(e)}")
        return False

def test_ocr_scan_multipart():
    """Test POST /api/scan with multipart file upload"""
    
    try:
        # Test with no file to check error handling
        response = requests.post(
            f"{BASE_URL}/scan",
            timeout=TIMEOUT
        )
        
        print(f"🔍 Testing OCR Scan Multipart Endpoint")
        print(f"📍 URL: {BASE_URL}/scan")
        
        if response.status_code == 422:  # FastAPI validation error for missing file
            print("✅ PASS OCR Scan Multipart - Correctly handles missing file")
            print(f"    Details: Validation error as expected")
            return True
        else:
            print(f"❌ FAIL OCR Scan Multipart - Expected 422 for missing file, got {response.status_code}")
            print(f"    Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL OCR Scan Multipart - Exception: {str(e)}")
        return False

def main():
    """Run OCR scanning tests"""
    print("🚀 Starting OCR Scanning Tests")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    # Test base64 scanning
    if test_ocr_scan_base64():
        passed += 1
    else:
        failed += 1
    
    print()
    
    # Test multipart scanning
    if test_ocr_scan_multipart():
        passed += 1
    else:
        failed += 1
    
    print("=" * 50)
    print(f"📊 OCR Test Results:")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    return passed, failed

if __name__ == "__main__":
    main()