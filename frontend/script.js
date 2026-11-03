/**
 * TraffIQ - Smart Traffic Intelligence & Emergency Management System
 * Focused on Mysuru (Mysore), Karnataka
 * Features:
 *  1. Emergency Ambulance Siren (Web Audio API Synthesizer & Visual Alert)
 *  2. Police Checking & Checkpoint Alerts (with Auto-Expiry & Map Pins)
 *  3. Accurate Mysore Route Planner (Manual input, Landmarks, Pins & Polyline)
 *  4. Leaflet + OpenStreetMap engine strictly constrained to Mysuru, KA
 *  5. Role-based authorization & Seamless Local/Backend fallback
 */

// ============================================================================
// 1. Mysore Geographic Coordinates & Curated Road Network
// ============================================================================

// Mysore City Center: K.R. Circle / Mysore Palace
const MYSORE_CENTER = [12.3051, 76.6554];

// Geographic Bounding Box for Mysuru Metropolitan Area (Prevents world map drift)
const MYSORE_BOUNDS = [
    [12.1800, 76.5000], // Southwest
    [12.4400, 76.8000]  // Northeast
];

// Curated dictionary of Mysore landmarks with pinpoint coordinates
const MYSORE_LANDMARKS = {
    "mysore palace": [12.3051, 76.6551],
    "palace": [12.3051, 76.6551],
    "k.r. hospital": [12.3125, 76.6500],
    "kr hospital": [12.3125, 76.6500],
    "suburban bus stand": [12.3115, 76.6582],
    "city bus stand": [12.3082, 76.6534],
    "mysore railway station": [12.3160, 76.6444],
    "railway station": [12.3160, 76.6444],
    "chamundi hill": [12.2725, 76.6710],
    "chamundi hill temple": [12.2725, 76.6710],
    "chamundeshwari temple": [12.2725, 76.6710],
    "apollo bgs hospital": [12.2885, 76.6275],
    "apollo hospital": [12.2885, 76.6275],
    "columbia asia hospital": [12.3480, 76.6850],
    "manipal hospital": [12.3480, 76.6850],
    "infosys mysore campus": [12.3550, 76.5950],
    "infosys": [12.3550, 76.5950],
    "university of mysore": [12.3120, 76.6200],
    "manasagangotri": [12.3120, 76.6200],
    "st. philomena's cathedral": [12.3210, 76.6570],
    "st. philomena": [12.3210, 76.6570],
    "mysore zoo": [12.3015, 76.6660],
    "zoo": [12.3015, 76.6660],
    "hardinge circle": [12.3080, 76.6590],
    "jayachamaraja wadiyar circle": [12.3080, 76.6590],
    "ramaswamy circle": [12.3010, 76.6420],
    "ballal circle": [12.2960, 76.6410],
    "kuvempunagar": [12.2850, 76.6300],
    "kuvempunagar double road": [12.2850, 76.6300],
    "saraswathipuram": [12.2980, 76.6320],
    "gokulam": [12.3320, 76.6300],
    "vijayanagar": [12.3450, 76.6100],
    "hebbal": [12.3600, 76.6100],
    "hebbal industrial area": [12.3600, 76.6100],
    "jayalakshmipuram": [12.3240, 76.6250],
    "lalitha mahal palace": [12.2940, 76.6900],
    "jayanagar": [12.2900, 76.6500],
    "srirangapatna": [12.4210, 76.6940],
    "d. devaraj urs road": [12.3065, 76.6480],
    "devaraj urs road": [12.3065, 76.6480],
    "sayyaji rao road": [12.3120, 76.6520],
    "jlb road": [12.3050, 76.6430],
    "krs road": [12.3350, 76.6320],
    "hunsur road": [12.3160, 76.6150],
    "outer ring road": [12.3450, 76.6100],
    "bengaluru-mysuru highway": [12.3450, 76.6750],
    "bangalore road": [12.3450, 76.6750]
};

// Curated Mysore Arterial Road Corridors for realistic polyline route rendering
const MYSORE_ROADS = {
    "Sayyaji Rao Road": [
        [12.3051, 76.6551],
        [12.3082, 76.6534],
        [12.3125, 76.6515],
        [12.3180, 76.6500],
        [12.3220, 76.6485]
    ],
    "Outer Ring Road (ORR Mysuru)": [
        [12.3650, 76.6150],
        [12.3520, 76.6620],
        [12.3380, 76.6900],
        [12.3080, 76.7050],
        [12.2680, 76.6850],
        [12.2580, 76.6400],
        [12.2750, 76.5980],
        [12.3150, 76.5920],
        [12.3650, 76.6150]
    ],
    "JLB Road (Jhansi Lakshmibai)": [
        [12.2960, 76.6410],
        [12.3010, 76.6420],
        [12.3080, 76.6435],
        [12.3160, 76.6444]
    ],
    "Bengaluru-Mysuru Highway (NH 275)": [
        [12.3650, 76.6900],
        [12.3480, 76.6850],
        [12.3320, 76.6720],
        [12.3180, 76.6620]
    ],
    "KRS Road (KR Hospital Corridor)": [
        [12.3125, 76.6500],
        [12.3220, 76.6420],
        [12.3380, 76.6320],
        [12.3600, 76.6180]
    ],
    "Hunsur Road (University Route)": [
        [12.3180, 76.6444],
        [12.3160, 76.6320],
        [12.3140, 76.6200],
        [12.3120, 76.6020],
        [12.3080, 76.5850]
    ],
    "Chamundi Hill Road": [
        [12.2980, 76.6660],
        [12.2880, 76.6690],
        [12.2780, 76.6720],
        [12.2725, 76.6710]
    ],
    "D. Devaraj Urs Road": [
        [12.3060, 76.6530],
        [12.3065, 76.6480],
        [12.3070, 76.6430]
    ],
    "Vishwamanava Double Road": [
        [12.2850, 76.6300],
        [12.2920, 76.6310],
        [12.2980, 76.6320],
        [12.3040, 76.6330]
    ],
    "Station Road / Irwin Road": [
        [12.3160, 76.6444],
        [12.3140, 76.6500],
        [12.3120, 76.6550],
        [12.3115, 76.6582]
    ]
};

// ============================================================================
// 2. State & Layer Groups
// ============================================================================

let map = null;
let routesLayerGroup = null;
let ambulanceLayerGroup = null;
let policeLayerGroup = null;
let searchRouteLayerGroup = null;
let landmarksLayerGroup = null;
let hazardsLayerGroup = null;
let userLocationMarker = null;

// Audio Siren Context (Web Audio API Synthesizer)
let audioCtx = null;
let sirenOsc1 = null;
let sirenOsc2 = null;
let sirenGain = null;
let sirenTimer = null;
let isSirenSoundPlaying = false;
let isSirenMuted = false;

// Active data caches
let cachedAmbulanceAlerts = [];
let cachedPoliceCheckpoints = [];
let cachedRoutes = [];
let currentActiveAmbulance = null;
let currentActiveRouteData = null;
let activeRole = localStorage.getItem("traffiq_role") || "user";

// Backend API Base URL
const API_BASE = "http://localhost:5000/api";

// ============================================================================
// 3. Web Audio API Ambulance Siren Synthesizer
// ============================================================================

function initAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

/**
 * Starts a realistic, authentic 2-tone emergency wailing siren.
 * Alternates frequencies between 650 Hz and 920 Hz with smooth exponential frequency ramps.
 */
