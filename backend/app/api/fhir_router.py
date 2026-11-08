from fastapi import APIRouter, HTTPException
from backend.app.interop.fhir_engine import fhir_engine

router = APIRouter(prefix="/fhir", tags=["FHIR R4 & HL7 Interoperability"])

@router.get("/Patient/{patient_id}/$everything")
async def get_patient_fhir_bundle(patient_id: str):
    """Retrieve full FHIR R4 standard JSON bundle for a patient."""
    bundle = fhir_engine.generate_patient_fhir_bundle(patient_id)
    if not bundle.get("entry"):
        raise HTTPException(status_code=404, detail="Patient FHIR resource not found")
    return bundle

@router.get("/hl7/adt/{patient_id}")
async def get_hl7_adt_message(patient_id: str):
    """Generate raw HL7 v2.5.1 ADT^A01 admission message."""
    raw_hl7 = fhir_engine.generate_hl7_v2_adt_message(patient_id)
    return {
        "format": "HL7 v2.5.1",
        "message_type": "ADT^A01",
        "raw_message": raw_hl7
    }
