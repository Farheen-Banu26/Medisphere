import pandas as pd
import os

# -----------------------------
# Dataset Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEART_DATASET = os.path.join(BASE_DIR, "dataset", "heart_disease.csv")
DIABETES_DATASET = os.path.join(BASE_DIR, "dataset", "diabetes.csv")


def inspect_dataset(name, path):
    print("=" * 70)
    print(f"{name} Dataset")
    print("=" * 70)

    # Load dataset
    df = pd.read_csv(path)

    print("\nFirst 5 Records:")
    print(df.head())

    print("\nDataset Shape:")
    print(df.shape)

    print("\nColumn Names:")
    print(df.columns.tolist())

    print("\nData Types:")
    print(df.dtypes)

    print("\nMissing Values:")
    print(df.isnull().sum())

    print("\nDuplicate Rows:")
    print(df.duplicated().sum())

    print("\nBasic Statistics:")
    print(df.describe(include="all"))

    print("\n")


if __name__ == "__main__":
    inspect_dataset("Heart Disease", HEART_DATASET)
    inspect_dataset("Diabetes", DIABETES_DATASET)