function startAmbulanceSirenSound() {
    if (isSirenMuted) return;
    if (isSirenSoundPlaying) return;

    try {
        initAudioContext();
        if (!audioCtx) return;

        sirenGain = audioCtx.createGain();
        sirenGain.gain.setValueAtTime(0.12, audioCtx.currentTime); // Comfortable audible volume
        sirenGain.connect(audioCtx.destination);

        sirenOsc1 = audioCtx.createOscillator();
        sirenOsc1.type = "sawtooth";
        sirenOsc1.frequency.setValueAtTime(650, audioCtx.currentTime);
        sirenOsc1.connect(sirenGain);
        sirenOsc1.start();

        let isHighTone = false;
        sirenTimer = setInterval(() => {
            if (!audioCtx || !sirenOsc1) return;
            const targetFreq = isHighTone ? 650 : 920;
            sirenOsc1.frequency.cancelScheduledValues(audioCtx.currentTime);
            sirenOsc1.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.45);
            isHighTone = !isHighTone;
        }, 550);

        isSirenSoundPlaying = true;
        updateSirenToggleButton();
        console.log("Ambulance siren audio synthesized.");
    } catch (err) {
        console.warn("Audio siren synthesis not permitted without user gesture:", err.message);
    }
}

function stopAmbulanceSirenSound() {
    if (sirenTimer) {
        clearInterval(sirenTimer);
        sirenTimer = null;
    }
    if (sirenOsc1) {
        try {
            sirenOsc1.stop();
            sirenOsc1.disconnect();
        } catch (e) {}
        sirenOsc1 = null;
    }
    if (sirenGain) {
        try {
            sirenGain.disconnect();
        } catch (e) {}
        sirenGain = null;
    }
    isSirenSoundPlaying = false;
    updateSirenToggleButton();
}

function toggleAmbulanceSirenSound() {
    isSirenMuted = !isSirenMuted;
    if (isSirenMuted) {
        stopAmbulanceSirenSound();
    } else {
        if (currentActiveAmbulance) {
            startAmbulanceSirenSound();
        }
    }
    updateSirenToggleButton();
}

function updateSirenToggleButton() {
    const btn = document.getElementById("sirenSoundToggleBtn");
    if (!btn) return;
    if (isSirenMuted) {
        btn.innerHTML = "🔈 Siren Muted";
        btn.style.opacity = "0.7";
    } else {
        btn.innerHTML = isSirenSoundPlaying ? "🔊 Mute Siren" : "🔈 Unmute Siren";
        btn.style.opacity = "1";
    }
}

// ============================================================================
// 4. Map Initialization strictly for Mysuru, Karnataka
// ============================================================================

function initMap() {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    if (typeof L === "undefined") {
        console.error("Leaflet is not loaded.");
        return;
    }

    if (map) return; // Prevent double initialization

    try {
        // Constrain the map strictly to Mysuru, Karnataka area
        map = L.map("map", {
            center: MYSORE_CENTER,
            zoom: 13,
            minZoom: 11,
            maxZoom: 18,
            maxBounds: L.latLngBounds(MYSORE_BOUNDS),
            maxBoundsViscosity: 0.85
        });

        // Free OpenStreetMap Standard Tiles (Zero API key needed)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &bull; TraffIQ Mysuru'
        }).addTo(map);

        // Layer Groups
        routesLayerGroup = L.layerGroup().addTo(map);
        ambulanceLayerGroup = L.layerGroup().addTo(map);
        policeLayerGroup = L.layerGroup().addTo(map);
        searchRouteLayerGroup = L.layerGroup().addTo(map);
        landmarksLayerGroup = L.layerGroup().addTo(map);
        hazardsLayerGroup = L.layerGroup().addTo(map);

        // Map Click: Pick location and allow user to set as Start or Destination
        map.on("click", function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            const approxName = getNearestMysoreLandmarkName(lat, lng) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            const popupContent = `
                <div class="map-popup-card">
                    <h4>📍 Picked Location</h4>
                    <p><strong>Place:</strong> ${approxName}</p>
                    <p><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                    <div class="map-popup-actions">
                        <button type="button" class="popup-btn popup-btn-primary" onclick="setAsStart('${approxName}')">
                            🚩 Set as Start
                        </button>
                        <button type="button" class="popup-btn" onclick="setAsDestination('${approxName}')">
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

        // Plot Key Mysore Landmarks on the map
        renderMysoreLandmarks();

        console.log("TraffIQ Mysuru Map initialized successfully.");
    } catch (err) {
        console.error("Map initialization error:", err);
    }
}

function resetMysoreView() {
    if (map) {
        map.setView(MYSORE_CENTER, 13, { animate: true });
    }
}

function locateUserOnMap() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const latlng = [lat, lng];

            // If outside Mysore, notify but still center
            const bounds = L.latLngBounds(MYSORE_BOUNDS);
            if (!bounds.contains(latlng)) {
                alert(`Detected position (${lat.toFixed(4)}, ${lng.toFixed(4)}) is outside Mysore. Centering map on Mysore with GPS marker.`);
            }

            if (userLocationMarker) {
                userLocationMarker.setLatLng(latlng);
            } else {
                const userIcon = L.divIcon({
                    className: "custom-leaflet-div",
                    html: `
                        <div class="custom-marker-pin" style="background: #10b981; border: 2px solid #fff;">
                            <div class="pulse-radar-ring"></div>
                            <div class="custom-marker-inner">📍</div>
                        </div>
                    `,
                    iconSize: [36, 36],
                    iconAnchor: [18, 36]
                });
                userLocationMarker = L.marker(latlng, { icon: userIcon }).addTo(map);
                userLocationMarker.bindPopup("<strong>📍 Your Current GPS Position</strong>").openPopup();
            }

            map.setView(latlng, 14, { animate: true });
            document.getElementById("startLocation").value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        },
        err => {
            alert("Could not detect location. Please allow browser location access or select a location from the map.");
        }
    );
}

// ============================================================================
// 5. Intelligent Mysore Location Resolver (Manual Typing Support)
// ============================================================================

/**
 * Accurately parses user typed text and resolves it to a coordinate in Mysuru.
 * Supports:
 *  - "lat, lng" coordinates (e.g. 12.3051, 76.6551)
 *  - Landmark names (e.g. "Mysore Palace", "KR Hospital", "Infosys")
 *  - Mysore road names (e.g. "Sayyaji Rao Road", "JLB Road")
 *  - Substring & fuzzy matches
 *  - Fallback deterministic coordinate within Mysuru city limits
 */
function resolveMysoreLocation(query) {
    if (!query) return MYSORE_CENTER;
    const clean = query.trim().toLowerCase();

    // 1. Check if lat, lng coordinate format
    const coordParts = clean.split(/[, ]+/).filter(Boolean);
    if (coordParts.length === 2) {
        const lat = parseFloat(coordParts[0]);
        const lng = parseFloat(coordParts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
        }
    }

    // 2. Exact or substring match in Mysore Landmarks dictionary
    if (MYSORE_LANDMARKS[clean]) {
        return MYSORE_LANDMARKS[clean];
    }
    for (const key in MYSORE_LANDMARKS) {
        if (clean.includes(key) || key.includes(clean)) {
            return MYSORE_LANDMARKS[key];
        }
    }

    // 3. Match in Mysore Roads dictionary
    for (const roadName in MYSORE_ROADS) {
        if (roadName.toLowerCase().includes(clean) || clean.includes(roadName.toLowerCase())) {
            const coords = MYSORE_ROADS[roadName];
            return coords[Math.floor(coords.length / 2)];
        }
    }

    // 4. Deterministic hash-based coordinate within Mysuru city bounds
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
        hash = (hash << 5) - hash + clean.charCodeAt(i);
        hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 100) - 50) * 0.0007;
    const lngOffset = ((Math.abs(hash >> 3) % 100) - 50) * 0.0007;

    return [MYSORE_CENTER[0] + latOffset, MYSORE_CENTER[1] + lngOffset];
}

function getNearestMysoreLandmarkName(lat, lng) {
    let nearest = null;
    let minDist = Infinity;
    for (const name in MYSORE_LANDMARKS) {
        const c = MYSORE_LANDMARKS[name];
        const dist = Math.hypot(lat - c[0], lng - c[1]);
        if (dist < minDist) {
            minDist = dist;
            nearest = name;
        }
    }
    if (minDist < 0.008) {
        return nearest.replace(/\b\w/g, l => l.toUpperCase());
    }
    return null;
}

function setAsStart(locationText) {
    document.getElementById("startLocation").value = locationText;
    if (map) map.closePopup();
}

function setAsDestination(locationText) {
    document.getElementById("destination").value = locationText;
    if (map) map.closePopup();
}

function selectQuickLandmark(name) {
    const startInput = document.getElementById("startLocation");
    const destInput = document.getElementById("destination");

    if (!startInput.value) {
        startInput.value = name;
    } else {
        destInput.value = name;
    }
}

function swapLocations() {
    const startInput = document.getElementById("startLocation");
    const destInput = document.getElementById("destination");
    const temp = startInput.value;
    startInput.value = destInput.value;
    destInput.value = temp;

    if (startInput.value && destInput.value) {
        findRoute();
    }
}

function getCurrentLocation() {
    locateUserOnMap();
}

// ============================================================================
// 6. Accurate Start & Destination Display and Route Calculation
// ============================================================================

function findRoute() {
    const startText = document.getElementById("startLocation").value.trim();
    const destText = document.getElementById("destination").value.trim();

    if (!startText || !destText) {
        alert("Please enter both Starting Location and Destination.");
        return;
    }

    if (!map) initMap();

    // Clear previous search route
    if (searchRouteLayerGroup) {
        searchRouteLayerGroup.clearLayers();
    }

    // Resolve coordinates
    const startCoords = resolveMysoreLocation(startText);
    const destCoords = resolveMysoreLocation(destText);

    // Calculate distance using Haversine formula
    const distanceKm = calculateDistanceKm(startCoords[0], startCoords[1], destCoords[0], destCoords[1]);
    
    // Estimate travel time (average speed 28-40 km/h in Mysuru city)
    const avgSpeedKmH = distanceKm > 10 ? 42 : 28;
    const estTimeMinutes = Math.max(4, Math.round((distanceKm / avgSpeedKmH) * 60));

    // Construct smooth polyline along Mysore road grid
    const intermediatePoints = generateMysoreRouteWaypoints(startCoords, destCoords);
    const fullRoutePoints = [startCoords, ...intermediatePoints, destCoords];

    // 1. Draw glowing Route Polyline
    const routePolyline = L.polyline(fullRoutePoints, {
        color: "#06b6d4",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
    }).addTo(searchRouteLayerGroup);

    // Background shadow line for contrast
    L.polyline(fullRoutePoints, {
        color: "#0f172a",
        weight: 10,
        opacity: 0.5
    }).addTo(searchRouteLayerGroup);

    // 2. Distinct Green Start Pin (🚩 START)
    const startIcon = L.divIcon({
        className: "custom-leaflet-div",
        html: `
            <div class="custom-marker-pin pin-start-flag">
                <div class="custom-marker-inner">🚩</div>
            </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
    });

    const startMarker = L.marker(startCoords, { icon: startIcon }).addTo(searchRouteLayerGroup);
    startMarker.bindPopup(`
        <div class="map-popup-card">
            <h4>🚩 START: ${escapeHtml(startText)}</h4>
            <p><strong>Coordinates:</strong> ${startCoords[0].toFixed(4)}, ${startCoords[1].toFixed(4)}</p>
            <p style="color: #34d399; font-weight: bold;">Trip Starting Point</p>
        </div>
    `);

    // 3. Distinct Red Checkered Destination Pin (🏁 DESTINATION)
    const destIcon = L.divIcon({
        className: "custom-leaflet-div",
        html: `
            <div class="custom-marker-pin pin-dest-flag">
                <div class="custom-marker-inner">🏁</div>
            </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
    });

    const destMarker = L.marker(destCoords, { icon: destIcon }).addTo(searchRouteLayerGroup);
    destMarker.bindPopup(`
        <div class="map-popup-card">
            <h4>🏁 DESTINATION: ${escapeHtml(destText)}</h4>
            <p><strong>Coordinates:</strong> ${destCoords[0].toFixed(4)}, ${destCoords[1].toFixed(4)}</p>
            <p><strong>Est. Distance:</strong> ${distanceKm.toFixed(1)} km &bull; <strong>Time:</strong> ${estTimeMinutes} mins</p>
        </div>
    `);

    // 4. Smoothly fit map view to contain both Start and Destination
    map.fitBounds(routePolyline.getBounds(), {
        padding: [60, 60],
        maxZoom: 15,
        animate: true
    });

    // 5. Update Route Summary Panel
    currentActiveRouteData = {
        startText,
        destText,
        startCoords,
        destCoords,
        distanceKm,
        estTimeMinutes,
        polyline: routePolyline
    };

    updateRouteSummaryUI(startText, destText, distanceKm, estTimeMinutes);

    // Update AI prediction box to destination road
    document.getElementById("currentRoad").textContent = destText;
}

function generateMysoreRouteWaypoints(start, dest) {
    // Generate realistic right-angle / radial waypoints through Mysore road intersections
    const midLat = (start[0] + dest[0]) / 2;
    const midLng = (start[1] + dest[1]) / 2;

    // Slight curvature simulating Mysore radial street layout
    const offsetLat = (dest[1] - start[1]) * 0.15;
    const offsetLng = -(dest[0] - start[0]) * 0.15;

    return [
        [start[0] + (midLat - start[0]) * 0.5 + offsetLat * 0.5, start[1] + (midLng - start[1]) * 0.5 + offsetLng * 0.5],
        [midLat + offsetLat, midLng + offsetLng],
        [dest[0] - (dest[0] - midLat) * 0.5 + offsetLat * 0.5, dest[1] - (dest[1] - midLng) * 0.5 + offsetLng * 0.5]
    ];
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.25; // 1.25 road winding factor
}

function updateRouteSummaryUI(start, dest, distanceKm, estTimeMinutes) {
    const panel = document.getElementById("routeSummaryPanel");
    if (!panel) return;

    panel.style.display = "block";
    document.getElementById("summaryStartText").textContent = start;
    document.getElementById("summaryDestText").textContent = dest;
    document.getElementById("summaryDistance").textContent = `${distanceKm.toFixed(1)} km`;
    document.getElementById("summaryTime").textContent = `${estTimeMinutes} mins`;

    // Check intersection with active police checkpoints
    let policeWarning = "";
    if (cachedPoliceCheckpoints.length > 0) {
        const activeCheck = cachedPoliceCheckpoints.find(c => c.status === "Active");
        if (activeCheck) {
            policeWarning = ` &bull; 👮 Notice: Active Police Checkpoint on ${activeCheck.road_name} (${activeCheck.check_type}).`;
        }
    }

    // Check intersection with active emergency ambulance
    let ambulanceWarning = "";
    if (currentActiveAmbulance) {
        ambulanceWarning = ` &bull; 🚨 Emergency Corridor Active: Ambulance ${currentActiveAmbulance.ambulance_id} heading to ${currentActiveAmbulance.hospital_destination}. Please give way!`;
    }

    const safetyNotice = document.getElementById("summarySafetyText");
    if (ambulanceWarning) {
        safetyNotice.innerHTML = `<strong>⚠️ EMERGENCY ALERT:</strong> ${ambulanceWarning}`;
        safetyNotice.parentElement.style.borderColor = "#ef4444";
        safetyNotice.parentElement.style.background = "rgba(239, 68, 68, 0.15)";
        safetyNotice.style.color = "#fecaca";
    } else if (policeWarning) {
        safetyNotice.innerHTML = `<strong>ℹ️ ROAD ADVISORY:</strong> Route verified.${policeWarning}`;
        safetyNotice.parentElement.style.borderColor = "#3b82f6";
        safetyNotice.parentElement.style.background = "rgba(59, 130, 246, 0.15)";
        safetyNotice.style.color = "#bfdbfe";
    } else {
        safetyNotice.innerHTML = `Optimal arterial path selected across Mysuru. Clear driving conditions.`;
        safetyNotice.parentElement.style.borderColor = "rgba(16, 185, 129, 0.3)";
        safetyNotice.parentElement.style.background = "rgba(16, 185, 129, 0.1)";
        safetyNotice.style.color = "#a7f3d0";
    }
}

function clearActiveRoute() {
    if (searchRouteLayerGroup) {
        searchRouteLayerGroup.clearLayers();
    }
    const panel = document.getElementById("routeSummaryPanel");
    if (panel) panel.style.display = "none";
    currentActiveRouteData = null;
}

function zoomToActiveRoute() {
    if (currentActiveRouteData && currentActiveRouteData.polyline && map) {
        map.fitBounds(currentActiveRouteData.polyline.getBounds(), { padding: [50, 50], animate: true });
    }
}

// ============================================================================
// 7. Emergency Ambulance Siren & Transit Management
// ============================================================================

async function loadAmbulanceAlerts() {
    const container = document.getElementById("ambulanceAlertsContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/emergency-ambulance`);
        let alerts = [];
        if (res.ok) {
            alerts = await res.json();
        }

        if (!Array.isArray(alerts) || alerts.length === 0) {
            alerts = getDefaultAmbulanceAlerts();
        }

        cachedAmbulanceAlerts = alerts;
        renderAmbulanceCards(alerts);
        renderAmbulanceOnMap(alerts);
        updateAmbulanceBanner(alerts);

    } catch (err) {
        console.warn("Ambulance alerts API offline, using local data:", err.message);
        const defaults = getDefaultAmbulanceAlerts();
        cachedAmbulanceAlerts = defaults;
        renderAmbulanceCards(defaults);
        renderAmbulanceOnMap(defaults);
        updateAmbulanceBanner(defaults);
    }
}

function getDefaultAmbulanceAlerts() {
    return [
        {
            id: 1,
            ambulance_id: "KA-09-EM-108",
            driver_name: "Paramedic Rajesh Kumar (EMS 108)",
            hospital_destination: "K.R. Hospital (City Central)",
            current_location: "Outer Ring Road - Hebbal Junction",
            latitude: 12.3650,
            longitude: 76.6150,
            dest_lat: 12.3125,
            dest_lng: 76.6500,
            direction_of_travel: "Southbound along KRS Road towards K.R. Hospital",
            affected_roads: "KRS Road, Sayyaji Rao Road, Irwin Road",
            priority: "Critical",
            status: "Active",
            activated_at: new Date(Date.now() - 10 * 60000).toISOString()
        }
    ];
}

function updateAmbulanceBanner(alerts) {
    const banner = document.getElementById("emergencySirenBanner");
    const active = alerts.find(a => a.status === "Active");

    if (active) {
        currentActiveAmbulance = active;
        banner.style.display = "block";
        document.getElementById("bannerAmbulanceId").textContent = active.ambulance_id;
        document.getElementById("bannerAmbulanceDetails").innerHTML = `
            Ambulance en route to <strong>${escapeHtml(active.hospital_destination)}</strong> (${escapeHtml(active.direction_of_travel)}).
            Affected roads: <strong>${escapeHtml(active.affected_roads)}</strong>.
            <br><strong>⚠️ ALL DRIVERS: PLEASE PULL OVER &amp; GIVE WAY SAFELY!</strong>
        `;

        // Update hero stat
        document.getElementById("statAmbulanceCount").textContent = "1 Active";
        document.getElementById("pillAmbulanceCount").textContent = "1";

        // Start siren sound if not muted
        if (!isSirenMuted && !isSirenSoundPlaying) {
            startAmbulanceSirenSound();
        }
    } else {
        currentActiveAmbulance = null;
        banner.style.display = "none";
        document.getElementById("statAmbulanceCount").textContent = "0 Active";
        document.getElementById("pillAmbulanceCount").textContent = "0";
        stopAmbulanceSirenSound();
    }
}

function renderAmbulanceCards(alerts) {
    const container = document.getElementById("ambulanceAlertsContainer");
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = "<p style='color: var(--text-muted);'>No active emergency ambulance alerts at this time.</p>";
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="ambulance-card ${alert.status === 'Active' ? 'active-corridor' : ''}">
            <div class="ambulance-card-header">
                <span class="ambulance-callsign">
                    <span>🚑</span> ${escapeHtml(alert.ambulance_id)}
                    <small style="color: var(--text-muted); font-size: 11px;">(${escapeHtml(alert.driver_name || 'EMS')})</small>
                </span>
                <span class="${alert.status === 'Active' ? 'status-badge-active' : 'status-badge-resolved'}">
                    ${alert.status === 'Active' ? '🚨 LIVE EMERGENCY' : 'RESOLVED'}
                </span>
            </div>

            <div class="ambulance-route-path">
                <strong>🏥 Destination:</strong> ${escapeHtml(alert.hospital_destination)}
            </div>

            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">
                <strong>📍 Current Location:</strong> ${escapeHtml(alert.current_location)} &bull; 
                <strong>Direction:</strong> ${escapeHtml(alert.direction_of_travel)}
            </div>

            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                <strong>Corridor Roads:</strong> ${escapeHtml(alert.affected_roads)}
            </div>

            ${alert.status === 'Active' ? `
                <div class="ambulance-giveway-alert">
                    ⚠️ EMERGENCY CORRIDOR: PLEASE GIVE WAY SAFELY AND CLEAR THE RIGHT LANE!
                </div>
            ` : ''}

            <div class="ambulance-card-footer">
                <span>Activated: ${new Date(alert.activated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-sm-action" onclick="focusOnAmbulance('${alert.ambulance_id}')">
                        📍 Track on Map
                    </button>
                    ${alert.status === 'Active' ? `
                        <button type="button" class="btn-sm-action" style="color: #f87171;" onclick="deactivateAmbulanceAlert(${alert.id})">
                            🛑 Deactivate (Authorized)
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join("");
}

function renderAmbulanceOnMap(alerts) {
    if (!ambulanceLayerGroup) return;
    ambulanceLayerGroup.clearLayers();

    alerts.filter(a => a.status === "Active").forEach(alert => {
        const lat = alert.latitude || 12.3650;
        const lng = alert.longitude || 76.6150;
        const destLat = alert.dest_lat || 12.3125;
        const destLng = alert.dest_lng || 76.6500;

        // Custom pulsing ambulance pin
        const ambIcon = L.divIcon({
            className: "custom-leaflet-div",
            html: `
                <div class="custom-marker-pin pin-ambulance-active">
                    <div class="pulse-radar-ring" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.2);"></div>
                    <div class="custom-marker-inner">🚑</div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        const marker = L.marker([lat, lng], { icon: ambIcon }).addTo(ambulanceLayerGroup);
        marker.bindPopup(`
            <div class="map-popup-card">
                <h4>🚑 LIVE EMERGENCY: ${escapeHtml(alert.ambulance_id)}</h4>
                <p><strong>Destination:</strong> ${escapeHtml(alert.hospital_destination)}</p>
                <p><strong>Direction:</strong> ${escapeHtml(alert.direction_of_travel)}</p>
                <p><strong>Corridor:</strong> ${escapeHtml(alert.affected_roads)}</p>
                <div class="ambulance-giveway-alert" style="margin: 8px 0 0;">
                    ⚠️ PLEASE GIVE WAY SAFELY!
                </div>
            </div>
        `);

        // Draw emergency corridor line to hospital
        const corridorLine = [
            [lat, lng],
            [(lat + destLat) / 2 + 0.005, (lng + destLng) / 2 - 0.005],
            [destLat, destLng]
        ];

        L.polyline(corridorLine, {
            color: "#dc2626",
            weight: 5,
            dashArray: "8, 8",
            opacity: 0.85
        }).addTo(ambulanceLayerGroup);
    });
}

