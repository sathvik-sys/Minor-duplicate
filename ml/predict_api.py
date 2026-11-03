
from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

model = joblib.load("traffiq_traffic_model.pkl")

FEATURE_COLUMNS = [
    "hour",
    "day_of_week",
    "vehicles_per_hour",
    "average_speed",
    "rain",
    "incidents"
]

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "TraffIQ ML Prediction API is running!"
    })

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Please send JSON data."}), 400

    missing = [
        column for column in FEATURE_COLUMNS
        if column not in data
    ]

    if missing:
        return jsonify({
            "error": "Missing fields",
            "fields": missing
        }), 400

    try:
        row = {
            column: float(data[column])
            for column in FEATURE_COLUMNS
        }
    except (TypeError, ValueError):
        return jsonify({
            "error": "All fields must contain numeric values."
        }), 400

    if not 0 <= row["hour"] <= 23:
        return jsonify({"error": "hour must be 0 to 23"}), 400

    if not 0 <= row["day_of_week"] <= 6:
        return jsonify({
            "error": "day_of_week must be 0 to 6"
        }), 400

    if row["rain"] not in (0, 1):
        return jsonify({"error": "rain must be 0 or 1"}), 400

    if any(
        row[field] < 0
        for field in [
            "vehicles_per_hour",
            "average_speed",
            "incidents"
        ]
    ):
        return jsonify({
            "error": "Traffic values cannot be negative."
        }), 400

    frame = pd.DataFrame(
        [row],
        columns=FEATURE_COLUMNS
    )

    prediction = model.predict(frame)[0]

    return jsonify({
        "predicted_traffic_level": str(prediction)
    })

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )
