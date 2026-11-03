# TraffIQ 🚦
> Intelligent traffic prediction, smart route recommendation, and interactive OpenStreetMap navigation.

TraffIQ is a full-stack traffic intelligence system featuring machine learning predictions, route recommendations, community traffic hazard reporting, and an interactive **Leaflet + OpenStreetMap** mapping engine.

---

## 🌟 Features

### 🗺️ Interactive Traffic Map (Leaflet + OpenStreetMap)
- **Beginner-Friendly & Free**: Built with [Leaflet.js](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/) — zero Google Maps API keys or billing required.
- **Road Locations**: Visual representation of monitored city corridors and expressways (Main Road, Outer Ring Road, Tech Corridor, Airport Expressway, etc.).
- **Map Markers**: Custom markers for:
  - 📍 Trip Starting Points & 🏁 Destinations
  - 🔵 Real-time User GPS Location (with pulsing radar wave)
  - ⚠️ Traffic Congestion Warnings (Low, Moderate, High)
  - 🚧 Road Work & Construction Hazards
  - 🚑 Emergency Vehicles (with pulsing siren beacons)
  - 📢 Community User Traffic Reports
- **Interactive Routes**:
  - Color-coded routes (🟢 Low Traffic, 🟡 Moderate, 🔴 High)
  - Dynamic "View on Map" links from Smart Route recommendation cards
  - Real-time route calculation between custom points or map clicks
- **Interactive Map Controls**:
  - Click anywhere on the map to pick coordinates and set Start or Destination
  - Layer filter toolbar (Routes, Alerts, Emergency, Road Markers)
  - Fit Routes & Center On Me buttons
  - Selected route banner with ETA, distance, and speed details

### 🤖 AI Traffic Prediction
- Integrated Scikit-learn machine learning model predicts road traffic congestion based on hour of day, day of week, vehicle volume, average speed, rain, and incident history.

### 🛣️ Smart Route Recommendation
- Evaluates routes loaded from MySQL database with distance, estimated travel time, and live traffic status.

### 📢 Community Traffic Reporting & Admin Dashboard
- Users can report road incidents, blockages, and traffic slowdowns.
- Admin dashboard allows searching, status filtering (Pending, Reviewed, Resolved), and managing traffic reports.

---

## 📁 Project Structure

```text
minor-duplicate/
├── frontend/
│   ├── index.html       # TraffIQ web application layout & Leaflet integration
│   ├── script.js        # Leaflet map engine, route handlers, and API client
│   └── style.css        # Responsive styling, custom pins, and map UI
├── backend/
│   ├── package.json     # Node.js backend dependencies
│   └── server.js        # Express REST API & MySQL connector
├── ml/
│   ├── predict_api.py   # Flask API serving Scikit-learn traffic model
│   └── traffiq_traffic_model.pkl # Trained traffic prediction model
└── README.md
```

---

## 🚀 Getting Started

### 1. Frontend (Leaflet Map & UI)
Open `frontend/index.html` directly in your browser or run with Live Server (port `5500`):
- Right click `frontend/index.html` in VS Code → **Open with Live Server**.
- The interactive Leaflet map will load immediately with monitored roads, routes, and traffic alerts.

### 2. Backend (Node.js & MySQL)
```bash
cd backend
npm install
node server.js
```
The backend server runs on `http://localhost:5000`.

### 3. ML Prediction API (Python & Flask)
```bash
cd ml
pip install flask joblib pandas scikit-learn
python predict_api.py
```
The ML API runs on `http://127.0.0.1:5001`.

---

## 📄 License
ISC License © TraffIQ 2026
