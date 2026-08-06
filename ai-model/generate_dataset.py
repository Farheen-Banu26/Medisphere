"""
Generate a realistic Digital Health Twin dataset for MediSphere.
The output dataset contains medically correlated vitals, lifestyle, and metabolic data
that supports heart disease and diabetes prediction tasks.
"""

from pathlib import Path

import numpy as np
import pandas as pd


def clamp(values: np.ndarray, minimum: float, maximum: float) -> np.ndarray:
    """Clamp numeric values to a medically valid range."""
    return np.clip(values, minimum, maximum)


def generate_health_twin_records(num_records: int = 10000, seed: int = 42) -> pd.DataFrame:
    """Create a synthetic dataset with realistic health correlations."""
    rng = np.random.default_rng(seed)

    patient_ids = [f"PT{index:05d}" for index in range(1, num_records + 1)]
    ages = clamp(np.round(rng.normal(48, 17, num_records)).astype(int), 18, 90)
    genders = rng.choice(["Male", "Female"], size=num_records, p=[0.48, 0.52])

    height_base = np.where(genders == "Male", 177, 163)
    heights = clamp(np.round(rng.normal(height_base, 7)), 145, 200)

    family_history_prob = np.clip(0.20 + (ages - 40) * 0.002, 0.18, 0.45)
    family_history = rng.uniform(size=num_records) < family_history_prob
    family_history_labels = np.where(family_history, "Yes", "No")

    smoking_prob = np.clip(0.16 + (ages - 35) * 0.003, 0.12, 0.32)
    smoking_history = rng.uniform(size=num_records) < smoking_prob
    smoking_history_labels = np.where(smoking_history, "Yes", "No")

    bmi_center = 24.5 + 0.05 * (ages - 45) + 0.9 * family_history + 0.8 * smoking_history
    bmi_values = clamp(rng.normal(bmi_center, 3.5), 18.5, 44.9)

    weights = clamp(
        np.round(bmi_values * (heights / 100.0) ** 2, 1),
        40.0,
        140.0,
    )
    bmi_values = clamp(np.round(weights / (heights / 100.0) ** 2, 1), 18.5, 44.9)

    heart_rate = clamp(
        np.round(70 + 0.18 * (ages - 40) + 0.5 * (bmi_values - 24) + 3.5 * smoking_history
                 + rng.normal(0, 7, num_records)),
        55,
        120,
    )

    systolic_bp = clamp(
        np.round(106 + 0.85 * (ages - 40) + 0.95 * (bmi_values - 24) + 4.5 * smoking_history
                 + 3.0 * family_history + rng.normal(0, 10, num_records)),
        90,
        190,
    )

    diastolic_bp = clamp(
        np.round(68 + 0.45 * (ages - 40) + 0.55 * (bmi_values - 24) + 1.8 * smoking_history
                 + rng.normal(0, 8, num_records)),
        55,
        120,
    )

    oxygen = clamp(
        np.round(98.0 - 0.015 * (ages - 40) - 0.35 * smoking_history + rng.normal(0, 0.8, num_records), 1),
        88.0,
        100.0,
    )

    temperature = clamp(
        np.round(36.4 + rng.normal(0, 0.22, num_records), 1),
        36.0,
        39.5,
    )

    steps = clamp(
        np.round(
            12800
            - 90.0 * (ages - 35)
            - 170.0 * np.maximum(0, bmi_values - 25)
            - 2400.0 * smoking_history
            - 1800.0 * family_history
            + rng.normal(0, 2300, num_records)
        ),
        0,
        25000,
    ).astype(int)

    sleep_hours = clamp(
        np.round(
            7.1
            - 0.01 * (ages - 40)
            - 0.18 * smoking_history
            - 0.08 * np.maximum(0, bmi_values - 28)
            + rng.normal(0, 0.7, num_records),
            1,
        ),
        3.0,
        10.0,
    )

    cholesterol = clamp(
        np.round(
            170
            + 1.1 * (ages - 40)
            + 1.0 * np.maximum(0, bmi_values - 23)
            + 16.0 * smoking_history
            + 12.0 * family_history
            + rng.normal(0, 22, num_records)
        ),
        100,
        350,
    )

    blood_glucose = clamp(
        np.round(
            90
            + 0.65 * (ages - 35)
            + 1.15 * np.maximum(0, bmi_values - 24)
            + 18.0 * family_history
            + 8.0 * smoking_history
            + rng.normal(0, 18, num_records)
        ),
        70,
        300,
    )

    hbA1c = clamp(
        np.round(
            4.8
            + 0.025 * (blood_glucose - 90)
            + 0.04 * np.maximum(0, bmi_values - 24)
            + 0.12 * family_history
            + rng.normal(0, 0.18, num_records),
            2,
        ),
        4.0,
        12.0,
    )

    heart_disease_score = (
        0.018 * np.maximum(0, ages - 45)
        + 0.55 * smoking_history
        + 0.45 * family_history
        + 0.032 * np.maximum(0, bmi_values - 26)
        + 0.023 * np.maximum(0, systolic_bp - 130)
        + 0.015 * np.maximum(0, cholesterol - 210)
        + 0.00012 * np.maximum(0, 9000 - steps)
        + np.where(sleep_hours < 6.5, 0.18, 0.0)
    )
    heart_disease_probability = 1.0 / (1.0 + np.exp(-heart_disease_score + 1.2))
    heart_disease = rng.binomial(1, np.clip(heart_disease_probability, 0.03, 0.94))

    diabetes_score = (
        0.030 * np.maximum(0, ages - 45)
        + 0.06 * family_history
        + 0.042 * np.maximum(0, bmi_values - 26)
        + 0.028 * np.maximum(0, blood_glucose - 105)
        + 0.045 * np.maximum(0, hbA1c - 5.7)
        + 0.015 * np.maximum(0, cholesterol - 200)
        + 0.00011 * np.maximum(0, 8500 - steps)
        + 0.14 * smoking_history
        + np.where(sleep_hours < 6.0, 0.16, 0.0)
    )
    diabetes_probability = 1.0 / (1.0 + np.exp(-diabetes_score + 1.0))
    diabetes = rng.binomial(1, np.clip(diabetes_probability, 0.04, 0.96))

    dataset = pd.DataFrame(
        {
            "patientId": patient_ids,
            "age": ages,
            "gender": genders,
            "height": heights,
            "weight": weights,
            "bmi": bmi_values,
            "heartRate": heart_rate,
            "systolicBP": systolic_bp,
            "diastolicBP": diastolic_bp,
            "oxygen": oxygen,
            "temperature": temperature,
            "steps": steps,
            "sleepHours": sleep_hours,
            "cholesterol": cholesterol,
            "bloodGlucose": blood_glucose,
            "hbA1c": hbA1c,
            "smokingHistory": smoking_history_labels,
            "familyHistory": family_history_labels,
            "heartDisease": heart_disease,
            "diabetes": diabetes,
        }
    )

    return dataset


def save_dataset(dataset: pd.DataFrame, output_file: Path) -> None:
    """Write the generated dataset to a CSV file."""
    output_file.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(output_file, index=False)
    print(f"Saved synthetic dataset to {output_file}")


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    output_path = script_dir / "data" / "health_twin_dataset.csv"
    dataset = generate_health_twin_records(num_records=10000)
    save_dataset(dataset, output_path)


if __name__ == "__main__":
    main()
