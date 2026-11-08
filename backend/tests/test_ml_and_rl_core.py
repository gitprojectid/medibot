import pytest
from backend.app.ml.clinical_ml_model import clinical_ml_model
from backend.app.ml.clinical_rl_agent import clinical_rl_agent

def test_multitask_ml_prediction():
    res = clinical_ml_model.predict(
        text="severe crushing substernal chest pain radiating to jaw and diaphoresis",
        vitals={"hr": 125, "sbp": 85, "temp": 98.6, "rr": 26, "spo2": 90}
    )
    assert res["predicted_triage_level"] in [3, 4]
    assert "multitask_predictions" in res
    assert res["multitask_predictions"]["sepsis_deterioration_risk"] >= 0.0
    assert res["multitask_predictions"]["icu_readmission_48h_probability"] >= 0.0
    assert res["multitask_predictions"]["mortality_risk_proxy_30d"] >= 0.0
    assert len(res["explainable_ai_factors"]) >= 1

def test_ml_model_retraining_loss_convergence():
    initial_epochs = clinical_ml_model.training_epochs
    clinical_ml_model._initialize_seed_training()
    assert clinical_ml_model.training_epochs > initial_epochs or clinical_ml_model.is_trained
    assert len(clinical_ml_model.loss_history) >= 1
    # Check that final loss is lower than initial loss
    if len(clinical_ml_model.loss_history) >= 2:
        assert clinical_ml_model.loss_history[-1] <= clinical_ml_model.loss_history[0]

def test_rl_agent_action_selection_and_td_update():
    # 1. Action selection
    action, directive, q_val = clinical_rl_agent.select_action(
        triage_tier=4,
        is_emergency=True,
        user_role="clinician",
        query_category="symptoms"
    )
    assert action == "EMERGENCY_FIRST_AID_OVERRIDE"
    assert "first-aid" in directive.lower() or "emergency" in directive.lower()
    
    # 2. Bellman TD error policy update
    initial_episodes = clinical_rl_agent.total_episodes
    log = clinical_rl_agent.update_policy(
        triage_tier=4,
        is_emergency=True,
        user_role="clinician",
        query_category="symptoms",
        action="EMERGENCY_FIRST_AID_OVERRIDE",
        reward=5.0,
        next_triage_tier=1
    )
    assert log["episode"] == initial_episodes + 1
    assert "td_error" in log
    assert "updated_q" in log
    assert clinical_rl_agent.epsilon <= 0.15

def test_rl_agent_telemetry():
    telemetry = clinical_rl_agent.get_telemetry()
    assert "Dual-Critic" in telemetry["algorithm"]
    assert telemetry["total_episodes"] >= 1
    assert len(telemetry["sample_q_table"]) >= 1
