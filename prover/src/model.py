"""The proven computation: the demo policy as a tiny ONNX graph.

This is not a trained model. It is the same four comparisons as
`evaluateDemoPolicy` in packages/shared, written over int64 so EZKL at scale 0
compares exactly the integers produced by normalization.py.

    input int64[1,3] = [age, hba1c_tenths, egfr]        (private witness)
      age          >= 18  --+
      hba1c_tenths >= 57  --+-- And -- And -- And --> Cast(int64) --> output [1,1] in {0,1}
      hba1c_tenths <  85  --+                                          (public instance)
      egfr         >= 60  --+

Graph variant shipped: `comparisons-and`. The pinned EZKL accepts ONNX `And`; a
`Cast` + `Mul` product of the four comparisons was tested as a fallback and not needed.
"""

from __future__ import annotations

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper

GRAPH_VARIANT = "comparisons-and"
OPSET_VERSION = 17
IR_VERSION = 8

# Circuit-unit thresholds; keep in sync with POLICY_THRESHOLDS in packages/shared/src/policy.ts.
MIN_AGE_YEARS = 18
MIN_HBA1C_TENTHS = 57
MAX_HBA1C_TENTHS_EXCLUSIVE = 85
MIN_EGFR = 60


def _int64_constant(name: str, value: int) -> onnx.NodeProto:
    tensor = numpy_helper.from_array(np.array([[value]], dtype=np.int64), name=f"{name}_value")
    return helper.make_node("Constant", [], [name], value=tensor)


def build_policy_graph() -> onnx.ModelProto:
    nodes = [
        helper.make_node("Split", ["input"], ["age", "hba1c_tenths", "egfr"], axis=1),
        _int64_constant("min_age", MIN_AGE_YEARS),
        _int64_constant("min_hba1c", MIN_HBA1C_TENTHS),
        _int64_constant("max_hba1c_exclusive", MAX_HBA1C_TENTHS_EXCLUSIVE),
        _int64_constant("min_egfr", MIN_EGFR),
        helper.make_node("GreaterOrEqual", ["age", "min_age"], ["age_ok"]),
        helper.make_node("GreaterOrEqual", ["hba1c_tenths", "min_hba1c"], ["hba1c_low_ok"]),
        helper.make_node("Less", ["hba1c_tenths", "max_hba1c_exclusive"], ["hba1c_high_ok"]),
        helper.make_node("GreaterOrEqual", ["egfr", "min_egfr"], ["egfr_ok"]),
        helper.make_node("And", ["age_ok", "hba1c_low_ok"], ["and_1"]),
        helper.make_node("And", ["and_1", "hba1c_high_ok"], ["and_2"]),
        helper.make_node("And", ["and_2", "egfr_ok"], ["eligible"]),
        helper.make_node("Cast", ["eligible"], ["output"], to=TensorProto.INT64),
    ]
    graph = helper.make_graph(
        nodes,
        "vitapod_demo_metabolic_v1",
        [helper.make_tensor_value_info("input", TensorProto.INT64, [1, 3])],
        [helper.make_tensor_value_info("output", TensorProto.INT64, [1, 1])],
    )
    model = helper.make_model(
        graph,
        producer_name="vitapod",
        opset_imports=[helper.make_opsetid("", OPSET_VERSION)],
    )
    model.ir_version = IR_VERSION
    onnx.checker.check_model(model)
    return model


def policy_graph_bytes() -> bytes:
    return build_policy_graph().SerializeToString()
