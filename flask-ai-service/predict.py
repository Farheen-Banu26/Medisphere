"""
Prediction utilities for the Flask inference service.
"""
import logging
from typing import Dict, Any

import numpy as np

from model_loader import get_artifacts
from utils import map_categorical_value, reorder_features

logger = logging.getLogger(__name__)


def preprocess_features(raw_features: Dict[str, Any]) -> np.ndarray:
    """Convert raw features to a normalized NumPy array for prediction."""
    artifacts = get_artifacts(None)
    raw_ordered = reorder_features(raw_features, artifacts.feature_columns)

    ordered_features = []
    for column_value, column_name in zip(raw_ordered, artifacts.feature_columns):
        if column_name in ["gender", "smokingHistory", "familyHistory"]:
            column_value = map_categorical_value(column_value, column_name)
        ordered_features.append(float(column_value))

    logger.info("Feature dictionary received by Flask: %s", raw_features)
    logger.info("Feature vector before scaling: %s", ordered_features)

    feature_vector = np.array([ordered_features], dtype=np.float32)
    scaled = artifacts.scaler.transform(feature_vector)

    logger.info("Feature vector after scaling: %s", scaled.tolist())
    return scaled


def predict(raw_features: Dict[str, Any]) -> Dict[str, Any]:
    """Run inference for both heart disease and diabetes models."""
    artifacts = get_artifacts(None)
    features = preprocess_features(raw_features)

    heart_raw = artifacts.heart_disease_model.predict(features, verbose=0).flatten()[0]
    diabetes_raw = artifacts.diabetes_model.predict(features, verbose=0).flatten()[0]

    logger.info("Raw heart model output: %s", heart_raw)
    logger.info("Raw diabetes model output: %s", diabetes_raw)

    return {
        "heartDiseaseProbability": float(heart_raw),
        "diabetesProbability": float(diabetes_raw),
    }
