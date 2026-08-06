import os
import pandas as pd
import tensorflow as tf

from sklearn.model_selection import train_test_split

# ---------------------------------------------------
# Paths
# ---------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_FILE = os.path.join(
    BASE_DIR,
    "dataset",
    "processed",
    "diabetes_processed.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "diabetes_model.keras"
)

# ---------------------------------------------------
# Load Dataset
# ---------------------------------------------------

df = pd.read_csv(DATA_FILE)

X = df.drop("diabetes", axis=1)
y = df["diabetes"]

# ---------------------------------------------------
# Train Test Split
# ---------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ---------------------------------------------------
# Build Neural Network
# ---------------------------------------------------

model = tf.keras.Sequential([
    tf.keras.Input(shape=(X_train.shape[1],)),
    tf.keras.layers.Dense(32, activation="relu"),
    tf.keras.layers.Dense(16, activation="relu"),
    tf.keras.layers.Dense(1, activation="sigmoid")
])

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# ---------------------------------------------------
# Train
# ---------------------------------------------------

model.fit(
    X_train,
    y_train,
    validation_split=0.2,
    epochs=20,
    batch_size=32,
    verbose=1
)

# ---------------------------------------------------
# Evaluate
# ---------------------------------------------------

loss, accuracy = model.evaluate(
    X_test,
    y_test,
    verbose=0
)

print("\n==============================")
print(f"Test Accuracy : {accuracy:.4f}")
print("==============================")

# ---------------------------------------------------
# Save Model
# ---------------------------------------------------

model.save(MODEL_PATH)

print("\nDiabetes Model Saved Successfully!")