# Synthetic fixtures

Every file in this directory is invented. No fixture came from a person, a laboratory, or
a health provider; the numbers were chosen by hand to sit on either side of the demo
policy thresholds and carry no other meaning.

| File | ageYears | hba1cPercent | egfrMlMin1_73m2 | Expected `vitapod-demo-metabolic-v1` result |
| --- | --- | --- | --- | --- |
| `eligible.json` | 45 | 6.4 | 92 | eligible |
| `ineligible.json` | 45 | 5.2 | 92 | ineligible (HbA1c below 5.7) |
| `boundary-age-18.json` | 18 | 6.4 | 92 | eligible (age threshold is inclusive) |
| `boundary-hba1c-5.7.json` | 45 | 5.7 | 92 | eligible (lower HbA1c threshold is inclusive) |
| `boundary-hba1c-8.5.json` | 45 | 8.5 | 92 | ineligible (upper HbA1c threshold is exclusive) |
| `boundary-egfr-60.json` | 45 | 6.4 | 60 | eligible (eGFR threshold is inclusive) |

Values are written with at most one decimal because the circuit consumes HbA1c as an
exact integer number of tenths. A record such as `5.70001` is rejected by both the
browser schema and the prover normalizer rather than rounded.
