# Flask AI Inference Service

This Flask service provides pure AI inference for MediSphere.
It does not connect to MongoDB or Spring Boot services and only accepts feature vectors from the Spring Boot AI Prediction Service.

## Project Structure

- `app.py` - Flask application entrypoint.
- `predict.py` - feature preprocessing and inference logic.
- `model_loader.py` - load TensorFlow models and preprocessing artifacts once.
- `validation.py` - request JSON and feature validation.
- `utils.py` - helper utilities for response formatting and feature ordering.
- `config.py` - configuration values, artifact paths, and feature schema.
- `requirements.txt` - Python package dependencies.
- `models/` - contains saved model and preprocessing artifacts.
- `logs/` - local log output directory.

## AI Artifacts

Place the following files in `models/`:
- `heart_disease_model.keras`
- `diabetes_model.keras`
- `scaler.pkl`
- `feature_columns.pkl`

These artifacts are loaded once on Flask application startup.

## How It Works

1. Spring Boot sends a JSON payload containing only the feature vector.
2. Flask validates required features, types, and values.
3. Flask encodes and normalizes the feature vector using `scaler.pkl`.
4. Flask runs both TensorFlow models and returns risk predictions.

## API Endpoint

### POST /api/predict

Request body example:

```json
{
  "features": {
    "age": 45,
    "gender": "Male",
    "height": 170,
    "weight": 70,
    "bmi": 24.2,
    "heartRate": 78,
    "systolicBP": 120,
    "diastolicBP": 80,
    "oxygen": 98,
    "temperature": 36.8,
    "steps": 6500,
    "sleepHours": 7.5,
    "cholesterol": 190,
    "bloodGlucose": 95,
    "hbA1c": 5.4,
    "smokingHistory": "No",
    "familyHistory": "Yes"
  }
}
```

Example successful response:

```json
{
  "status": "SUCCESS",
  "predictionTime": "2026-07-19T12:45:10",
  "heartDisease": {
    "prediction": "High Risk",
    "probability": 0.87,
    "confidence": 87.0
  },
  "diabetes": {
    "prediction": "Low Risk",
    "probability": 0.18,
    "confidence": 82.0
  }
}
```

## Run Locally

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask service:

```bash
python app.py
```

The service listens on `http://0.0.0.0:5000`.

## Error Handling

The service returns JSON errors for:
- invalid JSON
- missing `features`
- missing or unknown feature fields
- wrong data types
- missing model or scaler artifacts
- inference failures

## Notes

- The feature order is always loaded from `feature_columns.pkl`.
- Models are loaded only once during startup.
- Flask never connects to MongoDB or Spring Boot services.
- This service is a pure inference endpoint.
