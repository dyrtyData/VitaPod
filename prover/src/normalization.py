"""Synthetic fixture -> exact-integer circuit input.

Mirrors `SyntheticLabRecord` + `normalizeToFixedPoint` in packages/shared. JSON numbers
are parsed as Decimal so no float ever touches the value; anything that is not an
exact integer (or an exact tenth for HbA1c) is rejected, never rounded.
"""

from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Any

RECORD_KIND = "vitapod.synthetic-lab.v1"
FIELDS = ("kind", "ageYears", "hba1cPercent", "egfrMlMin1_73m2")


class NormalizationError(ValueError):
    pass


def _integer(value: Any, name: str, lo: int, hi: int) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, Decimal)):
        raise NormalizationError(f"{name} must be a number")
    as_decimal = Decimal(value)
    if as_decimal != as_decimal.to_integral_value():
        raise NormalizationError(f"{name} must be an integer")
    result = int(as_decimal)
    if not lo <= result <= hi:
        raise NormalizationError(f"{name} must be between {lo} and {hi}")
    return result


def _tenths(value: Any, name: str, lo: int, hi: int) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, Decimal)):
        raise NormalizationError(f"{name} must be a number")
    scaled = Decimal(value) * 10
    if scaled != scaled.to_integral_value():
        raise NormalizationError(f"{name} must be an exact tenth (e.g. 5.7)")
    result = int(scaled)
    if not lo * 10 <= result <= hi * 10:
        raise NormalizationError(f"{name} must be between {lo} and {hi}")
    return result


def normalize_record(record: Any) -> list[int]:
    """Returns `[ageYears, hba1cPercent * 10, egfrMlMin1_73m2]` as exact integers."""
    if not isinstance(record, dict):
        raise NormalizationError("record must be a JSON object")
    if set(record) != set(FIELDS):
        raise NormalizationError(f"record must have exactly the fields {list(FIELDS)}")
    if record["kind"] != RECORD_KIND:
        raise NormalizationError(f"kind must be {RECORD_KIND!r}")
    return [
        _integer(record["ageYears"], "ageYears", 0, 130),
        _tenths(record["hba1cPercent"], "hba1cPercent", 0, 20),
        _integer(record["egfrMlMin1_73m2"], "egfrMlMin1_73m2", 0, 200),
    ]


def parse_record_text(text: str) -> Any:
    return json.loads(text, parse_float=Decimal)


def fixture_to_ezkl_input(path: Path) -> dict[str, list[list[int]]]:
    """Shape expected by `ezkl gen-witness -D`: one batch of three int64 values."""
    return {"input_data": [normalize_record(parse_record_text(path.read_text()))]}
