"""
Utility functions for Flask inference service.
"""
from datetime import datetime
from typing import Any, Dict, List

import numpy as np

from config import CATEGORICAL_MAP, PREDICTION_LABELS


def format_timestamp() -> str:
    """Return an ISO 8601 timestamp for response metadata."""
    return datetime.utcnow().replace(microsecond=0).isoformat()


def map_categorical_value(value: str, field_name: str) -> int:
    """Convert a categorical input to its numeric representation."""
    if value not in CATEGORICAL_MAP:
        raise ValueError(f"Unsupported categorical value for {field_name}: {value}")
    return CATEGORICAL_MAP[value]


def format_prediction_result(name: str, probability: float) -> Dict[str, Any]:
    """Format prediction response for a given model output."""
    prediction = int(probability >= 0.5)
    confidence = float(np.round(probability * 100.0, 2))

    return {
        name: {
            "prediction": PREDICTION_LABELS[name][prediction],
            "probability": float(np.round(probability, 4)),
            "confidence": confidence,
        }
    }


def reorder_features(feature_data: Dict[str, Any], feature_columns: List[str]) -> List[float]:
    """Reorder feature values to match the saved feature column order."""
    return [feature_data[column] for column in feature_columns]
