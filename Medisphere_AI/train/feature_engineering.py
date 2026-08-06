import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PROCESSED_DIR = os.path.join(BASE_DIR, "dataset", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")

HEART_FILE = os.path.join(PROCESSED_DIR, "heart_processed.csv")
DIABETES_FILE = os.path.join(PROCESSED_DIR, "diabetes_processed.csv")

print("\n========== FEATURE ENGINEERING ==========\n")

# -----------------------------
# Heart Disease
# -----------------------------

heart_df = pd.read_csv(HEART_FILE)

X_heart = heart_df.drop("target", axis=1)
y_heart = heart_df["target"]

joblib.dump(X_heart.columns.tolist(),
            os.path.join(MODELS_DIR, "heart_features.pkl"))

print("Heart Disease Features")
print(X_heart.columns.tolist())

# -----------------------------
# Diabetes
# -----------------------------

diabetes_df = pd.read_csv(DIABETES_FILE)

X_diabetes = diabetes_df.drop("diabetes", axis=1)
y_diabetes = diabetes_df["diabetes"]

joblib.dump(X_diabetes.columns.tolist(),
            os.path.join(MODELS_DIR, "diabetes_features.pkl"))

print("\nDiabetes Features")
print(X_diabetes.columns.tolist())

print("\nFeature Engineering Completed Successfully!")