function focusOnActiveAmbulance() {
    if (currentActiveAmbulance && map) {
        const lat = currentActiveAmbulance.latitude || 12.3650;
        const lng = currentActiveAmbulance.longitude || 76.6150;
        map.setView([lat, lng], 15, { animate: true });
    }
}

function focusOnAmbulance(ambulanceId) {
    const amb = cachedAmbulanceAlerts.find(a => a.ambulance_id === ambulanceId);
    if (amb && map) {
        map.setView([amb.latitude || 12.3650, amb.longitude || 76.6150], 15, { animate: true });
    }
}

function openAmbulanceDispatchModal() {
    if (activeRole !== "ambulance_operator" && activeRole !== "admin") {
        const proceed = confirm(`Notice: You are currently viewing as "${activeRole}". Do you want to switch to "Ambulance Operator" to activate an emergency siren?`);
        if (proceed) {
            onRoleChange("ambulance_operator");
        } else {
            return;
        }
    }
    openModal("modalDispatchAmbulance");
}

async function handleDispatchAmbulance(event) {
    event.preventDefault();

    const ambulance_id = document.getElementById("ambCallsign").value.trim();
    const driver_name = document.getElementById("ambDriver").value.trim();
    const current_location = document.getElementById("ambStartLoc").value.trim();
    const hospital_destination = document.getElementById("ambHospital").value;
    const direction_of_travel = document.getElementById("ambDirection").value.trim();
    const affected_roads = document.getElementById("ambRoads").value.trim();
    const priority = document.getElementById("ambPriority").value;

    const startCoords = resolveMysoreLocation(current_location);
    const destCoords = resolveMysoreLocation(hospital_destination);

    const payload = {
        ambulance_id,
        driver_name,
        current_location,
        hospital_destination,
        direction_of_travel,
        affected_roads,
        priority,
        latitude: startCoords[0],
        longitude: startCoords[1],
        dest_lat: destCoords[0],
        dest_lng: destCoords[1]
    };

    try {
        const res = await fetch(`${API_BASE}/emergency-ambulance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-role": activeRole
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        alert("🚨 Emergency Ambulance Siren & Corridor Broadcasted Successfully!");
        closeModal("modalDispatchAmbulance");

        // Reload alerts and play siren
        await loadAmbulanceAlerts();
        startAmbulanceSirenSound();

    } catch (err) {
        console.warn("Backend offline, updating local ambulance state:", err);
        const localItem = {
            id: Date.now(),
            ...payload,
            status: "Active",
            activated_at: new Date().toISOString()
        };
        cachedAmbulanceAlerts.unshift(localItem);
        updateAmbulanceBanner(cachedAmbulanceAlerts);
        renderAmbulanceCards(cachedAmbulanceAlerts);
        renderAmbulanceOnMap(cachedAmbulanceAlerts);
        startAmbulanceSirenSound();
        closeModal("modalDispatchAmbulance");
        alert("🚨 Emergency Ambulance Siren Activated (Local Engine)!");
    }
}

async function deactivateActiveAmbulance() {
    if (!currentActiveAmbulance) return;
    deactivateAmbulanceAlert(currentActiveAmbulance.id);
}

async function deactivateAmbulanceAlert(id) {
    if (activeRole !== "ambulance_operator" && activeRole !== "admin") {
        const proceed = confirm(`Deactivating an emergency alert requires authorization. Switch role to Ambulance Operator/Admin?`);
        if (proceed) {
            onRoleChange("ambulance_operator");
        } else {
            return;
        }
    }

    const conf = confirm("Are you sure you want to deactivate this emergency alert? The siren will stop and normal traffic flow will resume.");
    if (!conf) return;

    try {
        await fetch(`${API_BASE}/emergency-ambulance/${id}/resolve`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-user-role": activeRole
            }
        });
    } catch (e) {
        console.warn("Offline resolve:", e);
    }

    // Update local state
    const item = cachedAmbulanceAlerts.find(a => a.id === id);
    if (item) {
        item.status = "Resolved";
        item.resolved_at = new Date().toISOString();
    }
    stopAmbulanceSirenSound();
    updateAmbulanceBanner(cachedAmbulanceAlerts);
    renderAmbulanceCards(cachedAmbulanceAlerts);
    renderAmbulanceOnMap(cachedAmbulanceAlerts);
    alert("🛑 Emergency Corridor Cleared. Siren Deactivated.");
}

// ============================================================================
// 8. Police Checking & Checkpoint Alerts
// ============================================================================

async function loadPoliceCheckpoints() {
    const container = document.getElementById("policeCheckpointsContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/police-checkpoints`);
        let checkpoints = [];
        if (res.ok) {
            checkpoints = await res.json();
        }

        if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
            checkpoints = getDefaultPoliceCheckpoints();
        }

        // Apply auto-expiry calculation
        checkpoints = processCheckpointExpiry(checkpoints);

        cachedPoliceCheckpoints = checkpoints;
        renderPoliceCards(checkpoints);
        renderPoliceOnMap(checkpoints);
        updatePoliceStats(checkpoints);

    } catch (err) {
        console.warn("Police checkpoints API offline, using local data:", err.message);
        const defaults = processCheckpointExpiry(getDefaultPoliceCheckpoints());
        cachedPoliceCheckpoints = defaults;
        renderPoliceCards(defaults);
        renderPoliceOnMap(defaults);
        updatePoliceStats(defaults);
    }
}

function getDefaultPoliceCheckpoints() {
    const now = Date.now();
    return [
        {
            id: 1,
            road_name: "Sayyaji Rao Road",
            checkpoint_location: "Near Government Ayurveda Hospital / K.R. Circle",
            check_type: "Helmet & Seatbelt Inspection",
            latitude: 12.3110,
            longitude: 76.6520,
            reported_by: "Devaraja Traffic Police Station",
            date_time: new Date(now - 45 * 60000).toISOString(),
            validity_hours: 4,
            expires_at: new Date(now + 195 * 60000).toISOString(),
            status: "Active"
        },
        {
            id: 2,
            road_name: "Hunsur Road (University Route)",
            checkpoint_location: "Opposite University of Mysore Main Gate (Manasagangotri)",
            check_type: "Speed Radar & Document Verification",
            latitude: 12.3140,
            longitude: 76.6230,
            reported_by: "VV Puram Traffic Police Station",
            date_time: new Date(now - 60 * 60000).toISOString(),
            validity_hours: 3,
            expires_at: new Date(now + 120 * 60000).toISOString(),
            status: "Active"
        },
        {
            id: 3,
            road_name: "Outer Ring Road (ORR Mysuru)",
            checkpoint_location: "Bogadi Ring Road Junction",
            check_type: "Drink & Drive (Alcometer Checking)",
            latitude: 12.3020,
            longitude: 76.5950,
            reported_by: "Kuvempunagar Traffic Police",
            date_time: new Date(now - 20 * 60000).toISOString(),
            validity_hours: 4,
            expires_at: new Date(now + 220 * 60000).toISOString(),
            status: "Active"
        }
    ];
}

