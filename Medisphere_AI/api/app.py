import os
import joblib
import numpy as np
import tensorflow as tf

from flask import Flask, jsonify, request
from flask_cors import CORS

# --------------------------------------------------
# Flask
# --------------------------------------------------

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR = os.path.join(BASE_DIR, "models")

# --------------------------------------------------
# Load Models
# --------------------------------------------------

cvd_model = tf.keras.models.load_model(
    os.path.join(MODEL_DIR, "cvd_model.keras")
)

diabetes_model = tf.keras.models.load_model(
    os.path.join(MODEL_DIR, "diabetes_model.keras")
)

heart_scaler = joblib.load(
    os.path.join(MODEL_DIR, "heart_scaler.pkl")
)

diabetes_scaler = joblib.load(
    os.path.join(MODEL_DIR, "diabetes_scaler.pkl")
)

heart_features = joblib.load(
    os.path.join(MODEL_DIR, "heart_features.pkl")
)

diabetes_features = joblib.load(
    os.path.join(MODEL_DIR, "diabetes_features.pkl")
)

encoders = joblib.load(
    os.path.join(MODEL_DIR, "encoders.pkl")
)

# --------------------------------------------------
# Home
# --------------------------------------------------

@app.route("/")
def home():
    return jsonify({
        "service": "MediSphere AI Prediction API",
        "status": "Running"
    })

# --------------------------------------------------
# Heart Disease Prediction
# --------------------------------------------------

@app.route("/predict/cvd", methods=["POST"])
def predict_cvd():

    data = request.json

    values = []

    for feature in heart_features:
        values.append(data[feature])

    values = np.array(values).reshape(1, -1)

    values = heart_scaler.transform(values)

    probability = float(cvd_model.predict(values)[0][0])

    prediction = 1 if probability >= 0.5 else 0

    return jsonify({
        "prediction": prediction,
        "probability": round(probability, 4)
    })

# --------------------------------------------------
# Diabetes Prediction
# --------------------------------------------------

@app.route("/predict/diabetes", methods=["POST"])
def predict_diabetes():

    data = request.json.copy()

    data["gender"] = encoders["gender"].transform(
        [data["gender"]]
    )[0]

    data["smoking_history"] = encoders["smoking_history"].transform(
        [data["smoking_history"]]
    )[0]

    values = []

    for feature in diabetes_features:
        values.append(data[feature])

    values = np.array(values).reshape(1, -1)

    values = diabetes_scaler.transform(values)

    probability = float(diabetes_model.predict(values)[0][0])

    prediction = 1 if probability >= 0.5 else 0

    return jsonify({
        "prediction": prediction,
        "probability": round(probability, 4)
    })

# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )