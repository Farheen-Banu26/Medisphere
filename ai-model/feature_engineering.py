"""
Feature engineering for MediSphere Digital Health Twin predictions.
Derived features are added to support data understanding and model explainability.
"""

import pandas as pd


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add clinically meaningful derived features to the Health Twin dataset."""
    df = df.copy()

    df["pulsePressure"] = df["systolicBP"] - df["diastolicBP"]
    df["meanArterialPressure"] = df["diastolicBP"] + df["pulsePressure"] / 3.0

    df["bmiCategory"] = pd.cut(
        df["bmi"],
        bins=[0, 18.5, 25.0, 30.0, 100.0],
        labels=["Underweight", "Normal", "Overweight", "Obese"],
        right=False,
    )
    df["obesityFlag"] = (df["bmi"] >= 30.0).astype(int)
    df["hypertensionFlag"] = (
        (df["systolicBP"] >= 130) | (df["diastolicBP"] >= 80)
    ).astype(int)

    df["sleepCategory"] = pd.cut(
        df["sleepHours"],
        bins=[0, 6.0, 7.5, 24.0],
        labels=["Poor", "Adequate", "Good"],
        right=False,
    )

    df["activityCategory"] = pd.cut(
        df["steps"],
        bins=[-1, 4999, 9999, 14999, 25001],
        labels=["Sedentary", "Light", "Moderate", "Active"],
        right=False,
    )

    df["glucoseCategory"] = pd.cut(
        df["bloodGlucose"],
        bins=[0, 99, 125, 1000],
        labels=["Normal", "Prediabetes", "Diabetes"],
        right=False,
    )

    df["hba1cCategory"] = pd.cut(
        df["hbA1c"],
        bins=[0.0, 5.7, 6.5, 20.0],
        labels=["Normal", "Prediabetes", "Diabetes"],
        right=False,
    )

    return df
