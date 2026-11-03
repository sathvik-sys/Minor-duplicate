function findRoute() {
    const start = document.getElementById("startLocation").value.trim();
    const destination = document.getElementById("destination").value.trim();

    if (!start || !destination) {
        alert("Please enter both starting location and destination.");
        return;
    }

    document.getElementById("currentRoad").textContent = destination;
    document.getElementById("predictedTraffic").textContent = "🟡 Moderate";
    document.getElementById("estimatedSpeed").textContent = "22 km/h";

    // Plot on interactive Leaflet + OpenStreetMap
    if (typeof plotSearchedRouteOnMap === "function") {
        plotSearchedRouteOnMap(start, destination);
    }
}


function login() {

    alert("Login page will be added soon.");

}


async function submitReport() {
    const road = document.getElementById("reportRoad").value.trim();
    const condition = document.getElementById("reportCondition").value;
    const description = document.getElementById("reportDescription").value.trim();

    // Check required fields
    if (!road || !condition) {
        alert("Please select a road and traffic condition.");
        return;
    }

    // Validate description length
    if (description.length > 250) {
        alert("Description must not exceed 250 characters.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/reports", {
    method: "POST",
    credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                road_name: road,
                traffic_condition: condition,
                description: description
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to submit report.");
        }

        alert("Traffic report submitted successfully!");

        document.getElementById("reportDescription").value = "";

        // Add visual marker to Leaflet map immediately
        if (typeof addCommunityReportMarker === "function") {
            addCommunityReportMarker(road, condition, description);
        }

        await loadCommunityReports();

        console.log("Saved report:", result);

    } catch (error) {
        console.error("Report submission error:", error);
        // Add visual pin even in demo/offline mode
        if (typeof addCommunityReportMarker === "function") {
            addCommunityReportMarker(road, condition, description);
        }
        alert("Traffic report recorded locally on the map! Note: MySQL backend is currently unreachable.");
    }
}


function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            document.getElementById("startLocation").value =
                latitude.toFixed(4) + ", " + longitude.toFixed(4);

            if (typeof locateUserOnMap === "function") {
                locateUserOnMap(latitude, longitude);
            }
        },
        function(err) {
            console.warn("Geolocation warning:", err);
            alert("Unable to detect location. Please allow location access in your browser or click on the map to set a location.");
        }
    );
}
async function loginUser() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    if (!email || !password) {
        message.textContent = "Please enter email and password.";
        message.style.color = "red";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/login", {
    method: "POST",
    credentials: "include",
    headers: {
        "Content-Type": "application/json"
    },
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        message.textContent =
            "Welcome, " + result.user.full_name +
            "! Login successful. Role: " + result.user.role;

        message.style.color = "green";
        // Show dashboard according to the database role
const userDashboard = document.getElementById("user-dashboard");
const adminDashboard = document.getElementById("admin-dashboard");
const dashboardWelcome = document.getElementById("dashboardWelcome");

if (result.user.role === "admin") {
    userDashboard.style.display = "none";
    adminDashboard.style.display = "block";
} else {
    userDashboard.style.display = "block";
    adminDashboard.style.display = "none";
}
if (result.user.role === "admin") {
    loadAdminStats();
    loadAdminReports();
    loadReportSummary();
} else {
    loadMyReports();
}
dashboardWelcome.textContent =
    "Welcome, " + result.user.full_name + "!";


        console.log("Logged-in user:", result.user);

        document.getElementById("loginPassword").value = "";

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";

        console.error("Login error:", error);
    }
}
async function loadTrafficPredictions() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/predictions"
        );

        if (!response.ok) {
            throw new Error("Failed to fetch predictions");
        }

        const predictions = await response.json();

        console.log("Traffic predictions from MySQL:", predictions);

        if (predictions.length === 0) {
            console.log("No traffic predictions found.");
            return;
        }

        const latest = predictions[0];

        const roadElement = document.getElementById("currentRoad");
        const trafficElement = document.getElementById("predictedTraffic");
        if (!trafficElement) {
    console.error("Predicted traffic element not found.");
    return;
}
        const speedElement = document.getElementById("estimatedSpeed");

        if (roadElement) {
            roadElement.textContent = latest.road_name;
        }

        if (trafficElement) {
            trafficElement.textContent = latest.predicted_condition;
        }

        if (speedElement) {
            speedElement.textContent =
                latest.predicted_speed + " km/h";
        }

    } catch (error) {
        console.error("Traffic prediction error:", error);
    }
}

// ==========================================================================
// TraffIQ Leaflet + OpenStreetMap Interactive Map Engine
// ==========================================================================

let map = null;
let routesLayerGroup = null;
let alertsLayerGroup = null;
let emergencyLayerGroup = null;
let roadsLayerGroup = null;
let userLayerGroup = null;
let searchRouteLayerGroup = null;
let activeSearchMarkers = [];
let routePolylineList = [];
let cachedRoutes = [];
let cachedAlerts = [];
let cachedEmergencyAlerts = [];

// Curated geographic road network (OpenStreetMap coordinates)
const ROAD_COORDINATES = {
    "Main Road": [
        [17.3850, 78.4867],
        [17.3920, 78.4780],
        [17.3990, 78.4720],
        [17.4050, 78.4680]
    ],
    "Outer Ring Road": [
        [17.4350, 78.3600],
        [17.4480, 78.3850],
        [17.4560, 78.4200],
        [17.4500, 78.4700],
        [17.4300, 78.5150]
    ],
    "Tech Corridor": [
        [17.4420, 78.3800],
        [17.4485, 78.3740],
        [17.4530, 78.3680],
        [17.4580, 78.3650]
    ],
    "Airport Expressway": [
        [17.3600, 78.4850],
        [17.3200, 78.4700],
        [17.2800, 78.4500],
        [17.2400, 78.4300]
    ],
    "Station Road": [
        [17.4340, 78.5010],
        [17.4380, 78.5060],
        [17.4420, 78.5120]
    ],
    "MG Road": [
        [17.4380, 78.4950],
        [17.4430, 78.4900],
        [17.4480, 78.4850]
    ],
    "University Boulevard": [
        [17.4120, 78.5280],
        [17.4180, 78.5340],
        [17.4250, 78.5400]
    ],
    "Market Street": [
        [17.3610, 78.4740],
        [17.3660, 78.4780],
        [17.3710, 78.4820]
    ],
    "Ring Road": [
        [17.4000, 78.3800],
        [17.4150, 78.4100],
        [17.4200, 78.4500],
        [17.4100, 78.4900]
    ]
};

