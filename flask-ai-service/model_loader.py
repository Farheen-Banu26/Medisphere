"""
Model loading utilities for the Flask inference service.
"""
import logging
from pathlib import Path
from typing import Any, Dict, List

import joblib
import tensorflow as tf

from config import (
    FEATURE_COLUMNS_PATH,
    HEART_DISEASE_MODEL_PATH,
    DIABETES_MODEL_PATH,
    SCALER_PATH,
)


logger = logging.getLogger(__name__)

class ModelArtifacts:
    """Holds loaded model and preprocessing artifacts."""

    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self.heart_disease_model = None
        self.diabetes_model = None
        self.scaler = None
        self.feature_columns: List[str] = []

    def load(self) -> None:
        """Load models and preprocessing artifacts once at startup."""
        if not HEART_DISEASE_MODEL_PATH.exists():
            raise FileNotFoundError(f"Missing heart disease model at {HEART_DISEASE_MODEL_PATH}")
        if not DIABETES_MODEL_PATH.exists():
            raise FileNotFoundError(f"Missing diabetes model at {DIABETES_MODEL_PATH}")
        if not SCALER_PATH.exists():
            raise FileNotFoundError(f"Missing scaler artifact at {SCALER_PATH}")
        if not FEATURE_COLUMNS_PATH.exists():
            raise FileNotFoundError(f"Missing feature columns artifact at {FEATURE_COLUMNS_PATH}")

        logger.info("Loading heart disease model from %s", HEART_DISEASE_MODEL_PATH)
        logger.info("Loading diabetes model from %s", DIABETES_MODEL_PATH)
        logger.info("Loading scaler from %s", SCALER_PATH)
        logger.info("Loading feature columns from %s", FEATURE_COLUMNS_PATH)
        logger.info("Heart disease model mtime: %s", HEART_DISEASE_MODEL_PATH.stat().st_mtime)
        logger.info("Diabetes model mtime: %s", DIABETES_MODEL_PATH.stat().st_mtime)
        logger.info("Feature columns mtime: %s", FEATURE_COLUMNS_PATH.stat().st_mtime)
        logger.info("Scaler artifact mtime: %s", SCALER_PATH.stat().st_mtime)

        self.heart_disease_model = tf.keras.models.load_model(str(HEART_DISEASE_MODEL_PATH))
        self.diabetes_model = tf.keras.models.load_model(str(DIABETES_MODEL_PATH))
        self.scaler = joblib.load(SCALER_PATH)
        self.feature_columns = joblib.load(FEATURE_COLUMNS_PATH)

        logger.info("Loaded feature_columns: %s", self.feature_columns)
        logger.info("Loaded %d feature columns", len(self.feature_columns))

        if not isinstance(self.feature_columns, list):
            raise ValueError("feature_columns.pkl must contain a list of feature column names")


_artifacts: ModelArtifacts = None


def get_artifacts(models_dir: Path) -> ModelArtifacts:
    """Return loaded model artifacts, loading them once if necessary."""
    global _artifacts
    if _artifacts is None:
        _artifacts = ModelArtifacts(models_dir)
        _artifacts.load()
    return _artifacts
