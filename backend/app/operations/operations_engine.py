import datetime
from typing import Dict, Any, List, Optional
from backend.app.hospital.synthetic_hospital import METRO_HOSPITAL

class HospitalOperationsEngine:
    """
    Enterprise Hospital Operations, Bed Capacity & Resource Forecasting Engine.
    Maintains dynamic bed occupancy, ED queue flow, and real-time admission/discharge tracking.
    """

    def __init__(self):
        self.departments = [
            {"id": "dept-ed", "name": "Emergency Department (ED)", "total_beds": 60, "occupied": 52, "available": 8, "occupancy_pct": 86.7, "status": "Busy"},
            {"id": "dept-icu", "name": "Intensive Care Unit (ICU)", "total_beds": 45, "occupied": 40, "available": 5, "occupancy_pct": 88.9, "status": "Near Capacity"},
            {"id": "dept-cardio", "name": "Cardiology & Telemetry", "total_beds": 50, "occupied": 44, "available": 6, "occupancy_pct": 88.0, "status": "Busy"},
            {"id": "dept-neuro", "name": "Neurology & Stroke Unit", "total_beds": 40, "occupied": 34, "available": 6, "occupancy_pct": 85.0, "status": "Normal"},
            {"id": "dept-genmed", "name": "General Internal Medicine", "total_beds": 120, "occupied": 108, "available": 12, "occupancy_pct": 90.0, "status": "Surge Protocol"},
            {"id": "dept-ortho", "name": "Orthopedic Surgery", "total_beds": 40, "occupied": 28, "available": 12, "occupancy_pct": 70.0, "status": "Normal"},
            {"id": "dept-obgyn", "name": "Obstetrics & Delivery", "total_beds": 45, "occupied": 32, "available": 13, "occupancy_pct": 71.1, "status": "Normal"},
            {"id": "dept-peds", "name": "Pediatrics / NICU", "total_beds": 50, "occupied": 38, "available": 12, "occupancy_pct": 76.0, "status": "Normal"}
        ]
        self.total_admissions_today = 68
        self.total_discharges_today = 54
        self.ed_active_patients = 52

    def get_operations_dashboard(self) -> Dict[str, Any]:
        total_beds = sum(d["total_beds"] for d in self.departments)
        occupied_beds = sum(d["occupied"] for d in self.departments)
        available_beds = total_beds - occupied_beds
        occupancy_pct = round((occupied_beds / total_beds) * 100, 1)

        # Multi-Horizon Bed Demand Forecast
        bed_forecast = {
            "horizon_6h": {
                "projected_admissions": 18,
                "projected_discharges": 22,
                "net_bed_change": "+4 Available",
                "icu_demand": 2,
                "surge_risk": "Low"
            },
            "horizon_24h": {
                "projected_admissions": 74,
                "projected_discharges": 68,
                "net_bed_change": "-6 Deficit",
                "icu_demand": 8,
                "surge_risk": "Moderate"
            },
            "horizon_7d": {
                "projected_admissions": 490,
                "projected_discharges": 510,
                "net_bed_change": "+20 Balanced",
                "icu_demand": 42,
                "surge_risk": "Stable"
            }
        }

        # Emergency Department (ED) Real-Time Metrics
        ed_metrics = {
            "active_patients_in_ed": self.ed_active_patients,
            "waiting_room_count": 14,
            "average_wait_time_minutes": 26,
            "left_without_being_seen_pct": 1.2,
            "triage_acuity_breakdown": {
                "ESI_1_Resuscitation": 2,
                "ESI_2_Emergent": 12,
                "ESI_3_Urgent": 24,
                "ESI_4_Less_Urgent": 10,
                "ESI_5_Non_Urgent": 4
            },
            "fast_track_open": True,
            "ambulance_diversion_status": "NORMAL (No Diversion)"
        }

        # Blood Bank Inventory
        blood_bank = {
            "overall_status": "Adequate Supply",
            "last_updated": datetime.datetime.now(datetime.UTC).isoformat(),
            "inventory": [
                {"group": "O- (Universal Donor)", "units_available": 18, "minimum_reserve": 15, "status": "Adequate", "days_of_supply": 3.2},
                {"group": "O+", "units_available": 62, "minimum_reserve": 40, "status": "Optimal", "days_of_supply": 6.8},
                {"group": "A-", "units_available": 14, "minimum_reserve": 12, "status": "Adequate", "days_of_supply": 3.5},
                {"group": "A+", "units_available": 58, "minimum_reserve": 35, "status": "Optimal", "days_of_supply": 7.1},
                {"group": "B-", "units_available": 8, "minimum_reserve": 10, "status": "Low Reserve Watch", "days_of_supply": 2.1},
                {"group": "B+", "units_available": 28, "minimum_reserve": 20, "status": "Optimal", "days_of_supply": 5.4},
                {"group": "AB-", "units_available": 6, "minimum_reserve": 5, "status": "Adequate", "days_of_supply": 4.0},
                {"group": "AB+ (Universal Recipient)", "units_available": 22, "minimum_reserve": 15, "status": "Optimal", "days_of_supply": 6.0}
            ]
        }

        # Critical Medical Resources & Oxygen Capacity
        resource_forecast = {
            "medical_oxygen_bulk_tank_pct": 84.5,
            "oxygen_daily_consumption_liters": 12400,
            "days_of_oxygen_reserve": 14.2,
            "mechanical_ventilators_total": 42,
            "ventilators_in_use": 18,
            "ventilators_available": 24,
            "hemodialysis_machines_available": 6,
            "ecmo_circuits_available": 2
        }

        return {
            "hospital_name": METRO_HOSPITAL["name"],
            "network": METRO_HOSPITAL["network"],
            "summary": {
                "total_beds": total_beds,
                "occupied_beds": occupied_beds,
                "available_beds": available_beds,
                "occupancy_rate_pct": occupancy_pct,
                "icu_occupancy_pct": 88.9,
                "ed_active_patients": self.ed_active_patients,
                "ed_average_wait_minutes": 26,
                "admissions_last_24h": self.total_admissions_today,
                "discharges_planned_today": self.total_discharges_today
            },
            "departments": self.departments,
            "bed_forecast": bed_forecast,
            "emergency_department": ed_metrics,
            "blood_bank": blood_bank,
            "resources": resource_forecast
        }

    def admit_patient_to_dept(self, dept_name_or_id: str) -> Dict[str, Any]:
        """
        Increment occupancy for a department upon new patient admission.
        """
        for d in self.departments:
            if d["id"] == dept_name_or_id or dept_name_or_id.lower() in d["name"].lower():
                if d["available"] > 0:
                    d["occupied"] += 1
                    d["available"] -= 1
                    d["occupancy_pct"] = round((d["occupied"] / d["total_beds"]) * 100, 1)
                    self.total_admissions_today += 1
                    return {"status": "success", "department": d}
                return {"status": "error", "message": f"{d['name']} has no available beds (At Capacity)"}
        return {"status": "error", "message": "Department not found"}

    def discharge_patient_from_dept(self, dept_name_or_id: str) -> Dict[str, Any]:
        """
        Release a bed upon patient discharge.
        """
        for d in self.departments:
            if d["id"] == dept_name_or_id or dept_name_or_id.lower() in d["name"].lower():
                if d["occupied"] > 0:
                    d["occupied"] -= 1
                    d["available"] += 1
                    d["occupancy_pct"] = round((d["occupied"] / d["total_beds"]) * 100, 1)
                    self.total_discharges_today += 1
                    return {"status": "success", "department": d}
                return {"status": "error", "message": "No occupied beds in department"}
        return {"status": "error", "message": "Department not found"}

operations_engine = HospitalOperationsEngine()
