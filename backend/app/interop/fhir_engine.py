import uuid
import datetime
from typing import Dict, Any, List
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS, METRO_HOSPITAL

class FHIRInteroperabilityEngine:
    """
    HL7 FHIR R4 Interoperability & Integration Engine.
    Converts internal patient records into official HL7 FHIR R4 JSON bundles and HL7 v2 messages.
    """

    def generate_patient_fhir_bundle(self, patient_id: str) -> Dict[str, Any]:
        """
        Generate a complete, valid FHIR R4 Transaction/Collection Bundle for a patient.
        """
        patient = None
        for p in SYNTHETIC_PATIENTS:
            if p["id"] == patient_id:
                patient = p
                break
        
        if not patient:
            return {"resourceType": "Bundle", "type": "collection", "entry": []}

        bundle_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"

        entries = []

        # 1. FHIR Patient Resource
        fhir_patient = {
            "fullUrl": f"urn:uuid:{patient['id']}",
            "resource": {
                "resourceType": "Patient",
                "id": patient["id"],
                "identifier": [
                    {
                        "use": "usual",
                        "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR", "display": "Medical Record Number"}]},
                        "system": "http://metrohealth.org/mrn",
                        "value": patient["mrn"]
                    }
                ],
                "active": True,
                "name": [
                    {
                        "use": "official",
                        "text": patient["full_name"],
                        "family": patient["full_name"].split()[-1],
                        "given": patient["full_name"].split()[:-1]
                    }
                ],
                "gender": patient["gender"].lower(),
                "birthDate": patient["dob"],
                "managingOrganization": {
                    "reference": f"Organization/{METRO_HOSPITAL['id']}",
                    "display": METRO_HOSPITAL["name"]
                }
            }
        }
        entries.append(fhir_patient)

        # 2. FHIR Conditions
        for idx, cond in enumerate(patient.get("active_conditions", [])):
            entries.append({
                "fullUrl": f"urn:uuid:cond-{idx}-{patient['id']}",
                "resource": {
                    "resourceType": "Condition",
                    "id": f"cond-{idx}",
                    "clinicalStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
                    },
                    "verificationStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "confirmed"}]
                    },
                    "code": {
                        "coding": [
                            {"system": "http://hl7.org/fhir/sid/icd-10-cm", "code": cond.get("code", "R69"), "display": cond["name"]}
                        ],
                        "text": cond["name"]
                    },
                    "subject": {"reference": f"Patient/{patient['id']}", "display": patient["full_name"]}
                }
            })

        # 3. FHIR Observations (Vitals)
        if patient.get("vitals_time_series"):
            latest = patient["vitals_time_series"][-1]
            entries.append({
                "fullUrl": f"urn:uuid:obs-vitals-{patient['id']}",
                "resource": {
                    "resourceType": "Observation",
                    "id": f"obs-bp-{patient['id']}",
                    "status": "final",
                    "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
                    "code": {"coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel with all children optional"}]},
                    "subject": {"reference": f"Patient/{patient['id']}"},
                    "effectiveDateTime": latest["timestamp"],
                    "component": [
                        {
                            "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]},
                            "valueQuantity": {"value": latest["sbp"], "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
                        },
                        {
                            "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]},
                            "valueQuantity": {"value": latest["dbp"], "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
                        }
                    ]
                }
            })

        # 4. FHIR MedicationRequests
        for idx, med in enumerate(patient.get("active_medications", [])):
            entries.append({
                "fullUrl": f"urn:uuid:med-{idx}-{patient['id']}",
                "resource": {
                    "resourceType": "MedicationRequest",
                    "id": f"medreq-{idx}",
                    "status": "active",
                    "intent": "order",
                    "medicationCodeableConcept": {
                        "text": f"{med['name']} {med['dose']}"
                    },
                    "subject": {"reference": f"Patient/{patient['id']}"},
                    "dosageInstruction": [
                        {
                            "text": f"{med['dose']} {med.get('route', 'Oral')} {med.get('freq', 'Daily')}",
                            "route": {"text": med.get("route", "Oral")}
                        }
                    ]
                }
            })

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {
                "lastUpdated": timestamp,
                "profile": ["http://hl7.org/fhir/StructureDefinition/Bundle"]
            },
            "type": "collection",
            "total": len(entries),
            "entry": entries
        }

    def generate_hl7_v2_adt_message(self, patient_id: str) -> str:
        """
        Generate raw HL7 v2.5.1 ADT^A01 (Patient Admission) message.
        """
        patient = None
        for p in SYNTHETIC_PATIENTS:
            if p["id"] == patient_id:
                patient = p
                break
        if not patient:
            return "MSH|^~\\&|METRO_AI|METRO_HOSPITAL|||20260830120000||ADT^A01|MSG00001|P|2.5.1\nERR|Patient not found"

        now_str = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
        msg_id = str(uuid.uuid4())[:8].upper()

        msh = f"MSH|^~\\&|METRO_AI_CDS|METRO_HEALTH_CENTER|EPIC_EHR|METRO_HOSPITAL|{now_str}||ADT^A01|{msg_id}|P|2.5.1"
        evn = f"EVN|A01|{now_str}"
        pid = f"PID|1||{patient['mrn']}||{patient['full_name'].split()[-1]}^{patient['full_name'].split()[0]}||{patient['dob'].replace('-', '')}|{patient['gender'][0]}|||750 Medical Plaza Blvd^^Metro City^NY^10021"
        pv1 = f"PV1|1|I|{patient['assigned_ward']}^{patient['room_bed']}^^METRO_HOSPITAL||||{patient['attending_physician']}|||||||||||{patient['mrn']}-ADM|||||||||||||||||||||||||{now_str}"
        dg1 = f"DG1|1|I10|{patient['active_conditions'][0]['code']}^{patient['active_conditions'][0]['name']}|Final" if patient.get("active_conditions") else ""

        return "\n".join([msh, evn, pid, pv1, dg1])

fhir_engine = FHIRInteroperabilityEngine()
