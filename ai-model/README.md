# MediSphere AI Model Pipeline

This package provides a complete synthetic data generation, preprocessing, and TensorFlow training pipeline for the MediSphere Health Twin platform.

## Project Structure

- `data/health_twin_dataset.csv` - generated dataset with 10,000 realistic synthetic patients.
- `models/heart_disease_model.keras` - trained heart disease model artifact.
- `models/diabetes_model.keras` - trained diabetes model artifact.
- `models/scaler.pkl` - StandardScaler used during preprocessing.
- `models/feature_columns.pkl` - ordered list of input feature columns for model serving.
- `generate_dataset.py` - create the synthetic Health Twin dataset.
- `feature_engineering.py` - compute derived features such as pulse pressure, BMI category, and risk flags.
- `preprocess.py` - load dataset, clean missing values, encode categorical fields, normalize features, split train/test, and save artifacts.
- `train_cvd.py` - train the heart disease TensorFlow model using Keras.
- `train_diabetes.py` - train the diabetes TensorFlow model using Keras.
- `requirements.txt` - required Python packages for pipeline execution.

## Dataset Generation

The synthetic dataset is generated with clinically correlated values such as BMI, blood pressure, cholesterol, glucose, and HbA1c.
The generator creates realistic relationships:
- Older patients have higher risk factors
- High BMI associates with elevated cholesterol and glucose
- Smoking and family history increase risk
- Low activity and poor sleep degrade cardiometabolic health

To generate the dataset:

```bash
python generate_dataset.py
```

This writes `data/health_twin_dataset.csv`.

## Preprocessing

The preprocessing pipeline:
- loads the CSV
- computes derived medical features
- imputes missing values if present
- converts `gender`, `smokingHistory`, and `familyHistory` to numeric values
- standardizes input features
- splits data into training and test sets
- persists `scaler.pkl` and `feature_columns.pkl`

The feature order is preserved to match the Spring Boot AI prediction service expectations.

## Training

Train the heart disease model:

```bash
python train_cvd.py
```

Train the diabetes model:

```bash
python train_diabetes.py
```

Both training scripts use:
- TensorFlow 2.x
- Keras Sequential API
- ReLU hidden layers
- Dropout and BatchNormalization
- Binary Crossentropy loss
- Adam optimizer
- EarlyStopping and ModelCheckpoint

## Model Files

After training, the following artifacts are available in `models/`:
- `heart_disease_model.keras`
- `diabetes_model.keras`
- `scaler.pkl`
- `feature_columns.pkl`

Use `scaler.pkl` and `feature_columns.pkl` in Flask or Spring Boot model serving to ensure production feature consistency.

## Expected Outputs

After `generate_dataset.py`, the dataset file contains 10,000 rows and realistic vitals/lifestyle data.

After `train_cvd.py` and `train_diabetes.py`, the scripts will print evaluation metrics including:
- Accuracy
- Precision
- Recall
- F1 Score
- ROC AUC
- Confusion Matrix

The best model weights are saved to the `models/` directory.
