#!/usr/bin/env python3
"""
Backend API Testing Script for Clinic Digitization App
Tests all backend endpoints as specified in the review request
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://clinic-scan-ai.preview.emergentagent.com/api"
TIMEOUT = 30

class ClinicAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_results = []
        self.patient_id = None
        self.visit_id = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()
        
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, f"Status: {data['status']}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_dashboard_stats(self):
        """Test GET /api/stats"""
        try:
            response = self.session.get(f"{self.base_url}/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_patients", "total_visits", "today_visits", "recent_visits"]
                
                if all(field in data for field in required_fields):
                    self.log_test("Dashboard Stats", True, 
                                f"Patients: {data['total_patients']}, Visits: {data['total_visits']}")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Dashboard Stats", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Dashboard Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Exception: {str(e)}")
            return False
    
    def test_create_patient(self):
        """Test POST /api/patients"""
        try:
            patient_data = {
                "name": "Dr. Sarah Johnson",
                "age": 35,
                "gender": "Female",
                "phone": "9876543210"
            }
            
            response = self.session.post(
                f"{self.base_url}/patients",
                json=patient_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name"] == patient_data["name"]:
                    self.patient_id = data["id"]
                    self.log_test("Create Patient", True, f"Created patient ID: {self.patient_id}")
                    return True
                else:
                    self.log_test("Create Patient", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Create Patient", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Patient", False, f"Exception: {str(e)}")
            return False
    
    def test_list_patients(self):
        """Test GET /api/patients"""
        try:
            response = self.session.get(f"{self.base_url}/patients")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("List Patients", True, f"Found {len(data)} patients")
                    return True
                else:
                    self.log_test("List Patients", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("List Patients", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("List Patients", False, f"Exception: {str(e)}")
            return False
    
    def test_get_patient_by_id(self):
        """Test GET /api/patients/{id}"""
        if not self.patient_id:
            self.log_test("Get Patient by ID", False, "No patient ID available from create test")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/patients/{self.patient_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data["id"] == self.patient_id:
                    self.log_test("Get Patient by ID", True, f"Retrieved patient: {data['name']}")
                    return True
                else:
                    self.log_test("Get Patient by ID", False, f"ID mismatch: {data}")
                    return False
            else:
                self.log_test("Get Patient by ID", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Patient by ID", False, f"Exception: {str(e)}")
            return False
    
    def test_create_visit(self):
        """Test POST /api/visits"""
        if not self.patient_id:
            self.log_test("Create Visit", False, "No patient ID available")
            return False
            
        try:
            visit_data = {
                "patient_id": self.patient_id,
                "symptoms": "Persistent cough, mild fever, fatigue",
                "diagnosis": "Upper respiratory tract infection",
                "prescription": "Azithromycin 500mg OD x 5 days, Paracetamol 650mg TDS PRN",
                "image_base64": None
            }
            
            response = self.session.post(
                f"{self.base_url}/visits",
                json=visit_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["patient_id"] == self.patient_id:
                    self.visit_id = data["id"]
                    self.log_test("Create Visit", True, f"Created visit ID: {self.visit_id}")
                    return True
                else:
                    self.log_test("Create Visit", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Create Visit", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Visit", False, f"Exception: {str(e)}")
            return False
    
    def test_list_visits(self):
        """Test GET /api/visits"""
        try:
            response = self.session.get(f"{self.base_url}/visits")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("List Visits", True, f"Found {len(data)} visits")
                    return True
                else:
                    self.log_test("List Visits", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("List Visits", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("List Visits", False, f"Exception: {str(e)}")
            return False
    
    def test_get_visit_by_id(self):
        """Test GET /api/visits/{visit_id}"""
        if not self.visit_id:
            self.log_test("Get Visit by ID", False, "No visit ID available from create test")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/visits/{self.visit_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data["id"] == self.visit_id:
                    self.log_test("Get Visit by ID", True, f"Retrieved visit for patient: {data['patient_id']}")
                    return True
                else:
                    self.log_test("Get Visit by ID", False, f"ID mismatch: {data}")
                    return False
            else:
                self.log_test("Get Visit by ID", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Visit by ID", False, f"Exception: {str(e)}")
            return False
    
    def test_get_visits_by_patient(self):
        """Test GET /api/visits?patient_id={id}"""
        if not self.patient_id:
            self.log_test("Get Visits by Patient", False, "No patient ID available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/visits?patient_id={self.patient_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if all visits belong to the patient
                    valid = all(visit["patient_id"] == self.patient_id for visit in data)
                    if valid:
                        self.log_test("Get Visits by Patient", True, f"Found {len(data)} visits for patient")
                        return True
                    else:
                        self.log_test("Get Visits by Patient", False, "Some visits don't belong to the patient")
                        return False
                else:
                    self.log_test("Get Visits by Patient", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Visits by Patient", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Visits by Patient", False, f"Exception: {str(e)}")
            return False
    
    def test_powerbi_data(self):
        """Test GET /api/powerbi/data"""
        try:
            response = self.session.get(f"{self.base_url}/powerbi/data")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["patients", "visits", "summary"]
                
                if all(field in data for field in required_fields):
                    summary = data["summary"]
                    self.log_test("Power BI Data Export", True, 
                                f"Exported {summary.get('total_patients', 0)} patients, {summary.get('total_visits', 0)} visits")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Power BI Data Export", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Power BI Data Export", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Power BI Data Export", False, f"Exception: {str(e)}")
            return False
    
    def test_update_patient(self):
        """Test PUT /api/patients/{id}"""
        if not self.patient_id:
            self.log_test("Update Patient", False, "No patient ID available")
            return False
            
        try:
            updated_data = {
                "name": "Dr. Sarah Johnson-Smith",
                "age": 36,
                "gender": "Female",
                "phone": "9876543211"
            }
            
            response = self.session.put(
                f"{self.base_url}/patients/{self.patient_id}",
                json=updated_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["name"] == updated_data["name"] and data["age"] == updated_data["age"]:
                    self.log_test("Update Patient", True, f"Updated patient: {data['name']}")
                    return True
                else:
                    self.log_test("Update Patient", False, f"Update not reflected: {data}")
                    return False
            else:
                self.log_test("Update Patient", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Patient", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_visit(self):
        """Test DELETE /api/visits/{visit_id}"""
        if not self.visit_id:
            self.log_test("Delete Visit", False, "No visit ID available")
            return False
            
        try:
            response = self.session.delete(f"{self.base_url}/visits/{self.visit_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted" in data["message"].lower():
                    self.log_test("Delete Visit", True, f"Deleted visit: {self.visit_id}")
                    return True
                else:
                    self.log_test("Delete Visit", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Delete Visit", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Visit", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_patient(self):
        """Test DELETE /api/patients/{id}"""
        if not self.patient_id:
            self.log_test("Delete Patient", False, "No patient ID available")
            return False
            
        try:
            response = self.session.delete(f"{self.base_url}/patients/{self.patient_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted" in data["message"].lower():
                    self.log_test("Delete Patient", True, f"Deleted patient: {self.patient_id}")
                    return True
                else:
                    self.log_test("Delete Patient", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Delete Patient", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Patient", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in the specified order"""
        print(f"🚀 Starting Clinic Digitization API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"⏰ Timeout: {TIMEOUT}s")
        print("=" * 60)
        
        # Test sequence as specified in review request
        tests = [
            ("Health Check", self.test_health_check),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Create Patient", self.test_create_patient),
            ("List Patients", self.test_list_patients),
            ("Get Patient by ID", self.test_get_patient_by_id),
            ("Create Visit", self.test_create_visit),
            ("List Visits", self.test_list_visits),
            ("Get Visit by ID", self.test_get_visit_by_id),
            ("Get Visits by Patient", self.test_get_visits_by_patient),
            ("Power BI Data Export", self.test_powerbi_data),
            ("Update Patient", self.test_update_patient),
            ("Delete Visit", self.test_delete_visit),
            ("Delete Patient", self.test_delete_patient),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name} - Unexpected error: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        print("=" * 60)
        print(f"📊 Test Results Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return passed, failed, self.test_results

def main():
    """Main function to run tests"""
    tester = ClinicAPITester()
    passed, failed, results = tester.run_all_tests()
    
    # Save detailed results to file
    with open('/app/test_results_detailed.json', 'w') as f:
        json.dump({
            "summary": {
                "passed": passed,
                "failed": failed,
                "total": passed + failed,
                "success_rate": (passed/(passed+failed)*100) if (passed+failed) > 0 else 0
            },
            "tests": results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_results_detailed.json")
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()