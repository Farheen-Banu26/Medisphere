import os
import joblib
import pandas as pd

from sklearn.preprocessing import LabelEncoder, StandardScaler

# ---------------------------------------------------
# Paths
# ---------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_DIR = os.path.join(BASE_DIR, "dataset")
PROCESSED_DIR = os.path.join(DATASET_DIR, "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

HEART_FILE = os.path.join(DATASET_DIR, "heart_disease.csv")
DIABETES_FILE = os.path.join(DATASET_DIR, "diabetes.csv")


# ---------------------------------------------------
# HEART DISEASE PREPROCESSING
# ---------------------------------------------------

print("\n========== HEART DISEASE ==========\n")

heart_df = pd.read_csv(HEART_FILE)

print("Original Shape :", heart_df.shape)

heart_df = heart_df.drop_duplicates()

print("After Removing Duplicates :", heart_df.shape)

X_heart = heart_df.drop("target", axis=1)
y_heart = heart_df["target"]

heart_scaler = StandardScaler()
X_heart_scaled = heart_scaler.fit_transform(X_heart)

heart_processed = pd.DataFrame(
    X_heart_scaled,
    columns=X_heart.columns
)

heart_processed["target"] = y_heart.values

heart_processed.to_csv(
    os.path.join(PROCESSED_DIR, "heart_processed.csv"),
    index=False
)

joblib.dump(
    heart_scaler,
    os.path.join(MODELS_DIR, "heart_scaler.pkl")
)

print("Heart dataset processed successfully!")


# ---------------------------------------------------
# DIABETES PREPROCESSING
# ---------------------------------------------------

print("\n========== DIABETES ==========\n")

diabetes_df = pd.read_csv(DIABETES_FILE)

print("Original Shape :", diabetes_df.shape)

diabetes_df = diabetes_df.drop_duplicates()

print("After Removing Duplicates :", diabetes_df.shape)

encoders = {}

categorical_columns = [
    "gender",
    "smoking_history"
]

for column in categorical_columns:
    encoder = LabelEncoder()
    diabetes_df[column] = encoder.fit_transform(diabetes_df[column])
    encoders[column] = encoder

X_diabetes = diabetes_df.drop("diabetes", axis=1)
y_diabetes = diabetes_df["diabetes"]

diabetes_scaler = StandardScaler()

X_diabetes_scaled = diabetes_scaler.fit_transform(X_diabetes)

diabetes_processed = pd.DataFrame(
    X_diabetes_scaled,
    columns=X_diabetes.columns
)

diabetes_processed["diabetes"] = y_diabetes.values

diabetes_processed.to_csv(
    os.path.join(PROCESSED_DIR, "diabetes_processed.csv"),
    index=False
)

joblib.dump(
    diabetes_scaler,
    os.path.join(MODELS_DIR, "diabetes_scaler.pkl")
)

joblib.dump(
    encoders,
    os.path.join(MODELS_DIR, "encoders.pkl")
)

print("Diabetes dataset processed successfully!")

print("\n======================================")
print("All preprocessing completed successfully!")
print("======================================")