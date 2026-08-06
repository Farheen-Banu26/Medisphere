# Prediction Service

Spring Boot microservice that receives a `patientId`, builds the AI feature vector, calls the Flask AI inference service, stores results in MongoDB, and returns the prediction.

## Architecture

- Exposes POST `/api/predictions` which accepts JSON `{ "patientId": "P1001" }`.
- Fetches patient details from the Patient Service (`/api/patients/{id}`).
- Fetches health twin from the Health Twin Service (`/api/twins/{id}`).
- Builds the feature vector using `feature_columns.json` (must match training order).
- Calls Flask AI service at `/api/predict` with `{ "features": {...} }`.
- Persists prediction in `predictiondb.risk_predictions` collection.

## Running

Build and run with Maven:

```bash
mvn spring-boot:run
```

or package and run jar:

```bash
mvn package
java -jar target/prediction-service-1.0.0.jar
```

## Configuration

Edit `src/main/resources/application.properties` to configure service endpoints and MongoDB connection.

## Notes

- The service uses `feature_columns.json` in `src/main/resources` to guarantee feature ordering.
- Use WebClient for REST calls to Patient, Health Twin, and Flask services.
- All external service URLs are configurable via properties.
