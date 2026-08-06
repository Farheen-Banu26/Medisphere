"""
Validation utilities for Flask inference input payloads.
"""
from typing import Any, Dict, List, Tuple

from config import ALLOWED_FEATURE_TYPES


def validate_json_payload(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate the expected request JSON structure."""
    if not isinstance(payload, dict):
        return False, "Invalid JSON payload"

    if "features" not in payload:
        return False, "Missing required field: features"

    if not isinstance(payload["features"], dict):
        return False, "Field 'features' must be an object"

    return True, ""


def validate_features(feature_data: Dict[str, Any], feature_columns: List[str]) -> Tuple[bool, List[str]]:
    """Validate the feature keys and types against the required feature schema."""
    errors: List[str] = []

    missing = [col for col in feature_columns if col not in feature_data]
    if missing:
        errors.append(f"Missing feature(s): {', '.join(missing)}")

    extra = [col for col in feature_data if col not in feature_columns]
    if extra:
        errors.append(f"Unknown feature(s): {', '.join(extra)}")

    for key, value in feature_data.items():
        if value is None:
            errors.append(f"Feature '{key}' may not be null")
            continue

        expected_type = ALLOWED_FEATURE_TYPES.get(key)
        if expected_type is None:
            continue

        if expected_type is int and not isinstance(value, int):
            if isinstance(value, float) and value.is_integer():
                continue
            errors.append(f"Feature '{key}' must be an integer")
        elif expected_type is float and not isinstance(value, (float, int)):
            errors.append(f"Feature '{key}' must be a number")
        elif expected_type is str and not isinstance(value, str):
            errors.append(f"Feature '{key}' must be a string")

    if "gender" in feature_data and isinstance(feature_data.get("gender"), str):
        if feature_data["gender"] not in ["Male", "Female"]:
            errors.append("Feature 'gender' must be 'Male' or 'Female'")

    for key in ["smokingHistory", "familyHistory"]:
        if key in feature_data and isinstance(feature_data.get(key), str):
            if feature_data[key] not in ["Yes", "No"]:
                errors.append(f"Feature '{key}' must be 'Yes' or 'No'")

    return len(errors) == 0, errors
