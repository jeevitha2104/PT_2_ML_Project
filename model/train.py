import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# -------------------------------
# LOAD DATA
# -------------------------------
df = pd.read_csv("data/glass.data", header=None)

df.columns = [
    "Id", "RI", "Na", "Mg", "Al", "Si", "K", "Ca", "Ba", "Fe", "Type"
]

# Drop ID column
df = df.drop("Id", axis=1)

# -------------------------------
# SPLIT FEATURES & LABEL
# -------------------------------
X = df.drop("Type", axis=1)
y = df["Type"]

# -------------------------------
# SCALE DATA (IMPORTANT)
# -------------------------------
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# -------------------------------
# TRAIN TEST SPLIT
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# -------------------------------
# DEFINE MODELS
# -------------------------------
models = {
    "Random Forest": RandomForestClassifier(n_estimators=200, max_depth=10),
    "KNN": KNeighborsClassifier(n_neighbors=5),
    "SVM": SVC(probability=True)
}

results = {}
trained_models = {}

# -------------------------------
# TRAIN & EVALUATE
# -------------------------------
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    results[name] = acc
    trained_models[name] = model

    print(f"{name} Accuracy: {acc:.2f}")

# -------------------------------
# SELECT BEST MODEL
# -------------------------------
best_model_name = max(results, key=results.get)
best_model = trained_models[best_model_name]

print(f"\nBest Model Selected: {best_model_name}")

# -------------------------------
# SAVE MODEL + SCALER
# -------------------------------
os.makedirs("model", exist_ok=True)

joblib.dump(best_model, "model/glass_model.pkl")
joblib.dump(scaler, "model/scaler.pkl")

print("Model and Scaler saved successfully!")