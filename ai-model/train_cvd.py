"""
Train a TensorFlow model for heart disease prediction using the MediSphere Health Twin dataset.
"""

from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

import preprocess


def build_heart_disease_model(input_shape: int) -> tf.keras.Model:
    """Construct a Keras Sequential model for binary heart disease classification."""
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(input_shape,)),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.35),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.30),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.25),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ]
    )

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=["accuracy"],
    )
    return model


def evaluate_model(model: tf.keras.Model, X_test: np.ndarray, y_test: np.ndarray) -> None:
    """Compute and print evaluation metrics for the heart disease model."""
    predictions = model.predict(X_test, verbose=0).flatten()
    probability_threshold = 0.5
    predicted_labels = (predictions >= probability_threshold).astype(int)

    accuracy = accuracy_score(y_test, predicted_labels)
    precision = precision_score(y_test, predicted_labels, zero_division=0)
    recall = recall_score(y_test, predicted_labels, zero_division=0)
    f1 = f1_score(y_test, predicted_labels, zero_division=0)
    roc_auc = roc_auc_score(y_test, predictions)
    cm = confusion_matrix(y_test, predicted_labels)

    print("\nHeart Disease Model Evaluation")
    print("----------------------------")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print(f"ROC AUC: {roc_auc:.4f}")
    print("Confusion Matrix:")
    print(cm)


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    csv_path = script_dir / "data" / "health_twin_dataset.csv"
    models_dir = script_dir / "models"
    X_train, X_test, y_train_df, y_test_df, feature_columns = preprocess.load_preprocessed_data(
        csv_path, models_dir
    )
    y_train = y_train_df["heartDisease"].values
    y_test = y_test_df["heartDisease"].values

    model = build_heart_disease_model(X_train.shape[1])

    checkpoint_path = models_dir / "heart_disease_model.keras"
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=12,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(checkpoint_path),
            monitor="val_loss",
            save_best_only=True,
            save_weights_only=False,
            verbose=1,
        ),
    ]

    model.fit(
        X_train,
        y_train,
        validation_split=0.20,
        epochs=80,
        batch_size=64,
        callbacks=callbacks,
        verbose=2,
    )

    best_model = tf.keras.models.load_model(str(checkpoint_path))
    evaluate_model(best_model, X_test, y_test)


if __name__ == "__main__":
    main()
