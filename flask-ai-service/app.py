"""
Flask application entrypoint for MediSphere AI inference.
"""
import logging
from time import perf_counter
from typing import Any

from flask import Flask, jsonify, request

from config import LOG_LEVEL, MODELS_DIR
from model_loader import get_artifacts
from predict import predict
from utils import format_prediction_result, format_timestamp
from validation import validate_json_payload, validate_features

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger("flask_ai_service")

artifacts = get_artifacts(MODELS_DIR)
logger.info("Loaded models and preprocessing artifacts")
logger.info("Feature columns: %s", artifacts.feature_columns)



@app.route("/api/predict", methods=["POST"])
def api_predict() -> tuple[dict, int]:
    """Handle prediction requests with validation, preprocessing, and inference."""
    request_start = perf_counter()
    try:
        payload = request.get_json(force=True)
        logger.info("Incoming JSON payload: %s", payload)
    except Exception as exc:
        logger.error("Invalid JSON payload: %s", exc)
        return jsonify({"status": "ERROR", "message": "Invalid JSON payload"}), 400

    valid_payload, payload_error = validate_json_payload(payload)
    if not valid_payload:
        logger.warning("Payload validation failed: %s", payload_error)
        return jsonify({"status": "ERROR", "message": payload_error}), 400

    feature_data = payload["features"]
    logger.info("Incoming feature dictionary: %s", feature_data)
    artifacts = get_artifacts(MODELS_DIR)

    valid_features, validation_errors = validate_features(feature_data, artifacts.feature_columns)
    if not valid_features:
        logger.warning("Feature validation failed: %s", validation_errors)
        return jsonify({"status": "ERROR", "message": validation_errors}), 400

    try:
        prediction_results = predict(feature_data)
    except Exception as exc:
        logger.exception("Prediction failure")
        return jsonify({"status": "ERROR", "message": "Failed to compute predictions"}), 500

    heart_result = format_prediction_result("heartDisease", prediction_results["heartDiseaseProbability"])
    diabetes_result = format_prediction_result("diabetes", prediction_results["diabetesProbability"])

    response = {
        "status": "SUCCESS",
        "predictionTime": format_timestamp(),
        **heart_result,
        **diabetes_result,
    }

    elapsed_ms = round((perf_counter() - request_start) * 1000, 2)
    logger.info("Prediction completed in %sms", elapsed_ms)

    return jsonify(response), 200


@app.errorhandler(404)
def handle_not_found(error: Any) -> tuple[dict, int]:
    logger.warning("Route not found: %s", error)
    return jsonify({"status": "ERROR", "message": "Endpoint not found"}), 404


@app.errorhandler(500)
def handle_internal_error(error: Any) -> tuple[dict, int]:
    logger.exception("Unexpected error: %s", error)
    return jsonify({"status": "ERROR", "message": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