// Deterministic coordinate generator for any arbitrary road name from MySQL
function getRoadCoordinates(roadName) {
    if (!roadName) return [[17.3850, 78.4867], [17.3950, 78.4950]];
    const clean = roadName.trim();

    if (ROAD_COORDINATES[clean]) return ROAD_COORDINATES[clean];

    // Case-insensitive / partial match
    for (const key in ROAD_COORDINATES) {
        if (key.toLowerCase() === clean.toLowerCase() ||
            clean.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(clean.toLowerCase())) {
            return ROAD_COORDINATES[key];
        }
    }

    // Deterministic pseudo-hash offset near city center
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
        hash = (hash << 5) - hash + clean.charCodeAt(i);
        hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 100) - 50) * 0.0015;
    const lngOffset = ((Math.abs(hash >> 3) % 100) - 50) * 0.0015;
    const centerLat = 17.3950 + latOffset;
    const centerLng = 78.4750 + lngOffset;

    return [
        [centerLat - 0.008, centerLng - 0.008],
        [centerLat, centerLng],
        [centerLat + 0.008, centerLng + 0.008]
    ];
}

function getRoadMidpoint(coords) {
    if (!coords || coords.length === 0) return [17.3850, 78.4867];
    const midIndex = Math.floor(coords.length / 2);
    return coords[midIndex];
}

// Leaflet custom DivIcon builder
function createCustomPin(pinClass, innerContent) {
    return L.divIcon({
        className: "custom-leaflet-div",
        html: `
            <div class="custom-marker-pin ${pinClass}">
                <div class="custom-marker-inner">${innerContent}</div>
            </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
    });
}

// Initialize Leaflet Map (Using Free OpenStreetMap Tiles, Zero API Key Required)
function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    if (typeof L === "undefined") {
        console.warn("Leaflet script is not available. Please verify internet connection.");
        mapElement.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #475569;">
                <div style="font-size: 42px; margin-bottom: 12px;">🗺️</div>
                <h3 style="margin-bottom: 8px;">Leaflet Map Engine</h3>
                <p>Connect to the internet to load OpenStreetMap tiles and Leaflet library.</p>
            </div>
        `;
        return;
    }

    if (map) return; // Already initialized

    try {
        map = L.map("map", {
            center: [17.4050, 78.4550],
            zoom: 12,
            zoomControl: true
        });

        // Add OpenStreetMap standard tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | TraffIQ'
        }).addTo(map);

        // Initialize Layer Groups for organized toggling
        routesLayerGroup = L.layerGroup().addTo(map);
        alertsLayerGroup = L.layerGroup().addTo(map);
        emergencyLayerGroup = L.layerGroup().addTo(map);
        roadsLayerGroup = L.layerGroup().addTo(map);
        userLayerGroup = L.layerGroup().addTo(map);
        searchRouteLayerGroup = L.layerGroup().addTo(map);

        // Map Click Event: allows user to set Start/Destination or explore coordinates
        map.on("click", function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            const formatted = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            const popupContent = `
                <div class="map-popup-card">
                    <h4>📍 Picked Location</h4>
                    <p><strong>Coordinates:</strong> ${formatted}</p>
                    <p style="font-size: 12px; color: #64748b;">Set this map point as your trip starting point or destination.</p>
                    <div class="map-popup-actions">
                        <button type="button" class="popup-btn popup-btn-primary" onclick="setMapAsStart(${lat}, ${lng}, '${formatted}')">
                            🚩 Start Here
                        </button>
                        <button type="button" class="popup-btn" onclick="setMapAsDest(${lat}, ${lng}, '${formatted}')">
                            🏁 Destination
                        </button>
                    </div>
                </div>
            `;

            L.popup()
                .setLatLng(e.latlng)
                .setContent(popupContent)
                .openOn(map);
        });

        // Populate monitored road milestone pins
        renderMonitoredRoadMarkers();

        console.log("Leaflet + OpenStreetMap engine initialized successfully.");

    } catch (err) {
        console.error("Map initialization failed:", err);
    }
}

// Render Monitored Road Milestone Markers
function renderMonitoredRoadMarkers() {
    if (!roadsLayerGroup) return;
    roadsLayerGroup.clearLayers();

    for (const roadName in ROAD_COORDINATES) {
        const coords = ROAD_COORDINATES[roadName];
        const mid = getRoadMidpoint(coords);

        const pin = createCustomPin("pin-road", "🛣️");
        const marker = L.marker(mid, { icon: pin });

        const popupContent = `
            <div class="map-popup-card">
                <h4>🛣️ ${roadName}</h4>
                <p><strong>Status:</strong> Monitored Road</p>
                <p>Live route segment monitored by TraffIQ sensor system.</p>
                <div class="map-popup-actions">
                    <button type="button" class="popup-btn popup-btn-primary" onclick="setMapAsStart(${mid[0]}, ${mid[1]}, '${roadName}')">
                        🚩 Set as Start
                    </button>
                    <button type="button" class="popup-btn" onclick="setMapAsDest(${mid[0]}, ${mid[1]}, '${roadName}')">
                        🏁 Destination
                    </button>
                    <button type="button" class="popup-btn" onclick="prefillReportRoad('${roadName}')">
                        📝 Report Traffic
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        roadsLayerGroup.addLayer(marker);
    }
}

// Render Route Polylines and Markers on Leaflet Map
function renderRoutesOnMap(routesList) {
    if (!map || !routesLayerGroup) return;

    routesLayerGroup.clearLayers();
    routePolylineList = [];
    cachedRoutes = routesList || [];

    const bounds = [];

    cachedRoutes.forEach((route, index) => {
        const coords = getRoadCoordinates(route.road_name);
        if (!coords || coords.length < 2) return;

        coords.forEach(pt => bounds.push(pt));

        // Color coding by traffic condition
        let routeColor = "#2563eb"; // Blue default
        let condition = (route.predicted_condition || "").toLowerCase();
        let badgeClass = "badge-moderate";

        if (condition === "low") {
            routeColor = "#10b981"; // Emerald green
            badgeClass = "badge-low";
        } else if (condition === "moderate") {
            routeColor = "#f59e0b"; // Amber yellow
            badgeClass = "badge-moderate";
        } else if (condition === "high" || condition === "heavy") {
            routeColor = "#ef4444"; // Crimson red
            badgeClass = "badge-high";
        }

        // Draw polyline
        const polyline = L.polyline(coords, {
            color: routeColor,
            weight: 6,
            opacity: 0.85,
            smoothFactor: 1
        });

        // Hover effect
        polyline.on("mouseover", function() {
            this.setStyle({ weight: 9, opacity: 1.0 });
        });
        polyline.on("mouseout", function() {
            this.setStyle({ weight: 6, opacity: 0.85 });
        });

        // Click on route polyline
        polyline.on("click", function() {
            focusOnRoute(index);
        });

        const popupContent = `
            <div class="map-popup-card">
                <h4>
                    <span>${route.route_name || "Route " + (index + 1)}</span>
                    <span class="map-popup-badge ${badgeClass}">${route.predicted_condition || "Moderate"}</span>
                </h4>
                <p><strong>Road:</strong> ${route.road_name}</p>
                <p><strong>Distance:</strong> ${route.distance_km} km</p>
                <p><strong>Estimated Time:</strong> ${route.estimated_time_minutes} mins</p>
                <p><strong>Predicted Speed:</strong> ${route.predicted_speed ?? "25"} km/h</p>
                <div class="map-popup-actions">
                    <button type="button" class="popup-btn popup-btn-primary" onclick="focusOnRoute(${index})">
                        🔍 Inspect Route
                    </button>
                </div>
            </div>
        `;

        polyline.bindPopup(popupContent);
        routesLayerGroup.addLayer(polyline);

        routePolylineList.push({
            index: index,
            polyline: polyline,
            route: route,
            coords: coords
        });
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
    }
}

// Render Traffic Alerts on Leaflet Map
function renderAlertsOnMap(alertsList) {
    if (!map || !alertsLayerGroup) return;

    alertsLayerGroup.clearLayers();
    cachedAlerts = alertsList || [];

    cachedAlerts.forEach((alert) => {
        const roadName = alert.road_name || "Main Road";
        const coords = getRoadCoordinates(roadName);
        const mid = getRoadMidpoint(coords);

        const severity = (alert.severity || alert.status || "Moderate").toLowerCase();
        let pinClass = "pin-alert-moderate";
        let iconSymbol = "⚠️";

        if (severity === "high" || severity === "critical") {
            pinClass = "pin-alert-high";
            iconSymbol = "🔴";
        } else if ((alert.title || "").toLowerCase().includes("work") || (alert.message || "").toLowerCase().includes("construction")) {
            pinClass = "pin-incident";
            iconSymbol = "🚧";
        }

        const pin = createCustomPin(pinClass, iconSymbol);
        const marker = L.marker(mid, { icon: pin });

        const popupContent = `
            <div class="map-popup-card">
                <h4>⚠️ ${alert.title || "Traffic Alert"}</h4>
                <p><strong>Road:</strong> ${roadName}</p>
                <p><strong>Details:</strong> ${alert.message || alert.description || "Caution advised on this road."}</p>
                <p><strong>Severity:</strong> <span style="font-weight: bold; text-transform: capitalize;">${alert.severity || "Moderate"}</span></p>
                <div class="map-popup-actions">
                    <button type="button" class="popup-btn popup-btn-primary" onclick="prefillReportRoad('${roadName}')">
                        📢 Report Update
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        alertsLayerGroup.addLayer(marker);
    });
}

// Render Emergency Vehicle Alerts on Leaflet Map (Pulsing Animated Pins)
function renderEmergencyAlertsOnMap(emergencyList) {
    if (!map || !emergencyLayerGroup) return;

    emergencyLayerGroup.clearLayers();
    cachedEmergencyAlerts = emergencyList || [];

    cachedEmergencyAlerts.forEach((emergency) => {
        const roadName = emergency.road_name || "Main Road";
        const coords = getRoadCoordinates(roadName);
        const mid = getRoadMidpoint(coords);

        const pin = createCustomPin("pin-emergency", "🚑");
        const marker = L.marker(mid, { icon: pin });

        const popupContent = `
            <div class="map-popup-card">
                <h4>🚑 ${emergency.emergency_type || "Emergency Vehicle"}</h4>
                <p><strong>Road:</strong> ${roadName}</p>
                <p><strong>Alert:</strong> ${emergency.message || "Emergency vehicle active in this corridor. Please give way safely."}</p>
                <p style="font-size: 11px; color: #dc2626; font-weight: bold;">Priority clear corridor active.</p>
            </div>
        `;

        marker.bindPopup(popupContent);
        emergencyLayerGroup.addLayer(marker);
    });
}

// Plot Searched Route on Leaflet Map (Find Route Integration)
function plotSearchedRouteOnMap(startQuery, destQuery) {
    if (!map || !searchRouteLayerGroup) {
        initMap();
    }
    if (!map) return;

    searchRouteLayerGroup.clearLayers();

    // Determine start coordinates
    let startCoords;
    if (startQuery.includes(",")) {
        const parts = startQuery.split(",").map(p => parseFloat(p.trim()));
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
            startCoords = [parts[0], parts[1]];
        }
    }
    if (!startCoords) {
        startCoords = getRoadMidpoint(getRoadCoordinates(startQuery));
    }

    // Determine destination coordinates
    let destCoords;
    if (destQuery.includes(",")) {
        const parts = destQuery.split(",").map(p => parseFloat(p.trim()));
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
            destCoords = [parts[0], parts[1]];
        }
    }
    if (!destCoords) {
        destCoords = getRoadMidpoint(getRoadCoordinates(destQuery));
    }

    // Place Start Marker (Green Pin 'A')
    const startPin = createCustomPin("pin-start", "A");
    const startMarker = L.marker(startCoords, { icon: startPin });
    startMarker.bindPopup(`
        <div class="map-popup-card">
            <h4>🚩 Starting Point</h4>
            <p>${startQuery}</p>
        </div>
    `);
    searchRouteLayerGroup.addLayer(startMarker);

    // Place Destination Marker (Red Pin 'B')
    const destPin = createCustomPin("pin-dest", "B");
    const destMarker = L.marker(destCoords, { icon: destPin });
    destMarker.bindPopup(`
        <div class="map-popup-card">
            <h4>🏁 Destination</h4>
            <p>${destQuery}</p>
        </div>
    `);
    searchRouteLayerGroup.addLayer(destMarker);

    // Construct smooth path with an intermediate waypoint for realism
    const midLat = (startCoords[0] + destCoords[0]) / 2 + 0.005;
    const midLng = (startCoords[1] + destCoords[1]) / 2 - 0.003;
    const path = [startCoords, [midLat, midLng], destCoords];

    const polyline = L.polyline(path, {
        color: "#2563eb",
        weight: 7,
        opacity: 0.9,
        dashArray: null
    });

    polyline.bindPopup(`
        <div class="map-popup-card">
            <h4>🚗 Calculated Route</h4>
            <p><strong>From:</strong> ${startQuery}</p>
            <p><strong>To:</strong> ${destQuery}</p>
            <p><strong>Traffic:</strong> 🟡 Moderate</p>
            <p><strong>Estimated Speed:</strong> 22 km/h</p>
        </div>
    `);

    searchRouteLayerGroup.addLayer(polyline);

    // Zoom to fit the search route
    const bounds = L.latLngBounds([startCoords, [midLat, midLng], destCoords]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Show Selected Route Banner
    const banner = document.getElementById("selectedRouteBanner");
    const titleEl = document.getElementById("bannerRouteTitle");
    const detailsEl = document.getElementById("bannerRouteDetails");

    if (banner && titleEl && detailsEl) {
        titleEl.textContent = `Route: ${startQuery} → ${destQuery}`;
        detailsEl.textContent = `Live route calculated on OpenStreetMap. Predicted Traffic: Moderate • Speed: 22 km/h • Ready for navigation.`;
        banner.style.display = "flex";
    }

    // Scroll to map smoothly
    const mapSection = document.getElementById("map-section");
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// Locate User on Map with GPS Radar Pulse
function locateUserOnMap(lat, lng) {
    if (!map || !userLayerGroup) {
        initMap();
    }
    if (!map) return;

    if (lat === undefined || lng === undefined) {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function(pos) {
                locateUserOnMap(pos.coords.latitude, pos.coords.longitude);
            },
            function(err) {
                console.warn("Geolocation denied:", err);
                alert("Please enable location access in your browser to center the map on your position.");
            }
        );
        return;
    }

    userLayerGroup.clearLayers();

    const userIcon = L.divIcon({
        className: "custom-leaflet-div",
        html: `<div class="user-location-marker" title="My Current Location"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });

    const userMarker = L.marker([lat, lng], { icon: userIcon });
    userMarker.bindPopup(`
        <div class="map-popup-card">
            <h4>🔵 Your Current Location</h4>
            <p><strong>Latitude:</strong> ${lat.toFixed(5)}</p>
            <p><strong>Longitude:</strong> ${lng.toFixed(5)}</p>
            <div class="map-popup-actions">
                <button type="button" class="popup-btn popup-btn-primary" onclick="setMapAsStart(${lat}, ${lng}, '${lat.toFixed(4)}, ${lng.toFixed(4)}')">
                    🚩 Set as Starting Location
                </button>
            </div>
        </div>
    `);

    userLayerGroup.addLayer(userMarker);
    map.flyTo([lat, lng], 14, { duration: 1.5 });
    userMarker.openPopup();
}

// Reset Map View to encompass all routes
function resetMapView() {
    if (!map) return;

    if (routePolylineList.length > 0) {
        const group = L.featureGroup(routePolylineList.map(r => r.polyline));
        map.fitBounds(group.getBounds(), { padding: [40, 40] });
    } else {
        map.setView([17.4050, 78.4550], 12);
    }
}

// Focus on a specific route when user clicks "View on Map" on a route card
function focusOnRoute(routeIndex) {
    if (!map) initMap();
    if (!map) return;

    const target = routePolylineList.find(r => r.index === routeIndex);
    if (!target) return;

    // Reset styles and highlight target
    routePolylineList.forEach(r => {
        r.polyline.setStyle({ weight: 4, opacity: 0.45 });
    });
    target.polyline.setStyle({ weight: 9, opacity: 1.0 });

    map.fitBounds(target.polyline.getBounds(), { padding: [60, 60] });
    target.polyline.openPopup();

    // Update banner
    const banner = document.getElementById("selectedRouteBanner");
    const titleEl = document.getElementById("bannerRouteTitle");
    const detailsEl = document.getElementById("bannerRouteDetails");

    if (banner && titleEl && detailsEl) {
        const rt = target.route;
        titleEl.textContent = `${rt.route_name || "Selected Route"} (${rt.road_name})`;
        detailsEl.textContent = `Distance: ${rt.distance_km} km | Est. Time: ${rt.estimated_time_minutes} mins | Traffic: ${rt.predicted_condition || "Moderate"} | Speed: ${rt.predicted_speed ?? "25"} km/h`;
        banner.style.display = "flex";
    }

    const mapSection = document.getElementById("map-section");
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// Focus on an Alert on Map
function focusOnAlert(roadName, title, message, severity) {
    if (!map) initMap();
    if (!map) return;

    const coords = getRoadCoordinates(roadName);
    const mid = getRoadMidpoint(coords);

    map.flyTo(mid, 14, { duration: 1.2 });

    const popupContent = `
        <div class="map-popup-card">
            <h4>⚠️ ${title || "Traffic Alert"}</h4>
            <p><strong>Road:</strong> ${roadName}</p>
            <p><strong>Details:</strong> ${message || "Active condition reported."}</p>
            <p><strong>Severity:</strong> ${severity || "Moderate"}</p>
        </div>
    `;

    L.popup()
        .setLatLng(mid)
        .setContent(popupContent)
        .openOn(map);

    const mapSection = document.getElementById("map-section");
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// Focus on an Emergency Alert on Map
function focusOnEmergency(roadName, title, message, type) {
    if (!map) initMap();
    if (!map) return;

    const coords = getRoadCoordinates(roadName);
    const mid = getRoadMidpoint(coords);

    map.flyTo(mid, 14, { duration: 1.2 });

    const popupContent = `
        <div class="map-popup-card">
            <h4>🚑 ${title || type || "Emergency Alert"}</h4>
            <p><strong>Road:</strong> ${roadName}</p>
            <p><strong>Message:</strong> ${message || "Priority emergency vehicle transit corridor."}</p>
        </div>
    `;

    L.popup()
        .setLatLng(mid)
        .setContent(popupContent)
        .openOn(map);

    const mapSection = document.getElementById("map-section");
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// Clear selected route highlight and hide banner
function clearSelectedRoute() {
    routePolylineList.forEach(r => {
        r.polyline.setStyle({ weight: 6, opacity: 0.85 });
    });
    if (searchRouteLayerGroup) {
        searchRouteLayerGroup.clearLayers();
    }
    const banner = document.getElementById("selectedRouteBanner");
    if (banner) banner.style.display = "none";
}

// Filter Map Layers (All, Routes, Alerts, Emergency, Roads)
function toggleMapFilter(layerKey) {
    document.querySelectorAll(".map-pill").forEach(p => p.classList.remove("active"));
    const activePill = document.getElementById("pill-" + layerKey);
    if (activePill) activePill.classList.add("active");

    if (!map) return;

    if (layerKey === "all") {
        if (routesLayerGroup) map.addLayer(routesLayerGroup);
        if (alertsLayerGroup) map.addLayer(alertsLayerGroup);
        if (emergencyLayerGroup) map.addLayer(emergencyLayerGroup);
        if (roadsLayerGroup) map.addLayer(roadsLayerGroup);
        return;
    }

    // Toggle specific layer
    if (routesLayerGroup) {
        layerKey === "routes" ? map.addLayer(routesLayerGroup) : map.removeLayer(routesLayerGroup);
    }
    if (alertsLayerGroup) {
        layerKey === "alerts" ? map.addLayer(alertsLayerGroup) : map.removeLayer(alertsLayerGroup);
    }
    if (emergencyLayerGroup) {
        layerKey === "emergency" ? map.addLayer(emergencyLayerGroup) : map.removeLayer(emergencyLayerGroup);
    }
    if (roadsLayerGroup) {
        layerKey === "roads" ? map.addLayer(roadsLayerGroup) : map.removeLayer(roadsLayerGroup);
    }
}

// Helpers for Map Popups
function setMapAsStart(lat, lng, label) {
    const input = document.getElementById("startLocation");
    if (input) input.value = label;
    if (map) map.closePopup();

    const dest = document.getElementById("destination").value.trim();
    if (dest) {
        findRoute();
    }
}

function setMapAsDest(lat, lng, label) {
    const input = document.getElementById("destination");
    if (input) input.value = label;
    if (map) map.closePopup();

    const start = document.getElementById("startLocation").value.trim();
    if (start) {
        findRoute();
    }
}

function prefillReportRoad(roadName) {
    const input = document.getElementById("reportRoad");
    if (input) input.value = roadName;
    if (map) map.closePopup();

    const reportSection = document.querySelector(".report-section");
    if (reportSection) {
        reportSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// Dynamically add a community report pin on the map
function addCommunityReportMarker(road, condition, description) {
    if (!map || !alertsLayerGroup) return;

    const coords = getRoadCoordinates(road);
    const mid = getRoadMidpoint(coords);

    const pin = createCustomPin("pin-report", "📢");
    const marker = L.marker(mid, { icon: pin });

    marker.bindPopup(`
        <div class="map-popup-card">
            <h4>📢 Community Report</h4>
            <p><strong>Road:</strong> ${road}</p>
            <p><strong>Condition:</strong> ${condition}</p>
            <p><strong>Description:</strong> ${description || "Reported just now"}</p>
            <p style="font-size: 11px; color: #6d28d9;">Submitted by user</p>
        </div>
    `);

    alertsLayerGroup.addLayer(marker);
    map.flyTo(mid, 13, { duration: 1 });
    marker.openPopup();
}


async function fetchAlerts() {
    const container = document.getElementById("alerts-container");

    if (!container) {
        console.error("alerts-container was not found in index.html");
        return;
    }

    container.innerHTML = "<p>Loading traffic alerts...</p>";

    const defaultAlerts = [
        {
            road_name: "Main Road",
            title: "Heavy Traffic Congestion",
            message: "High vehicle density near Central Junction causing slow traffic flow.",
            severity: "High",
            status: "Active"
        },
        {
            road_name: "Outer Ring Road",
            title: "Road Maintenance Work",
            message: "Lane resurfacing between km 14 and 16. Proceed with caution.",
            severity: "Moderate",
            status: "Active"
        },
        {
            road_name: "Station Road",
            title: "Construction Delay",
            message: "Temporary bypass in operation near transit terminal.",
            severity: "Moderate",
            status: "Active"
        }
    ];

    try {
        const response = await fetch("http://localhost:5000/api/alerts");
        let alerts;

        if (response.ok) {
            alerts = await response.json();
            console.log("Traffic alerts from MySQL:", alerts);
        }

        if (!Array.isArray(alerts) || alerts.length === 0) {
            alerts = defaultAlerts;
        }

        renderAlertCards(alerts);
        renderAlertsOnMap(alerts);

    } catch (error) {
        console.warn("Traffic alerts backend offline, using default demo alerts:", error.message);
        renderAlertCards(defaultAlerts);
        renderAlertsOnMap(defaultAlerts);
    }
}

function renderAlertCards(alerts) {
    const container = document.getElementById("alerts-container");
    if (!container) return;

    container.innerHTML = "";

    alerts.forEach(function(alert) {
        const card = document.createElement("div");
        card.className = "alert-card";

        const roadName = alert.road_name || "Main Road";
        const titleText = alert.title || alert.alert_title || roadName || "Traffic Alert";
        const messageText = alert.description || alert.message || "Active traffic condition.";
        const severityText = alert.status || alert.severity || "Active";

        const heading = document.createElement("h3");
        heading.textContent = titleText;

        const road = document.createElement("p");
        road.textContent = "Road: " + roadName;

        const message = document.createElement("p");
        message.textContent = messageText;

        const status = document.createElement("p");
        status.textContent = "Status: " + severityText;

        const mapBtn = document.createElement("button");
        mapBtn.type = "button";
        mapBtn.className = "view-on-map-btn";
        mapBtn.innerHTML = "📍 View on Map";
        mapBtn.onclick = function() {
            focusOnAlert(roadName, titleText, messageText, severityText);
        };

        card.appendChild(heading);
        card.appendChild(road);
        card.appendChild(message);
        card.appendChild(status);
        card.appendChild(mapBtn);

        container.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialize Leaflet + OpenStreetMap engine
    initMap();

    // 2. Load routes and map layers
    loadRoutes();

    // 3. Load traffic & emergency alerts
    fetchAlerts();
    loadEmergencyAlerts();

    // 4. Load community reports & road datalists
    loadCommunityReports();
    loadRoads();
});


async function loadEmergencyAlerts() {
    const container = document.getElementById(
        "emergency-alerts-container"
    );

    if (!container) {
        console.error("Emergency alerts container not found.");
        return;
    }

    container.textContent = "Loading emergency alerts...";

    const defaultEmergencies = [
        {
            road_name: "Airport Expressway",
            emergency_type: "Ambulance Transit",
            message: "Emergency medical transport heading toward City Central Hospital. Please keep right lane clear.",
            alert_time: new Date().toISOString()
        }
    ];

    try {
        const response = await fetch(
            "http://localhost:5000/api/emergency-alerts"
        );
        let alerts;

        if (response.ok) {
            alerts = await response.json();
            console.log("Emergency alerts from MySQL:", alerts);
        }

        if (!Array.isArray(alerts) || alerts.length === 0) {
            alerts = defaultEmergencies;
        }

        renderEmergencyCards(alerts);
        renderEmergencyAlertsOnMap(alerts);

    } catch (error) {
        console.warn("Emergency alerts backend offline, using demo alert:", error.message);
        renderEmergencyCards(defaultEmergencies);
        renderEmergencyAlertsOnMap(defaultEmergencies);
    }
}

function renderEmergencyCards(alerts) {
    const container = document.getElementById("emergency-alerts-container");
    if (!container) return;

    container.innerHTML = "";

    alerts.forEach(function(alert) {
        const card = document.createElement("div");
        card.className = "emergency-alert-card";

        const roadName = alert.road_name || "Airport Expressway";
        const titleText = alert.title || alert.emergency_type || alert.alert_title || "Emergency Corridor";
        const messageText = alert.description || alert.message || "Emergency vehicle active. Give way safely.";
        const typeText = alert.emergency_type || alert.type || "Emergency";

        const heading = document.createElement("h3");
        heading.textContent = titleText;

        const description = document.createElement("p");
        description.textContent = messageText;

        const type = document.createElement("p");
        type.textContent = "Type: " + typeText;

        const mapBtn = document.createElement("button");
        mapBtn.type = "button";
        mapBtn.className = "view-on-map-btn";
        mapBtn.innerHTML = "🚑 View on Map";
        mapBtn.onclick = function() {
            focusOnEmergency(roadName, titleText, messageText, typeText);
        };

        card.appendChild(heading);
        card.appendChild(description);
        card.appendChild(type);
        card.appendChild(mapBtn);

        container.appendChild(card);
    });
}


async function loadCommunityReports() {
    const container = document.getElementById("reports-container");

    if (!container) {
        console.error("Reports container not found.");
        return;
    }

    container.textContent = "Loading community reports...";

    try {
        const response = await fetch("http://localhost:5000/api/reports");

        if (!response.ok) {
            throw new Error("Failed to load community reports.");
        }

        const reports = await response.json();

        console.log("Community reports from MySQL:", reports);

        container.innerHTML = "";

        if (!Array.isArray(reports) || reports.length === 0) {
            container.textContent = "No community reports available.";
            return;
        }

        reports.forEach(function(report) {
            const card = document.createElement("div");
            card.className = "report-card";

            const heading = document.createElement("h3");
            heading.textContent = report.road_name || "Unknown road";

            const condition = document.createElement("p");
            condition.textContent =
                "Traffic condition: " +
                (report.traffic_condition || "Not specified");

            const description = document.createElement("p");
            description.textContent =
                report.description || "No additional details.";

            const date = document.createElement("p");
            date.textContent =
                "Reported at: " +
                (report.reported_at
                    ? new Date(report.reported_at).toLocaleString()
                    : "Date unavailable");

            card.appendChild(heading);
            card.appendChild(condition);
            card.appendChild(description);
            card.appendChild(date);

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Community reports error:", error);
        container.textContent =
            "Unable to load community reports. Check the backend connection.";
    }
}


async function predictTraffic() {
    const message = document.getElementById("mlPredictionMessage");
    if (!message) {
    console.error("ML prediction message element not found.");
    return;
}
    const trafficElement = document.getElementById("predictedTraffic");
   

    message.textContent = "Predicting traffic with AI...";
    const predictButton = document.querySelector(
    'button[onclick="predictTraffic()"]'
);

if (predictButton && predictButton.disabled) {
    return;
}

if (predictButton) {
    predictButton.disabled = true;
    predictButton.textContent = "⏳ Predicting...";
}
    document.getElementById("mlPredictionTime").textContent = "";

    const now = new Date();

    // Demo inputs for the trained ML model
    const trafficData = {
        hour: now.getHours(),
        day_of_week: (now.getDay() + 6) % 7,
        vehicles_per_hour: 900,
        average_speed: 15,
        rain: 0,
        incidents: 1
    };

    try {
        const response = await fetch(
            "http://localhost:5000/api/ml-predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(trafficData)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Prediction failed."
            );
        }

        const level = result.predicted_traffic_level;
        const speedElement = document.getElementById("estimatedSpeed");

if (speedElement) {
    if (level === "Low") {
        speedElement.textContent = "40 km/h (demo estimate)";
    } else if (level === "Moderate") {
        speedElement.textContent = "25 km/h (demo estimate)";
    } else if (level === "High") {
        speedElement.textContent = "10 km/h (demo estimate)";
    }
}
        document.getElementById("mlPredictionTime").textContent =
    "Prediction generated at: " + new Date().toLocaleTimeString();

        const emoji =
            level === "High" ? "🔴" :
            level === "Moderate" ? "🟡" : "🟢";

        trafficElement.textContent = `${emoji} ${level}`;
        trafficElement.classList.remove(
    "low-text",
    "moderate-text",
    "high-text"
);
trafficElement.classList.remove(
    "low",
    "moderate",
    "high"
);


if (level === "Low") {
    trafficElement.classList.add("low-text", "low");
} else if (level === "Moderate") {
    trafficElement.classList.add("moderate-text", "moderate");
} else if (level === "High") {
    trafficElement.classList.add("high-text", "high");
}


        message.textContent =
            `ML model prediction: ${level}. Demo inputs used; this is not live traffic data.`;

    } catch (error) {
        console.error("Traffic prediction error:", error);

        message.textContent =
            "Prediction failed. Check that both backend servers are running.";
    }

        finally {
        if (predictButton) {
            predictButton.disabled = false;
            predictButton.textContent = "🤖 Predict Traffic with AI";
        }
    }
}

async function loadRoutes() {
    const container = document.getElementById("routes-container");
    if (!container) {
        console.error('Element with id "routes-container" was not found.');
        return;
    }

    const defaultRoutes = [
        {
            route_name: "Route A (Outer Bypass)",
            road_name: "Outer Ring Road",
            distance_km: 18.5,
            estimated_time_minutes: 24,
            route_status: "Available",
            predicted_condition: "Low",
            predicted_speed: 65
        },
        {
            route_name: "Route B (City Central)",
            road_name: "Main Road",
            distance_km: 12.2,
            estimated_time_minutes: 29,
            route_status: "Available",
            predicted_condition: "Moderate",
            predicted_speed: 25
        },
        {
            route_name: "Route C (Tech Corridor)",
            road_name: "Tech Corridor",
            distance_km: 15.0,
            estimated_time_minutes: 38,
            route_status: "Available",
            predicted_condition: "High",
            predicted_speed: 16
        },
        {
            route_name: "Route D (Airport Link)",
            road_name: "Airport Expressway",
            distance_km: 22.0,
            estimated_time_minutes: 21,
            route_status: "Available",
            predicted_condition: "Low",
            predicted_speed: 70
        }
    ];

    try {
        const response = await fetch("http://localhost:5000/api/routes");
        let routes;

        if (response.ok) {
            routes = await response.json();
            console.log("Routes from MySQL:", routes);
        }

        if (!Array.isArray(routes) || routes.length === 0) {
            routes = defaultRoutes;
        }

        renderRouteCards(routes);
        renderRoutesOnMap(routes);

    } catch (error) {
        console.warn("Routes backend offline, using demo route network:", error.message);
        renderRouteCards(defaultRoutes);
        renderRoutesOnMap(defaultRoutes);
    }
}

function renderRouteCards(routes) {
    const container = document.getElementById("routes-container");
    if (!container) return;

    container.innerHTML = "";

    routes.forEach(function(route, index) {
        const card = document.createElement("div");
        card.className = "route-card";

        if (index === 0 && route.route_status === "Available") {
            card.classList.add("recommended-route");
        }

        const heading = document.createElement("h3");
        heading.textContent = route.route_name;

        if (index === 0 && route.route_status === "Available") {
            heading.textContent += " - Recommended";
        }

        const road = document.createElement("p");
        road.textContent = "Road: " + route.road_name;

        const distance = document.createElement("p");
        distance.textContent = "Distance: " + route.distance_km + " km";

        const time = document.createElement("p");
        time.textContent = "Estimated time: " + route.estimated_time_minutes + " minutes";

        const traffic = document.createElement("p");
        traffic.textContent = "Predicted Traffic: " + (route.predicted_condition || "Moderate");

        const speed = document.createElement("p");
        speed.textContent = "Predicted Speed: " + (route.predicted_speed ?? "25") + " km/h";

        const mapBtn = document.createElement("button");
        mapBtn.type = "button";
        mapBtn.className = "view-on-map-btn";
        mapBtn.innerHTML = "🗺️ View on Map";
        mapBtn.onclick = function() {
            focusOnRoute(index);
        };

        card.appendChild(heading);
        card.appendChild(road);
        card.appendChild(distance);
        card.appendChild(time);
        card.appendChild(traffic);
        card.appendChild(speed);
        card.appendChild(mapBtn);

        container.appendChild(card);
    });
}



async function loadRoads() {
    try {
        const response = await fetch("http://localhost:5000/api/roads");

        if (!response.ok) {
            throw new Error("Failed to fetch roads");
        }

        const roads = await response.json();

        console.log("Roads from MySQL:", roads);

        const roadSuggestions = document.getElementById("availableRoads");

        if (!roadSuggestions) {
            console.error("availableRoads datalist not found");
            return;
        }

        roadSuggestions.innerHTML = "";

        roads.forEach(function(road) {
            const option = document.createElement("option");
            option.value = road.road_name;
            roadSuggestions.appendChild(option);
        });

        console.log("Road suggestions loaded successfully.");

    } catch (error) {
        console.warn("Roads loading error (backend offline), using default road list:", error.message);
        const roadSuggestions = document.getElementById("availableRoads");
        if (roadSuggestions) {
            roadSuggestions.innerHTML = "";
            const defaultRoadNames = [
                "Main Road", "Outer Ring Road", "Tech Corridor",
                "Airport Expressway", "Station Road", "MG Road",
                "University Boulevard", "Market Street"
            ];
            defaultRoadNames.forEach(function(r) {
                const opt = document.createElement("option");
                opt.value = r;
                roadSuggestions.appendChild(opt);
            });
        }
    }
}


// User Registration Function
async function registerUser() {
    const full_name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    const message = document.getElementById("registerMessage");

    if (!full_name || !email || !password) {
        message.textContent = "Please fill in all fields.";
        message.style.color = "red";
        return;
    }

    if (password.length < 8) {
        message.textContent = "Password must contain at least 8 characters.";
        message.style.color = "red";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: full_name,
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        message.textContent = "Registration successful! You can now log in.";
        message.style.color = "green";

        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";

        console.log("Registered user ID:", result.user_id);

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";

        console.error("Registration error:", error);
    }
}

// Check Current Login Session
async function checkLoginSession() {
    try {
        const response = await fetch("http://localhost:5000/api/me", {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            console.log("No active login session.");
            return;
        }

        const result = await response.json();

        console.log("Active login session:", result.user);

    } catch (error) {
        console.error("Session check error:", error);
    }
}

// User Logout Function
async function logoutUser() {
    try {
        const response = await fetch("http://localhost:5000/api/logout", {
            method: "POST",
            credentials: "include"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Logout failed.");
        }

        alert("Logged out successfully!");

        // Hide both dashboards
        document.getElementById("user-dashboard").style.display = "none";
        document.getElementById("admin-dashboard").style.display = "none";

        // Clear login information
        document.getElementById("loginEmail").value = "";
        document.getElementById("loginPassword").value = "";
        document.getElementById("loginMessage").textContent = "";

        console.log(result.message);

    } catch (error) {
        console.error("Logout error:", error);
        alert(error.message);
    }
}
// Load Admin Dashboard Statistics
// Load Admin Dashboard Statistics
async function loadAdminStats() {
    try {
        const response = await fetch("http://localhost:5000/api/admin/stats", {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to load admin statistics.");
        }

        document.getElementById("adminTrafficReports").textContent =
            result.total_reports;

        document.getElementById("adminIncidents").textContent =
            result.total_alerts;

        document.getElementById("adminEmergency").textContent =
            result.total_emergency;

        document.getElementById("adminRoads").textContent =
            result.total_roads;

        console.log("Admin statistics loaded:", result);

    } catch (error) {
        console.error("Admin statistics error:", error);
    }
}
// Load Recent Community Traffic Reports
async function loadAdminReports() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/admin/reports",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const reports = await response.json();

        if (!response.ok) {
            throw new Error(
                reports.message || "Failed to load reports."
            );
        }

        const container = document.getElementById(
            "adminReportsContainer"
        );

        if (reports.length === 0) {
            container.innerHTML = "<p>No traffic reports found.</p>";
            return;
        }

        container.innerHTML = reports.map(report => `
            <div class="admin-report-card"
     data-road="${report.road_name.toLowerCase()}"
     data-status="${(report.status || "Pending").toLowerCase()}">
                <h4>Report #${report.report_id} - ${report.road_name}</h4>
                <p><strong>Condition:</strong> ${report.traffic_condition}</p>
                <p>
    <strong>Status:</strong>
    <span class="report-status status-${(report.status || "Pending").toLowerCase()}">
        ${report.status || "Pending"}
    </span>
</p>
                <label>Status:</label>

<select id="status-${report.report_id}">
    <option value="Pending" ${report.status === "Pending" ? "selected" : ""}>Pending</option>
    <option value="Reviewed" ${report.status === "Reviewed" ? "selected" : ""}>Reviewed</option>
    <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>Resolved</option>
</select>

<button onclick="updateReportStatus(${report.report_id})">
    Update Status
</button>
<button onclick="deleteTrafficReport(${report.report_id})">
    Delete Report
</button>
                <p><strong>Description:</strong> ${report.description || "No description"}</p>
                <p><strong>Reported at:</strong> ${
                    new Date(report.reported_at).toLocaleString()
                }</p>
            </div>
        `).join("");

        console.log("Admin reports loaded:", reports);

    } catch (error) {
        console.error("Admin reports error:", error);

        document.getElementById("adminReportsContainer").innerHTML =
            "<p>Unable to load traffic reports.</p>";
    }
}
// Update Traffic Report Status
async function updateReportStatus(reportId) {
    const statusDropdown = document.getElementById(
        `status-${reportId}`
    );

    const status = statusDropdown.value;

    try {
        const response = await fetch(
            `http://localhost:5000/api/admin/reports/${reportId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ status: status })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Status update failed.");
        }

        alert("Report status updated successfully!");

        loadAdminReports();
loadAdminStats();
loadReportSummary();
    } catch (error) {
        console.error("Status update error:", error);
        alert(error.message);
    }
}
// Delete Traffic Report
async function deleteTrafficReport(reportId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this traffic report?"
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/admin/reports/${reportId}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Failed to delete report."
            );
        }

        alert("Traffic report deleted successfully!");

        loadAdminReports();
