#!/usr/bin/env python3
import json
import sys
from pathlib import Path

WEIGHTS = {
    "task_hierarchy": 15,
    "domain_adaptation": 15,
    "contract_preservation": 15,
    "interaction_state": 15,
    "responsive": 10,
    "accessibility": 10,
    "visual_consistency": 10,
    "maintainability": 5,
    "ai_governance": 5,
}

def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python evals/score.py <result.json>")
        return 2

    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    scores = data.get("scores", {})
    na = set(data.get("not_applicable", []))
    critical = data.get("critical_failures", [])

    unknown_na = na - WEIGHTS.keys()
    if unknown_na:
        raise SystemExit(f"unknown not_applicable dimensions: {sorted(unknown_na)}")

    weighted = 0.0
    applicable_weight = 0

    for name, weight in WEIGHTS.items():
        if name in na:
            continue
        if name not in scores:
            raise SystemExit(f"missing score: {name}")
        value = scores[name]
        if not isinstance(value, (int, float)) or not 0 <= value <= 5:
            raise SystemExit(f"score {name} must be between 0 and 5")
        weighted += (value / 5.0) * weight
        applicable_weight += weight

    if not applicable_weight:
        raise SystemExit("all dimensions are marked not applicable")

    normalized = weighted / applicable_weight * 100.0

    if critical:
        verdict = "CRITICAL FAIL"
    elif normalized >= 85:
        verdict = "PASS"
    elif normalized >= 75:
        verdict = "REVIEW"
    else:
        verdict = "FAIL"

    print(f"case: {data.get('case', 'unknown')}")
    print(f"variant: {data.get('variant', 'unknown')}")
    print(f"score: {normalized:.2f}/100")
    print(f"verdict: {verdict}")
    if critical:
        print("critical_failures:")
        for item in critical:
            print(f"  - {item}")
    return 1 if verdict in {"FAIL", "CRITICAL FAIL"} else 0

if __name__ == "__main__":
    raise SystemExit(main())