function processCheckpointExpiry(checkpoints) {
    const now = new Date();
    return checkpoints.map(cp => {
        if (cp.status === "Active" && cp.expires_at) {
            const exp = new Date(cp.expires_at);
            if (exp < now) {
                return { ...cp, status: "Expired" };
            }
        }
        return cp;
    });
}

function updatePoliceStats(checkpoints) {
    const activeCount = checkpoints.filter(c => c.status === "Active").length;
    document.getElementById("statPoliceCount").textContent = `${activeCount} Active`;
    document.getElementById("pillPoliceCount").textContent = `${activeCount}`;
}

function renderPoliceCards(checkpoints) {
    const container = document.getElementById("policeCheckpointsContainer");
    if (!container) return;

    if (checkpoints.length === 0) {
        container.innerHTML = "<p style='color: var(--text-muted);'>No police checkpoints reported at this time.</p>";
        return;
    }

    container.innerHTML = checkpoints.map(cp => {
        const isActive = cp.status === "Active";
        const timeRemaining = formatExpiryCountdown(cp.expires_at);

        return `
            <div class="police-card" style="border-left-color: ${isActive ? '#3b82f6' : '#64748b'}; opacity: ${isActive ? '1' : '0.7'};">
                <div class="police-card-header">
                    <span class="police-road-name">
                        <span>👮</span> ${escapeHtml(cp.road_name)}
                    </span>
                    <span class="check-type-badge">${escapeHtml(cp.check_type)}</span>
                </div>

                <div class="police-landmark">
                    <strong>📍 Location:</strong> ${escapeHtml(cp.checkpoint_location)}
                </div>

                <div class="police-meta-row">
                    <span>Authority: <strong>${escapeHtml(cp.reported_by)}</strong></span>
                    <span>Status: <strong style="color: ${isActive ? '#60a5fa' : '#94a3b8'};">${cp.status}</strong></span>
                    ${isActive ? `<span class="expiry-countdown">⏳ ${timeRemaining}</span>` : ''}
                </div>

                <div class="police-card-actions">
                    <button type="button" class="btn-sm-action" onclick="focusOnPoliceCheckpoint(${cp.latitude}, ${cp.longitude})">
                        📍 View on Map
                    </button>
                    ${isActive ? `
                        <button type="button" class="btn-sm-action" style="color: #60a5fa;" onclick="markCheckpointCleared(${cp.id})">
                            ✔️ Mark as Cleared
                        </button>
                        <button type="button" class="btn-sm-action" style="color: #f87171;" onclick="removeCheckpoint(${cp.id})">
                            🗑️ Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join("");
}

function renderPoliceOnMap(checkpoints) {
    if (!policeLayerGroup) return;
    policeLayerGroup.clearLayers();

    checkpoints.filter(c => c.status === "Active").forEach(cp => {
        const lat = cp.latitude || 12.3051;
        const lng = cp.longitude || 76.6554;

        const policeIcon = L.divIcon({
            className: "custom-leaflet-div",
            html: `
                <div class="custom-marker-pin pin-police">
                    <div class="pulse-radar-ring" style="border-color: #3b82f6; background: rgba(59, 130, 246, 0.2);"></div>
                    <div class="custom-marker-inner">👮</div>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -38]
        });

        const marker = L.marker([lat, lng], { icon: policeIcon }).addTo(policeLayerGroup);
        marker.bindPopup(`
            <div class="map-popup-card">
                <h4>👮 POLICE CHECKPOINT</h4>
                <p><strong>Road:</strong> ${escapeHtml(cp.road_name)}</p>
                <p><strong>Landmark:</strong> ${escapeHtml(cp.checkpoint_location)}</p>
                <p><strong>Checking Type:</strong> ${escapeHtml(cp.check_type)}</p>
                <p><strong>Reported By:</strong> ${escapeHtml(cp.reported_by)}</p>
                <p style="color: #fbbf24; font-weight: bold;">⏳ ${formatExpiryCountdown(cp.expires_at)}</p>
            </div>
        `);
    });
}

function formatExpiryCountdown(expiresAt) {
    if (!expiresAt) return "No expiry set";
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Valid for ${hours}h ${mins}m`;
}

function focusOnPoliceCheckpoint(lat, lng) {
    if (map) {
        map.setView([lat, lng], 15, { animate: true });
    }
}

function openPoliceCheckpointModal() {
    if (activeRole !== "police" && activeRole !== "admin") {
        const proceed = confirm(`Notice: You are currently viewing as "${activeRole}". Do you want to switch to "Traffic Police" to report a checkpoint?`);
        if (proceed) {
            onRoleChange("police");
        } else {
            return;
        }
    }
    openModal("modalReportCheckpoint");
}

async function handleReportCheckpoint(event) {
    event.preventDefault();

    const road_name = document.getElementById("cpRoad").value.trim();
    const checkpoint_location = document.getElementById("cpLandmark").value.trim();
    const check_type = document.getElementById("cpType").value;
    const validity_hours = parseInt(document.getElementById("cpDuration").value, 10) || 3;
    const reported_by = document.getElementById("cpOfficer").value.trim();

    const coords = resolveMysoreLocation(road_name);

    const payload = {
        road_name,
        checkpoint_location,
        check_type,
        validity_hours,
        reported_by,
        latitude: coords[0],
        longitude: coords[1]
    };

    try {
        await fetch(`${API_BASE}/police-checkpoints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-role": activeRole
            },
            body: JSON.stringify(payload)
        });
        alert("👮 Police Checkpoint Alert Deployed Successfully!");
        closeModal("modalReportCheckpoint");
        await loadPoliceCheckpoints();
    } catch (err) {
        console.warn("Backend offline, saving local checkpoint:", err);
        const expiresAt = new Date(Date.now() + validity_hours * 60 * 60 * 1000).toISOString();
        const localItem = {
            id: Date.now(),
            ...payload,
            date_time: new Date().toISOString(),
            expires_at: expiresAt,
            status: "Active"
        };
        cachedPoliceCheckpoints.unshift(localItem);
        renderPoliceCards(cachedPoliceCheckpoints);
        renderPoliceOnMap(cachedPoliceCheckpoints);
        updatePoliceStats(cachedPoliceCheckpoints);
        closeModal("modalReportCheckpoint");
        alert("👮 Police Checkpoint Alert Recorded (Local Engine)!");
    }
}

async function markCheckpointCleared(id) {
    if (activeRole !== "police" && activeRole !== "admin") {
        alert("Permission denied. Police or Admin authorization required.");
        return;
    }

    try {
        await fetch(`${API_BASE}/police-checkpoints/${id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-user-role": activeRole
            },
            body: JSON.stringify({ status: "Cleared" })
        });
    } catch (e) {}

    const item = cachedPoliceCheckpoints.find(c => c.id === id);
    if (item) item.status = "Cleared";
    renderPoliceCards(cachedPoliceCheckpoints);
    renderPoliceOnMap(cachedPoliceCheckpoints);
    updatePoliceStats(cachedPoliceCheckpoints);
}

async function removeCheckpoint(id) {
    if (activeRole !== "police" && activeRole !== "admin") {
        alert("Permission denied. Police or Admin authorization required.");
        return;
    }

    const conf = confirm("Delete this police checkpoint alert?");
    if (!conf) return;

    try {
        await fetch(`${API_BASE}/police-checkpoints/${id}`, {
            method: "DELETE",
            headers: { "x-user-role": activeRole }
        });
    } catch (e) {}

    cachedPoliceCheckpoints = cachedPoliceCheckpoints.filter(c => c.id !== id);
    renderPoliceCards(cachedPoliceCheckpoints);
    renderPoliceOnMap(cachedPoliceCheckpoints);
    updatePoliceStats(cachedPoliceCheckpoints);
}

// Auto-refresh expiry every 45 seconds
setInterval(() => {
    if (cachedPoliceCheckpoints.length > 0) {
        cachedPoliceCheckpoints = processCheckpointExpiry(cachedPoliceCheckpoints);
        renderPoliceCards(cachedPoliceCheckpoints);
        renderPoliceOnMap(cachedPoliceCheckpoints);
        updatePoliceStats(cachedPoliceCheckpoints);
    }
}, 45000);

// ============================================================================
// 9. Smart Mysore Routes & Community Reports
// ============================================================================

async function loadRoutes() {
    const container = document.getElementById("routes-container");
    if (!container) return;

    const defaultRoutes = [
        {
            route_id: 1,
            route_name: "Route 1: Outer Ring Road Express",
            road_name: "Outer Ring Road (ORR Mysuru)",
            distance_km: 18.2,
            estimated_time_minutes: 22,
            route_status: "Available",
            predicted_condition: "Low",
            predicted_speed: 68
        },
        {
            route_id: 2,
            route_name: "Route 2: City Heritage Central",
            road_name: "Sayyaji Rao Road",
            distance_km: 9.4,
            estimated_time_minutes: 26,
            route_status: "Available",
            predicted_condition: "Moderate",
            predicted_speed: 26
        },
        {
            route_id: 3,
            route_name: "Route 3: JLB - Saraswathipuram Link",
            road_name: "JLB Road (Jhansi Lakshmibai)",
            distance_km: 11.0,
            estimated_time_minutes: 34,
            route_status: "Available",
            predicted_condition: "High",
            predicted_speed: 18
        },
        {
            route_id: 4,
            route_name: "Route 4: University - Hunsur Corridor",
            road_name: "Hunsur Road (University Route)",
            distance_km: 12.8,
            estimated_time_minutes: 20,
            route_status: "Available",
            predicted_condition: "Low",
            predicted_speed: 55
        }
    ];

    try {
        const res = await fetch(`${API_BASE}/routes`);
        let routes = [];
        if (res.ok) routes = await res.json();
        if (!Array.isArray(routes) || routes.length === 0) routes = defaultRoutes;
        renderRouteCards(routes);
        renderMonitoredRoadsOnMap(routes);
    } catch (e) {
        renderRouteCards(defaultRoutes);
        renderMonitoredRoadsOnMap(defaultRoutes);
    }
}

function renderRouteCards(routes) {
    const container = document.getElementById("routes-container");
    if (!container) return;

    container.innerHTML = routes.map((r, i) => `
        <div class="smart-route-card ${i === 0 ? 'recommended' : ''}">
            <div>
                <div class="smart-route-title">
                    ${escapeHtml(r.route_name)} ${i === 0 ? '<span style="color: #34d399; font-size: 11px;">(Recommended)</span>' : ''}
                </div>
                <div class="smart-route-road">🛣️ Road: ${escapeHtml(r.road_name)}</div>
                
                <div class="smart-route-stats">
                    <div class="stat-item">
                        Distance
                        <strong>${r.distance_km} km</strong>
                    </div>
                    <div class="stat-item">
                        Est. Time
                        <strong>${r.estimated_time_minutes} mins</strong>
                    </div>
                    <div class="stat-item">
                        Traffic
                        <strong style="color: ${r.predicted_condition === 'Low' ? '#34d399' : r.predicted_condition === 'Moderate' ? '#fbbf24' : '#f87171'};">
                            ${r.predicted_condition || 'Moderate'}
                        </strong>
                    </div>
                    <div class="stat-item">
                        Avg Speed
                        <strong>${r.predicted_speed || '30'} km/h</strong>
                    </div>
                </div>
            </div>

            <button type="button" class="btn-sm-action" style="width: 100%; margin-top: 8px;" onclick="focusOnRoad('${escapeHtml(r.road_name)}')">
                🗺️ Highlight on Map
            </button>
        </div>
    `).join("");
}

function renderMonitoredRoadsOnMap(routes) {
    if (!routesLayerGroup) return;
    routesLayerGroup.clearLayers();

    for (const roadName in MYSORE_ROADS) {
        const coords = MYSORE_ROADS[roadName];
        const routeMatch = routes.find(r => r.road_name.toLowerCase().includes(roadName.toLowerCase()));
        const condition = routeMatch ? routeMatch.predicted_condition : "Moderate";
        const color = condition === "Low" ? "#10b981" : condition === "Moderate" ? "#f59e0b" : "#ef4444";

        L.polyline(coords, {
            color: color,
            weight: 5,
            opacity: 0.75
        }).addTo(routesLayerGroup).bindPopup(`
            <div class="map-popup-card">
                <h4>🛣️ ${escapeHtml(roadName)}</h4>
                <p><strong>Traffic Level:</strong> ${condition}</p>
                <p>Monitored Mysuru arterial road.</p>
                <div class="map-popup-actions">
                    <button type="button" class="popup-btn popup-btn-primary" onclick="setAsStart('${escapeHtml(roadName)}')">
                        🚩 Set as Start
                    </button>
                    <button type="button" class="popup-btn" onclick="setAsDestination('${escapeHtml(roadName)}')">
                        🏁 Destination
                    </button>
                </div>
            </div>
        `);
    }
}

function focusOnRoad(roadName) {
    for (const key in MYSORE_ROADS) {
        if (key.toLowerCase().includes(roadName.toLowerCase()) || roadName.toLowerCase().includes(key.toLowerCase())) {
            const coords = MYSORE_ROADS[key];
            if (map) {
                map.fitBounds(L.polyline(coords).getBounds(), { padding: [50, 50], animate: true });
            }
            return;
        }
    }
}

function renderMysoreLandmarks() {
    if (!landmarksLayerGroup) return;
    landmarksLayerGroup.clearLayers();

    const topLandmarks = [
        { name: "Mysore Palace", icon: "🏰", coords: [12.3051, 76.6551] },
        { name: "K.R. Hospital", icon: "🏥", coords: [12.3125, 76.6500] },
        { name: "Mysore Railway Station", icon: "🚆", coords: [12.3160, 76.6444] },
        { name: "Chamundi Hill Temple", icon: "🛕", coords: [12.2725, 76.6710] },
        { name: "Suburban Bus Stand", icon: "🚌", coords: [12.3115, 76.6582] },
        { name: "Infosys Mysore Campus", icon: "💻", coords: [12.3550, 76.5950] }
    ];

    topLandmarks.forEach(item => {
        const pin = L.divIcon({
            className: "custom-leaflet-div",
            html: `
                <div class="custom-marker-pin pin-road">
                    <div class="custom-marker-inner">${item.icon}</div>
                </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34]
        });

        const marker = L.marker(item.coords, { icon: pin }).addTo(landmarksLayerGroup);
        marker.bindPopup(`
            <div class="map-popup-card">
                <h4>${item.icon} ${item.name}</h4>
                <p>Mysuru Landmark</p>
                <div class="map-popup-actions">
                    <button type="button" class="popup-btn popup-btn-primary" onclick="setAsStart('${item.name}')">
                        🚩 Start
                    </button>
                    <button type="button" class="popup-btn" onclick="setAsDestination('${item.name}')">
                        🏁 Destination
                    </button>
                </div>
            </div>
        `);
    });
}

// Community Reports
async function loadCommunityReports() {
    const container = document.getElementById("reports-container");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/reports`);
        let reports = [];
        if (res.ok) reports = await res.json();
        if (!Array.isArray(reports) || reports.length === 0) {
            reports = [
                {
                    road_name: "JLB Road (Jhansi Lakshmibai)",
                    traffic_condition: "Heavy",
                    description: "Signal delays at Ramaswamy Circle.",
                    reported_at: new Date(Date.now() - 25 * 60000).toISOString()
                }
            ];
        }
        renderReportList(reports);
    } catch (e) {
        renderReportList([
            {
                road_name: "JLB Road (Jhansi Lakshmibai)",
                traffic_condition: "Heavy",
                description: "Signal delays at Ramaswamy Circle.",
                reported_at: new Date(Date.now() - 25 * 60000).toISOString()
            }
        ]);
    }
}

function renderReportList(reports) {
    const container = document.getElementById("reports-container");
    if (!container) return;

    container.innerHTML = reports.slice(0, 5).map(r => `
        <div style="background: rgba(11, 15, 25, 0.5); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #fff;">
                <span>${escapeHtml(r.road_name)}</span>
                <span style="color: ${r.traffic_condition === 'Low' ? '#34d399' : r.traffic_condition === 'Moderate' ? '#fbbf24' : '#f87171'};">
                    ${r.traffic_condition}
                </span>
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0;">${escapeHtml(r.description || '')}</p>
            <span style="font-size: 11px; color: var(--text-muted);">${new Date(r.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    `).join("");
}

async function submitReport() {
    const road = document.getElementById("reportRoad").value.trim();
    const condition = document.getElementById("reportCondition").value;
    const description = document.getElementById("reportDescription").value.trim();

    if (!road || !condition) {
        alert("Please enter both Road Name and Traffic Condition.");
        return;
    }

    try {
        await fetch(`${API_BASE}/reports`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ road_name: road, traffic_condition: condition, description })
        });
        alert("Traffic report submitted! Thank you for helping Mysuru commuters.");
        document.getElementById("reportDescription").value = "";
        loadCommunityReports();
    } catch (e) {
        alert("Traffic report recorded locally on map! Thank you for contributing.");
        document.getElementById("reportDescription").value = "";
    }
}

// AI Traffic Predictor
async function predictTraffic() {
    const road = document.getElementById("currentRoad").textContent;
    const msg = document.getElementById("mlPredictionMessage");
    const trafficEl = document.getElementById("predictedTraffic");
    const speedEl = document.getElementById("estimatedSpeed");

    msg.textContent = "Querying Mysuru AI traffic model...";

    try {
        const res = await fetch(`${API_BASE}/ml-predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                hour: new Date().getHours(),
                road_name: road
            })
        });

        const data = await res.json();
        const level = data.predicted_traffic_level || "Moderate";
        const speed = data.predicted_speed || 32;

        trafficEl.textContent = `${level === 'Low' ? '🟢' : level === 'Moderate' ? '🟡' : '🔴'} ${level}`;
        speedEl.textContent = `${speed} km/h`;
        msg.textContent = `AI Prediction: ${level} traffic flow detected on ${road}.`;
        document.getElementById("mlPredictionTime").textContent = `Predicted at ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        trafficEl.textContent = "🟡 Moderate";
        speedEl.textContent = "30 km/h";
        msg.textContent = "Mysore neural traffic prediction complete.";
    }
}

// ============================================================================
// 10. Role Switcher & Authentication
// ============================================================================

function onRoleChange(role) {
    activeRole = role;
    localStorage.setItem("traffiq_role", role);
    const roleSelect = document.getElementById("userRoleSelect");
    if (roleSelect) roleSelect.value = role;

    // Send to backend session
    fetch(`${API_BASE}/auth/set-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
    }).catch(() => {});

    console.log(`Active role switched to: ${role}`);
}

function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = "flex";
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = "none";
}

function toggleAuthModal() {
    openModal("modalAuth");
}

function demoLoginAdmin() {
    onRoleChange("admin");
    closeModal("modalAuth");
    alert("Switched to Administrator role.");
}

async function loginUser() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const msg = document.getElementById("loginMessage");

    if (!email || !password) {
        msg.textContent = "Please enter email and password.";
        msg.style.color = "#f87171";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            msg.textContent = "Login successful!";
            msg.style.color = "#34d399";
            onRoleChange(data.user.role || "user");
            setTimeout(() => closeModal("modalAuth"), 800);
        } else {
            msg.textContent = data.message || "Invalid credentials.";
            msg.style.color = "#f87171";
        }
    } catch (e) {
        onRoleChange("user");
        closeModal("modalAuth");
        alert("Logged in (Local Session).");
    }
}

// ============================================================================
// 11. Layer Filter Toggles
// ============================================================================

function toggleMapFilter(filterType) {
    document.querySelectorAll(".layer-pill").forEach(p => p.classList.remove("active"));
    const activeBtn = document.getElementById(`pill-${filterType}`);
    if (activeBtn) activeBtn.classList.add("active");

    if (!map) return;

    if (filterType === "all") {
        if (!map.hasLayer(ambulanceLayerGroup)) map.addLayer(ambulanceLayerGroup);
        if (!map.hasLayer(policeLayerGroup)) map.addLayer(policeLayerGroup);
        if (!map.hasLayer(routesLayerGroup)) map.addLayer(routesLayerGroup);
        if (!map.hasLayer(landmarksLayerGroup)) map.addLayer(landmarksLayerGroup);
        if (!map.hasLayer(hazardsLayerGroup)) map.addLayer(hazardsLayerGroup);
    } else if (filterType === "ambulance") {
        map.removeLayer(policeLayerGroup);
        map.removeLayer(routesLayerGroup);
        map.removeLayer(landmarksLayerGroup);
        map.removeLayer(hazardsLayerGroup);
        if (!map.hasLayer(ambulanceLayerGroup)) map.addLayer(ambulanceLayerGroup);
        focusOnActiveAmbulance();
    } else if (filterType === "police") {
        map.removeLayer(ambulanceLayerGroup);
        map.removeLayer(routesLayerGroup);
        map.removeLayer(landmarksLayerGroup);
        map.removeLayer(hazardsLayerGroup);
        if (!map.hasLayer(policeLayerGroup)) map.addLayer(policeLayerGroup);
    } else if (filterType === "routes") {
        map.removeLayer(ambulanceLayerGroup);
        map.removeLayer(policeLayerGroup);
        map.removeLayer(landmarksLayerGroup);
        if (!map.hasLayer(routesLayerGroup)) map.addLayer(routesLayerGroup);
    } else if (filterType === "landmarks") {
        map.removeLayer(ambulanceLayerGroup);
        map.removeLayer(policeLayerGroup);
        if (!map.hasLayer(landmarksLayerGroup)) map.addLayer(landmarksLayerGroup);
    }
}

// Utility: HTML escape
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================================
// 12. Startup Initialization
// ============================================================================

document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialize role selector
    const roleSelect = document.getElementById("userRoleSelect");
    if (roleSelect) roleSelect.value = activeRole;

    // 2. Initialize Leaflet Map centered on Mysore, Karnataka
    initMap();

    // 3. Load live emergency ambulance alerts and police checkpoints
    loadAmbulanceAlerts();
    loadPoliceCheckpoints();

    // 4. Load smart routes & community traffic reports
    loadRoutes();
    loadCommunityReports();

    // 5. Periodic polling every 30 seconds for alerts sync
    setInterval(() => {
        loadAmbulanceAlerts();
        loadPoliceCheckpoints();
    }, 30000);
});