loadAdminStats();
loadReportSummary();
    } catch (error) {
        console.error("Delete report error:", error);
        alert(error.message);
    }
}
// Filter Admin Traffic Reports
function filterAdminReports() {

    const searchValue = document.getElementById("reportSearch")
        .value.toLowerCase().trim();

    const statusValue = document.getElementById("reportStatusFilter")
        .value.toLowerCase();

    const reportCards = document.querySelectorAll(".admin-report-card");

    reportCards.forEach(card => {

        const roadName = card.dataset.road || "";
        const reportStatus = card.dataset.status || "pending";

        const matchesRoad = roadName.includes(searchValue);

        const matchesStatus =
            statusValue === "all" || reportStatus === statusValue;

        card.style.display =
            matchesRoad && matchesStatus ? "" : "none";
    });
}
// Load Admin Report Summary
async function loadReportSummary() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/admin/report-summary",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Failed to load report summary."
            );
        }

        document.getElementById("pendingReportCount").textContent =
            result.pending_reports || 0;

        document.getElementById("reviewedReportCount").textContent =
            result.reviewed_reports || 0;

        document.getElementById("resolvedReportCount").textContent =
            result.resolved_reports || 0;

        console.log("Report summary loaded:", result);

    } catch (error) {
        console.error("Report summary error:", error);
    }
}
// Load Logged-in User's Traffic Reports
async function loadMyReports() {

    try {
        const response = await fetch(
            "http://localhost:5000/api/my-reports",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const reports = await response.json();

        if (!response.ok) {
            throw new Error(
                reports.message || "Failed to load your reports."
            );
        }

        const container = document.getElementById(
            "myReportsContainer"
        );

        if (reports.length === 0) {
            container.innerHTML =
                "<p>You have not submitted any traffic reports yet.</p>";
            return;
        }

        container.innerHTML = reports.map(report => `
            <div class="user-report-card">
                <h4>Report #${report.report_id} - ${report.road_name}</h4>

                <p><strong>Condition:</strong>
                    ${report.traffic_condition}
                </p>

                <p><strong>Description:</strong>
                    ${report.description || "No description"}
                </p>

                <p><strong>Status:</strong>
                    <span class="report-status status-${(report.status || "Pending").toLowerCase()}">
                        ${report.status || "Pending"}
                    </span>
                </p>

                <p><strong>Submitted:</strong>
                    ${new Date(report.reported_at).toLocaleString()}
                </p>
            </div>
        `).join("");

        console.log("My traffic reports loaded:", reports);

    } catch (error) {
        console.error("My reports error:", error);

        document.getElementById("myReportsContainer").innerHTML =
            "<p>Unable to load your reports.</p>";
    }
}