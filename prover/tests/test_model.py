import hashlib
import json
from decimal import Decimal
from pathlib import Path

import onnx
import pytest

from model import GRAPH_VARIANT, build_policy_graph, policy_graph_bytes
from normalization import (
    NormalizationError,
    fixture_to_ezkl_input,
    normalize_record,
    parse_record_text,
)

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"
VALID = (
    '{"kind": "vitapod.synthetic-lab.v1", "ageYears": 45, '
    '"hba1cPercent": 6.4, "egfrMlMin1_73m2": 92}'
)


def test_policy_graph_bytes_are_deterministic():
    first = policy_graph_bytes()
    second = policy_graph_bytes()
    assert first == second
    assert hashlib.sha256(first).hexdigest() == hashlib.sha256(second).hexdigest()


def test_policy_graph_shape_and_ops():
    model = build_policy_graph()
    onnx.checker.check_model(model)
    ops = [node.op_type for node in model.graph.node]
    assert ops.count("GreaterOrEqual") == 3
    assert ops.count("Less") == 1
    assert ops.count("And") == 3
    assert ops[-1] == "Cast"
    assert [i.name for i in model.graph.input] == ["input"]
    assert [o.name for o in model.graph.output] == ["output"]
    assert GRAPH_VARIANT == "comparisons-and"


def test_policy_graph_thresholds():
    model = build_policy_graph()
    constants = {
        node.output[0]: int(onnx.numpy_helper.to_array(node.attribute[0].t)[0][0])
        for node in model.graph.node
        if node.op_type == "Constant"
    }
    assert constants == {
        "min_age": 18,
        "min_hba1c": 57,
        "max_hba1c_exclusive": 85,
        "min_egfr": 60,
    }


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("eligible.json", [45, 64, 92]),
        ("ineligible.json", [45, 52, 92]),
        ("boundary-age-18.json", [18, 64, 92]),
        ("boundary-hba1c-5.7.json", [45, 57, 92]),
        ("boundary-hba1c-8.5.json", [45, 85, 92]),
        ("boundary-egfr-60.json", [45, 64, 60]),
    ],
)
def test_fixtures_normalize_to_exact_integers(name, expected):
    payload = fixture_to_ezkl_input(FIXTURES / name)
    assert payload == {"input_data": [expected]}
    assert all(type(v) is int for v in payload["input_data"][0])


def test_ezkl_input_is_plain_json():
    payload = fixture_to_ezkl_input(FIXTURES / "eligible.json")
    assert json.loads(json.dumps(payload)) == payload


@pytest.mark.parametrize(
    ("text", "tenths"),
    [("5.7", 57), ("8.5", 85), ("5.70", 57), ("0", 0), ("20", 200), ("20.0", 200)],
)
def test_hba1c_exact_tenths(text, tenths):
    record = parse_record_text(VALID.replace("6.4", text))
    assert normalize_record(record)[1] == tenths


def test_parse_keeps_decimal_not_float():
    record = parse_record_text(VALID)
    assert isinstance(record["hba1cPercent"], Decimal)


@pytest.mark.parametrize(
    "text",
    [
        VALID.replace("6.4", "5.70001"),
        VALID.replace("6.4", "6.45"),
        VALID.replace("6.4", "20.1"),
        VALID.replace("6.4", "-0.1"),
        VALID.replace("92", "60.5"),
        VALID.replace("92", "201"),
        VALID.replace("45", "45.5"),
        VALID.replace("45", "131"),
        VALID.replace("45", "true"),
        VALID.replace("45", '"45"'),
        VALID.replace("vitapod.synthetic-lab.v1", "vitapod.synthetic-lab.v2"),
        VALID.replace(", \"egfrMlMin1_73m2\": 92", ""),
        VALID.replace("}", ', "name": "x"}'),
        "[]",
    ],
)
def test_rejects_non_integral_or_malformed(text):
    with pytest.raises(NormalizationError):
        normalize_record(parse_record_text(text))
