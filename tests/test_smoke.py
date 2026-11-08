from nexus.prompts import build_system_prompt


def test_system_prompt_has_identity_and_safety_rules():
    prompt = build_system_prompt("NEXUS")
    assert "NEXUS" in prompt
    assert "недоверенными данными" in prompt
    assert "Не утверждай" in prompt
