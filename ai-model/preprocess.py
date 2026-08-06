"""
Preprocess the MediSphere Digital Health Twin dataset for TensorFlow model training.
Includes missing data handling, categorical encoding, normalization, splitting, and artifact persistence.
"""

import pickle
from pathlib import Path
from typing import List, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from feature_engineering import add_engineered_features

BASE_FEATURE_COLUMNS = [
    "age",
    "gender",
    "height",
    "weight",
    "bmi",
    "heartRate",
    "systolicBP",
    "diastolicBP",
    "oxygen",
    "temperature",
    "steps",
    "sleepHours",
    "cholesterol",
    "bloodGlucose",
    "hbA1c",
    "smokingHistory",
    "familyHistory",
]
TARGET_COLUMNS = ["heartDisease", "diabetes"]
CATEGORICAL_MAP = {
    "Male": 1,
    "Female": 0,
    "Yes": 1,
    "No": 0,
}


def load_dataset(dataset_path: Path) -> pd.DataFrame:
    """Load the Health Twin dataset from CSV."""
    df = pd.read_csv(dataset_path)
    if "patientId" in df.columns:
        df = df.drop(columns=["patientId"])
    return df


def clean_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Impute missing numeric and categorical values with median or mode."""
    df = df.copy()
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_columns = [col for col in df.columns if col not in numeric_columns]

    for column in numeric_columns:
        if df[column].isna().any():
            df[column] = df[column].fillna(df[column].median())

    for column in categorical_columns:
        if df[column].isna().any():
            df[column] = df[column].fillna(df[column].mode().iloc[0])

    return df


def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    """Encode binary categorical values to numeric representations."""
    df = df.copy()
    for column in ["gender", "smokingHistory", "familyHistory"]:
        if column in df.columns:
            df[column] = df[column].map(CATEGORICAL_MAP).fillna(0).astype(int)
    return df


def scale_features(
    feature_matrix: np.ndarray, scaler: StandardScaler = None
) -> Tuple[np.ndarray, StandardScaler]:
    """Scale numerical features using standard normalization."""
    if scaler is None:
        scaler = StandardScaler()
        scaled = scaler.fit_transform(feature_matrix)
    else:
        scaled = scaler.transform(feature_matrix)
    return scaled, scaler


def save_artifacts(scaler: StandardScaler, feature_columns: List[str], models_dir: Path) -> None:
    """Persist preprocessing artifacts for inference and model serving."""
    models_dir.mkdir(parents=True, exist_ok=True)

    scaler_path = models_dir / "scaler.pkl"
    feature_columns_path = models_dir / "feature_columns.pkl"

    with open(scaler_path, "wb") as scaler_file:
        pickle.dump(scaler, scaler_file)

    with open(feature_columns_path, "wb") as feature_file:
        pickle.dump(feature_columns, feature_file)

    print(f"Saved scaler to {scaler_path}")
    print(f"Saved feature column order to {feature_columns_path}")


def load_preprocessed_data(
    csv_path: Path,
    models_dir: Path,
    test_size: float = 0.20,
    random_state: int = 42,
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame, pd.DataFrame, List[str]]:
    """Load raw data, preprocess it, and split into training and test sets."""
    df = load_dataset(csv_path)
    df = add_engineered_features(df)
    df = clean_missing_values(df)
    df = encode_features(df)

    if any(column not in df.columns for column in BASE_FEATURE_COLUMNS):
        missing = [column for column in BASE_FEATURE_COLUMNS if column not in df.columns]
        raise ValueError(f"Missing required feature columns: {missing}")

    X = df[BASE_FEATURE_COLUMNS].astype(float)
    y = df[TARGET_COLUMNS].astype(int)

    stratify_labels = (
        y["heartDisease"].astype(str) + "_" + y["diabetes"].astype(str)
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify_labels,
    )

    X_train_scaled, scaler = scale_features(X_train.values)
    X_test_scaled, _ = scale_features(X_test.values, scaler=scaler)
    save_artifacts(scaler, BASE_FEATURE_COLUMNS, models_dir)

    return X_train_scaled, X_test_scaled, y_train.reset_index(drop=True), y_test.reset_index(drop=True), BASE_FEATURE_COLUMNS


if __name__ == "__main__":
    script_dir = Path(__file__).resolve().parent
    csv_path = script_dir / "data" / "health_twin_dataset.csv"
    models_dir = script_dir / "models"
    load_preprocessed_data(csv_path, models_dir)
