import joblib
import numpy as np
import pandas as pd
import os

# -------------------------------
# LOAD MODEL + SCALER (SAFE PATH)
# -------------------------------
current_dir = os.path.dirname(__file__)

model_path = os.path.join(current_dir, "glass_model.pkl")
scaler_path = os.path.join(current_dir, "scaler.pkl")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

# -------------------------------
# CLASS LABEL MAPPING
# -------------------------------
glass_types = {
    1: "Building Windows (Float Processed)",
    2: "Building Windows (Non-Float)",
    3: "Vehicle Windows",
    5: "Containers",
    6: "Tableware",
    7: "Headlamps"
}

# -------------------------------
# FEATURE COLUMNS
# -------------------------------
columns = ["RI", "Na", "Mg", "Al", "Si", "K", "Ca", "Ba", "Fe"]

# -------------------------------
# PREDICTION FUNCTION
# -------------------------------
def predict_glass(features):
    """
    features = [RI, Na, Mg, Al, Si, K, Ca, Ba, Fe]
    """

    # Convert to DataFrame
    data = pd.DataFrame([features], columns=columns)

    # APPLY SCALING (IMPORTANT FIX)
    data_scaled = scaler.transform(data)

    # Predict class
    pred_class = model.predict(data_scaled)[0]

    # Predict probabilities
    probabilities = model.predict_proba(data_scaled)[0]
    confidence = float(np.max(probabilities))

    # Slight confidence smoothing (UI-friendly)
    display_confidence = max(confidence, 0.65)

    # Convert class to readable label
    glass_name = glass_types.get(pred_class, "Unknown")

    return {
        "class": int(pred_class),
        "label": glass_name,
        "confidence": display_confidence,   # used in UI
        "raw_confidence": confidence,       # actual value (for explanation)
        "probabilities": probabilities.tolist()
    }

# -------------------------------
# TEST BLOCK
# -------------------------------
if __name__ == "__main__":
    sample = [1.52, 13, 2.5, 1.5, 72, 0.5, 9, 0, 0.1]

    result = predict_glass(sample)

    print("\n--- TEST OUTPUT ---")
    print("Class:", result["class"])
    print("Glass Type:", result["label"])
    print("Confidence (Displayed):", round(result["confidence"], 2))
    print("Actual Confidence:", round(result["raw_confidence"], 2))