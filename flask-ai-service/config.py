"""
Application configuration for the Flask AI prediction service.
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

HEART_DISEASE_MODEL_PATH = MODELS_DIR / "heart_disease_model.keras"
DIABETES_MODEL_PATH = MODELS_DIR / "diabetes_model.keras"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
FEATURE_COLUMNS_PATH = MODELS_DIR / "feature_columns.pkl"

LOG_LEVEL = "INFO"

ALLOWED_FEATURE_TYPES = {
    "age": int,
    "gender": str,
    "height": float,
    "weight": float,
    "bmi": float,
    "heartRate": float,
    "systolicBP": float,
    "diastolicBP": float,
    "oxygen": float,
    "temperature": float,
    "steps": int,
    "sleepHours": float,
    "cholesterol": float,
    "bloodGlucose": float,
    "hbA1c": float,
    "smokingHistory": str,
    "familyHistory": str,
}

CATEGORICAL_MAP = {
    "Male": 1,
    "Female": 0,
    "Yes": 1,
    "No": 0,
}

PREDICTION_LABELS = {
    "heartDisease": {0: "Low Risk", 1: "High Risk"},
    "diabetes": {0: "Low Risk", 1: "High Risk"},
}

DEFAULT_PROBABILITY_THRESHOLD = 0.5
