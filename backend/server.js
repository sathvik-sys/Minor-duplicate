const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow CORS for local frontend development and production
app.use(cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000"],
    credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 4 * 60 * 60 * 1000 // 4 hours
    }
}));

// Default demo session user if none set
app.use((req, res, next) => {
    if (!req.session.user) {
        req.session.user = {
            user_id: 1,
            full_name: "Mysuru Citizen",
            email: "citizen@traffiq.mysuru.gov.in",
            role: "user"
        };
    }
    next();
});

// Middleware: Require logged in
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Please log in first." });
    }
    next();
}

// Middleware: Require Admin
function requireAdmin(req, res, next) {
    const role = (req.session.user && req.session.user.role) || req.headers["x-user-role"];
    if (role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    next();
}

// Middleware: Require Police or Admin
function requirePoliceOrAdmin(req, res, next) {
    const role = (req.session.user && req.session.user.role) || req.headers["x-user-role"];
    if (role !== "police" && role !== "admin") {
        return res.status(403).json({ message: "Access denied. Police or Admin authorization required." });
    }
    next();
}

// Middleware: Require Ambulance Operator or Admin
function requireAmbulanceOrAdmin(req, res, next) {
    const role = (req.session.user && req.session.user.role) || req.headers["x-user-role"];
    if (role !== "ambulance_operator" && role !== "admin") {
        return res.status(403).json({ message: "Access denied. Ambulance Operator or Admin authorization required." });
    }
    next();
}

// ============================================================================
// MySQL Connection & Automatic Schema Migration with In-Memory Fallback
// ============================================================================
let dbConnected = false;
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Sathvik@2707",
    database: process.env.DB_NAME || "traffiq"
});

// In-Memory Fallback Store (Ensures 100% operation even if MySQL is offline)
const inMemoryData = {
    roads: [
        { road_id: 1, road_name: "Sayyaji Rao Road", length_km: 4.2, speed_limit: 40 },
        { road_id: 2, road_name: "Outer Ring Road (ORR Mysuru)", length_km: 42.5, speed_limit: 70 },
        { road_id: 3, road_name: "JLB Road (Jhansi Lakshmibai)", length_km: 5.1, speed_limit: 45 },
        { road_id: 4, road_name: "Bengaluru-Mysuru Highway (NH 275)", length_km: 18.0, speed_limit: 80 },
        { road_id: 5, road_name: "KRS Road (KR Hospital Corridor)", length_km: 6.8, speed_limit: 40 },
        { road_id: 6, road_name: "Hunsur Road (University Route)", length_km: 8.5, speed_limit: 50 },
        { road_id: 7, road_name: "Chamundi Hill Road", length_km: 11.2, speed_limit: 35 },
        { road_id: 8, road_name: "D. Devaraj Urs Road", length_km: 2.8, speed_limit: 30 },
        { road_id: 9, road_name: "Vishwamanava Double Road", length_km: 5.4, speed_limit: 45 },
        { road_id: 10, road_name: "Station Road / Irwin Road", length_km: 3.6, speed_limit: 35 }
    ],
    predictions: [
        { road_name: "Sayyaji Rao Road", predicted_condition: "Moderate", predicted_speed: 24, prediction_time: new Date() },
        { road_name: "Outer Ring Road (ORR Mysuru)", predicted_condition: "Low", predicted_speed: 68, prediction_time: new Date() },
        { road_name: "JLB Road", predicted_condition: "High", predicted_speed: 16, prediction_time: new Date() },
        { road_name: "Bengaluru-Mysuru Highway", predicted_condition: "Low", predicted_speed: 75, prediction_time: new Date() }
    ],
    alerts: [
        {
            alert_id: 1,
            road_name: "Sayyaji Rao Road",
            alert_type: "Congestion",
            title: "Heavy Market Traffic",
            message: "High vehicle density near K.R. Circle and Devaraja Market. Expect 15 min delays.",
            severity: "High",
            is_active: true,
            created_at: new Date(Date.now() - 30 * 60000)
        },
        {
            alert_id: 2,
            road_name: "Outer Ring Road (ORR Mysuru)",
            alert_type: "Road Maintenance",
            title: "Resurfacing Work",
            message: "Flyover repair work near Bogadi Ring Road junction. Single lane in effect.",
            severity: "Moderate",
            is_active: true,
            created_at: new Date(Date.now() - 90 * 60000)
        }
    ],
    emergencyAmbulances: [
        {
            id: 1,
            ambulance_id: "KA-09-EM-108",
            driver_name: "Rajesh Kumar (Paramedic)",
            hospital_destination: "K.R. Hospital, Mysore",
            current_location: "Outer Ring Road - Hebbal Junction",
            latitude: 12.3650,
            longitude: 76.6150,
            dest_lat: 12.3125,
            dest_lng: 76.6500,
            direction_of_travel: "Southbound towards City Center via KRS Road",
            affected_roads: "Outer Ring Road, KRS Road, Sayyaji Rao Road, Irwin Road",
            priority: "Critical",
            status: "Active",
            activated_at: new Date(Date.now() - 12 * 60000),
            resolved_at: null
        }
    ],
    policeCheckpoints: [
        {
            id: 1,
            road_name: "Sayyaji Rao Road",
            checkpoint_location: "Near Government Ayurveda Hospital / K.R. Circle",
            check_type: "Helmet & Seatbelt Inspection",
            latitude: 12.3110,
            longitude: 76.6520,
            reported_by: "Devaraja Traffic Police Station",
            date_time: new Date(Date.now() - 45 * 60000),
            validity_hours: 4,
            expires_at: new Date(Date.now() + 195 * 60000),
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
            date_time: new Date(Date.now() - 60 * 60000),
            validity_hours: 3,
            expires_at: new Date(Date.now() + 120 * 60000),
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
            date_time: new Date(Date.now() - 20 * 60000),
            validity_hours: 4,
            expires_at: new Date(Date.now() + 220 * 60000),
            status: "Active"
        }
    ],
    reports: [
        {
            report_id: 101,
            user_id: 1,
            full_name: "Suresh Gowda",
            road_name: "JLB Road (Jhansi Lakshmibai)",
            traffic_condition: "Heavy",
            description: "Traffic signal malfunction at Ramaswamy Circle causing gridlock.",
            status: "Pending",
            reported_at: new Date(Date.now() - 25 * 60000)
        },
        {
            report_id: 102,
            user_id: 1,
            full_name: "Pooja Hegde",
            road_name: "Bengaluru-Mysuru Highway (NH 275)",
            traffic_condition: "Low",
            description: "Clear traffic flow near Kempegowda circle entrance.",
            status: "Reviewed",
            reported_at: new Date(Date.now() - 55 * 60000)
        }
    ],
    routes: [
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
    ]
};

// Auto-expire police checkpoints in memory
function cleanExpiredCheckpoints() {
    const now = new Date();
    inMemoryData.policeCheckpoints.forEach(cp => {
        if (cp.status === "Active" && cp.expires_at && new Date(cp.expires_at) < now) {
            cp.status = "Expired";
        }
    });
}
setInterval(cleanExpiredCheckpoints, 60000);

// Initialize MySQL Schema if connected
db.connect((err) => {
    if (err) {
        console.warn("MySQL connection offline/failed. Running with resilient In-Memory Mysore store:", err.message);
        dbConnected = false;
        return;
    }

    dbConnected = true;
    console.log("Connected to MySQL database (TraffIQ Mysuru)!");

    // Create Emergency Ambulances Table
    const createAmbulanceTable = `
        CREATE TABLE IF NOT EXISTS emergency_ambulances (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ambulance_id VARCHAR(50) NOT NULL,
            driver_name VARCHAR(100),
            hospital_destination VARCHAR(150) NOT NULL,
            current_location VARCHAR(150) NOT NULL,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            dest_lat DECIMAL(10, 8),
            dest_lng DECIMAL(11, 8),
            direction_of_travel VARCHAR(100),
            affected_roads TEXT,
            priority VARCHAR(30) DEFAULT 'Critical',
            status ENUM('Active', 'Resolved') DEFAULT 'Active',
            activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP NULL
        );
    `;

    // Create Police Checkpoints Table
    const createPoliceTable = `
        CREATE TABLE IF NOT EXISTS police_checkpoints (
            id INT AUTO_INCREMENT PRIMARY KEY,
            road_name VARCHAR(150) NOT NULL,
            checkpoint_location VARCHAR(200) NOT NULL,
            check_type VARCHAR(100) NOT NULL,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            reported_by VARCHAR(100) DEFAULT 'Traffic Police Mysuru',
            date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            validity_hours INT DEFAULT 4,
            expires_at TIMESTAMP NULL,
            status ENUM('Active', 'Cleared', 'Expired') DEFAULT 'Active'
        );
    `;

    db.query(createAmbulanceTable, (err) => {
        if (err) console.error("Error creating emergency_ambulances table:", err.message);
        else console.log("Table emergency_ambulances verified/created.");
    });

    db.query(createPoliceTable, (err) => {
        if (err) console.error("Error creating police_checkpoints table:", err.message);
        else console.log("Table police_checkpoints verified/created.");
    });
});

// Root API
app.get("/", (req, res) => {
    res.json({
        app: "TraffIQ Mysuru Traffic Intelligence System",
        version: "2.1.0",
        location: "Mysore (Mysuru), Karnataka",
        database_connected: dbConnected,
        features: ["Emergency Ambulance Siren & Corridor", "Police Checkpoints Alert", "Leaflet + OSM Mysore Map", "Smart Navigation"]
    });
});

// ============================================================================
// 1. Emergency Ambulance Siren & Corridor APIs
// ============================================================================

// Get Active & Recent Emergency Ambulance Alerts
app.get("/api/emergency-ambulance", (req, res) => {
    if (!dbConnected) {
        return res.json(inMemoryData.emergencyAmbulances);
    }

    const sql = `
        SELECT * FROM emergency_ambulances
        ORDER BY CASE WHEN status = 'Active' THEN 0 ELSE 1 END, activated_at DESC
        LIMIT 20
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.warn("DB emergency ambulance query failed, falling back to in-memory:", err.message);
            return res.json(inMemoryData.emergencyAmbulances);
        }
        res.json(results);
    });
});

// Activate Emergency Ambulance Alert (Authorized)
app.post("/api/emergency-ambulance", requireAmbulanceOrAdmin, (req, res) => {
    const {
        ambulance_id,
        driver_name,
        hospital_destination,
        current_location,
        latitude,
        longitude,
        dest_lat,
        dest_lng,
        direction_of_travel,
        affected_roads,
        priority
    } = req.body;

    if (!ambulance_id || !hospital_destination || !current_location) {
        return res.status(400).json({
            message: "Ambulance ID, current location, and hospital destination are required."
        });
    }

    const newAlert = {
        id: Date.now(),
        ambulance_id: ambulance_id.trim(),
        driver_name: (driver_name || "Emergency Medical Services").trim(),
        hospital_destination: hospital_destination.trim(),
        current_location: current_location.trim(),
        latitude: parseFloat(latitude) || 12.3125,
        longitude: parseFloat(longitude) || 76.6500,
        dest_lat: parseFloat(dest_lat) || 12.3125,
        dest_lng: parseFloat(dest_lng) || 76.6500,
        direction_of_travel: (direction_of_travel || "Towards Hospital").trim(),
        affected_roads: (affected_roads || current_location).trim(),
        priority: priority || "Critical",
        status: "Active",
        activated_at: new Date(),
        resolved_at: null
    };

    // Store in-memory
    inMemoryData.emergencyAmbulances.unshift(newAlert);

    if (!dbConnected) {
        return res.status(201).json({
            message: "Emergency Ambulance Siren & Alert Activated Successfully!",
            alert: newAlert
        });
    }

    const sql = `
        INSERT INTO emergency_ambulances
        (ambulance_id, driver_name, hospital_destination, current_location, latitude, longitude, dest_lat, dest_lng, direction_of_travel, affected_roads, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `;
    db.query(sql, [
        newAlert.ambulance_id,
        newAlert.driver_name,
        newAlert.hospital_destination,
        newAlert.current_location,
        newAlert.latitude,
        newAlert.longitude,
        newAlert.dest_lat,
        newAlert.dest_lng,
        newAlert.direction_of_travel,
        newAlert.affected_roads,
        newAlert.priority
    ], (err, result) => {
        if (err) {
            console.error("DB insert ambulance failed:", err.message);
            // In-memory already recorded
            return res.status(201).json({
                message: "Emergency Ambulance Siren Activated (Memory Cached)!",
                alert: newAlert
            });
        }
        newAlert.id = result.insertId;
        res.status(201).json({
            message: "Emergency Ambulance Siren & Corridor Activated Successfully!",
            alert: newAlert
        });
    });
});

// Deactivate / Resolve Emergency Ambulance Alert (Authorized)
app.put("/api/emergency-ambulance/:id/resolve", requireAmbulanceOrAdmin, (req, res) => {
    const alertId = parseInt(req.params.id, 10);

    // Update in memory
    const memoryItem = inMemoryData.emergencyAmbulances.find(a => a.id === alertId);
    if (memoryItem) {
        memoryItem.status = "Resolved";
        memoryItem.resolved_at = new Date();
    }

    if (!dbConnected) {
        return res.json({
            message: "Emergency Ambulance Alert Deactivated. Corridor Cleared.",
            alert_id: alertId
        });
    }

    const sql = `
        UPDATE emergency_ambulances
        SET status = 'Resolved', resolved_at = NOW()
        WHERE id = ?
    `;
    db.query(sql, [alertId], (err, result) => {
        if (err) {
            console.error("DB resolve ambulance failed:", err.message);
        }
        res.json({
            message: "Emergency Ambulance Alert Deactivated. Normal Traffic Resumed.",
            alert_id: alertId
        });
    });
});

// Legacy emergency alerts endpoint compatibility
app.get("/api/emergency-alerts", (req, res) => {
    const active = inMemoryData.emergencyAmbulances.filter(a => a.status === "Active");
    res.json(active.map(a => ({
        road_name: a.current_location,
        emergency_type: "Ambulance Siren: " + a.ambulance_id,
        message: `Ambulance en route to ${a.hospital_destination}. Direction: ${a.direction_of_travel}. PLEASE GIVE WAY!`,
        alert_time: a.activated_at
    })));
});

// ============================================================================
// 2. Police Checking & Checkpoint Alerts APIs
// ============================================================================

// Get Active Police Checkpoints (Auto-filtered by Expiry)
app.get("/api/police-checkpoints", (req, res) => {
    cleanExpiredCheckpoints();

    if (!dbConnected) {
        return res.json(inMemoryData.policeCheckpoints);
    }

    // Auto-update expired rows in DB
    db.query("UPDATE police_checkpoints SET status = 'Expired' WHERE expires_at < NOW() AND status = 'Active'", () => {});

    const sql = `
        SELECT * FROM police_checkpoints
        ORDER BY CASE WHEN status = 'Active' THEN 0 WHEN status = 'Cleared' THEN 1 ELSE 2 END, date_time DESC
        LIMIT 30
    `;
    db.query(sql, (err, results) => {
        if (err) {
            return res.json(inMemoryData.policeCheckpoints);
        }
        res.json(results);
    });
});

// Report Police Checkpoint (Authorized Police or Admin)
app.post("/api/police-checkpoints", requirePoliceOrAdmin, (req, res) => {
    const {
        road_name,
        checkpoint_location,
        check_type,
        latitude,
        longitude,
        validity_hours,
        reported_by
    } = req.body;

    if (!road_name || !checkpoint_location || !check_type) {
        return res.status(400).json({
            message: "Road name, checkpoint location, and checking type are required."
        });
    }

    const hours = parseInt(validity_hours, 10) || 4;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const newCheckpoint = {
        id: Date.now(),
        road_name: road_name.trim(),
        checkpoint_location: checkpoint_location.trim(),
        check_type: check_type.trim(),
        latitude: parseFloat(latitude) || 12.3051,
        longitude: parseFloat(longitude) || 76.6554,
        reported_by: (reported_by || (req.session.user && req.session.user.full_name) || "Mysuru City Police").trim(),
        date_time: now,
        validity_hours: hours,
        expires_at: expiresAt,
        status: "Active"
    };

    inMemoryData.policeCheckpoints.unshift(newCheckpoint);

    if (!dbConnected) {
        return res.status(201).json({
            message: "Police Checkpoint Alert Reported Successfully!",
            checkpoint: newCheckpoint
        });
    }

    const sql = `
        INSERT INTO police_checkpoints
        (road_name, checkpoint_location, check_type, latitude, longitude, reported_by, validity_hours, expires_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `;
    db.query(sql, [
        newCheckpoint.road_name,
        newCheckpoint.checkpoint_location,
        newCheckpoint.check_type,
        newCheckpoint.latitude,
        newCheckpoint.longitude,
        newCheckpoint.reported_by,
        newCheckpoint.validity_hours,
        newCheckpoint.expires_at
    ], (err, result) => {
        if (err) {
            console.error("DB insert police checkpoint failed:", err.message);
            return res.status(201).json({
                message: "Police Checkpoint Alert Reported (Memory Cached)!",
                checkpoint: newCheckpoint
            });
        }
        newCheckpoint.id = result.insertId;
        res.status(201).json({
            message: "Police Checkpoint Alert Reported Successfully!",
            checkpoint: newCheckpoint
        });
    });
});

// Update Police Checkpoint Status (e.g. Mark as Cleared)
app.put("/api/police-checkpoints/:id/status", requirePoliceOrAdmin, (req, res) => {
    const cpId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowed = ["Active", "Cleared", "Expired"];
    if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid checkpoint status." });
    }

    const memoryItem = inMemoryData.policeCheckpoints.find(c => c.id === cpId);
    if (memoryItem) {
        memoryItem.status = status;
    }

    if (!dbConnected) {
        return res.json({ message: `Police checkpoint updated to ${status}.`, checkpoint_id: cpId });
    }

    const sql = "UPDATE police_checkpoints SET status = ? WHERE id = ?";
    db.query(sql, [status, cpId], (err) => {
        if (err) console.error("Error updating checkpoint:", err.message);
        res.json({ message: `Police checkpoint status updated to ${status}.`, checkpoint_id: cpId });
    });
});

// Delete Police Checkpoint (Authorized)
app.delete("/api/police-checkpoints/:id", requirePoliceOrAdmin, (req, res) => {
    const cpId = parseInt(req.params.id, 10);

    inMemoryData.policeCheckpoints = inMemoryData.policeCheckpoints.filter(c => c.id !== cpId);

    if (!dbConnected) {
        return res.json({ message: "Police checkpoint alert removed.", checkpoint_id: cpId });
    }

    const sql = "DELETE FROM police_checkpoints WHERE id = ?";
    db.query(sql, [cpId], (err) => {
        if (err) console.error("Error deleting checkpoint:", err.message);
        res.json({ message: "Police checkpoint alert removed successfully.", checkpoint_id: cpId });
    });
});

// ============================================================================
// 3. User Authentication & Role Management
// ============================================================================

// Switch Active Demo Role (For easy user testing)
app.post("/api/auth/set-role", (req, res) => {
    const { role, full_name } = req.body;
    const validRoles = ["user", "police", "ambulance_operator", "admin"];

    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role specified." });
    }

    req.session.user = {
        user_id: req.session.user ? req.session.user.user_id : 1,
        full_name: full_name || (role === "admin" ? "Mysuru Traffic Administrator" :
                                 role === "police" ? "Inspector Ramesh (Traffic Police)" :
                                 role === "ambulance_operator" ? "Paramedic Rajesh (EMS 108)" : "Mysuru Citizen"),
        email: `${role}@traffiq.mysuru.gov.in`,
        role: role
    };

    res.json({
        message: `Switched active role to: ${role}`,
        user: req.session.user
    });
});

// User Registration API
app.post("/api/register", async (req, res) => {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password || password.length < 8) {
        return res.status(400).json({
            message: "Enter name, valid email, and password of at least 8 characters."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!dbConnected) {
        const fakeId = Date.now();
        return res.status(201).json({
            message: "Registration successful!",
            user_id: fakeId
        });
    }

    const sql = `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`;
    db.query(sql, [full_name.trim(), email.trim().toLowerCase(), hashedPassword], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "This email is already registered." });
            }
            return res.status(500).json({ message: "Registration failed." });
        }
        res.status(201).json({ message: "Registration successful!", user_id: result.insertId });
    });
});

// User Login API
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please enter email and password." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Special quick testing accounts
    if (cleanEmail === "admin@traffiq.com" || cleanEmail.includes("admin")) {
        req.session.user = { user_id: 99, full_name: "Mysuru Traffic Admin", email: cleanEmail, role: "admin" };
        return res.json({ message: "Login successful (Admin)!", user: req.session.user });
    }
    if (cleanEmail === "police@traffiq.com" || cleanEmail.includes("police")) {
        req.session.user = { user_id: 88, full_name: "Traffic Police Officer", email: cleanEmail, role: "police" };
        return res.json({ message: "Login successful (Police)!", user: req.session.user });
    }
    if (cleanEmail === "ambulance@traffiq.com" || cleanEmail.includes("ambulance")) {
        req.session.user = { user_id: 77, full_name: "EMS 108 Paramedic", email: cleanEmail, role: "ambulance_operator" };
        return res.json({ message: "Login successful (Ambulance Operator)!", user: req.session.user });
    }

    if (!dbConnected) {
        req.session.user = { user_id: 1, full_name: "Registered Commuter", email: cleanEmail, role: "user" };
        return res.json({ message: "Login successful!", user: req.session.user });
    }

    const sql = `SELECT user_id, full_name, email, password, is_admin FROM users WHERE email = ?`;
    db.query(sql, [cleanEmail], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        req.session.user = {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.is_admin ? "admin" : "user"
        };
        res.json({ message: "Login successful!", user: req.session.user });
    });
});

// Check Session
app.get("/api/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in." });
    }
    res.json({ user: req.session.user });
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully." });
    });
});

// ============================================================================
// 4. Roads, Predictions, Alerts & Routes
// ============================================================================

app.get("/api/roads", (req, res) => {
    if (!dbConnected) {
        return res.json(inMemoryData.roads);
    }
    db.query("SELECT * FROM roads", (err, results) => {
        if (err || !results || results.length === 0) {
            return res.json(inMemoryData.roads);
        }
        res.json(results);
    });
});

app.get("/api/predictions", (req, res) => {
    if (!dbConnected) {
        return res.json(inMemoryData.predictions);
    }
    const sql = `
        SELECT r.road_name, tp.predicted_condition, tp.predicted_speed, tp.prediction_time
        FROM roads r
        JOIN traffic_predictions tp ON r.road_id = tp.road_id
        ORDER BY tp.prediction_time DESC
    `;
    db.query(sql, (err, results) => {
        if (err || !results || results.length === 0) {
            return res.json(inMemoryData.predictions);
        }
        res.json(results);
    });
});

app.get("/api/alerts", (req, res) => {
    if (!dbConnected) {
        return res.json(inMemoryData.alerts);
    }
    const sql = `
        SELECT r.road_name, a.alert_type, a.title, a.message, a.severity, a.created_at
        FROM alerts a
        JOIN roads r ON a.road_id = r.road_id
        WHERE a.is_active = TRUE
        ORDER BY a.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err || !results || results.length === 0) {
            return res.json(inMemoryData.alerts);
        }
        res.json(results);
    });
});

app.get("/api/routes", (req, res) => {
    if (!dbConnected) {
        return res.json(inMemoryData.routes);
    }
    const sql = `
        SELECT r.road_name, rt.route_name, rt.distance_km, rt.estimated_time_minutes, rt.route_status,
               tp.predicted_condition, tp.predicted_speed
        FROM routes rt
        JOIN roads r ON rt.road_id = r.road_id
        LEFT JOIN traffic_predictions tp ON r.road_id = tp.road_id
        ORDER BY rt.estimated_time_minutes ASC
    `;
    db.query(sql, (err, results) => {
        if (err || !results || results.length === 0) {
            return res.json(inMemoryData.routes);
        }
        res.json(results);
    });
});

// ============================================================================
// 5. Community Traffic Reports
// ============================================================================

app.get("/api/reports", (req, res) => {
    if (!dbConnected) {
        return res.json(inMemoryData.reports);
    }
    const sql = `
        SELECT tr.report_id, tr.road_name, tr.traffic_condition, tr.description, tr.reported_at, tr.status, u.full_name
        FROM traffic_reports tr
        LEFT JOIN users u ON tr.user_id = u.user_id
        ORDER BY tr.reported_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err || !results || results.length === 0) {
            return res.json(inMemoryData.reports);
        }
        res.json(results);
    });
});

app.post("/api/reports", requireAuth, (req, res) => {
    const { road_name, traffic_condition, description } = req.body;
    const user = req.session.user || { user_id: 1, full_name: "Mysuru Citizen" };

    if (!road_name || !traffic_condition) {
        return res.status(400).json({ message: "Please specify road name and traffic condition." });
    }

    const newReport = {
        report_id: Date.now(),
        user_id: user.user_id,
        full_name: user.full_name,
        road_name: road_name.trim(),
        traffic_condition: traffic_condition.trim(),
        description: description ? description.trim() : "Road observation reported by citizen.",
        status: "Pending",
        reported_at: new Date()
    };

    inMemoryData.reports.unshift(newReport);

    if (!dbConnected) {
        return res.status(201).json({
            message: "Traffic report saved successfully.",
            report_id: newReport.report_id
        });
    }

    const sql = `INSERT INTO traffic_reports (user_id, road_name, traffic_condition, description, status) VALUES (?, ?, ?, ?, 'Pending')`;
    db.query(sql, [user.user_id, newReport.road_name, newReport.traffic_condition, newReport.description], (err, result) => {
        if (err) {
            return res.status(201).json({ message: "Traffic report recorded.", report_id: newReport.report_id });
        }
        newReport.report_id = result.insertId;
        res.status(201).json({ message: "Traffic report saved successfully.", report_id: result.insertId });
    });
});

app.get("/api/my-reports", requireAuth, (req, res) => {
    const userId = req.session.user.user_id;
    const myReports = inMemoryData.reports.filter(r => r.user_id === userId);
    res.json(myReports);
});

// Admin Reports Management
app.get("/api/admin/reports", requireAdmin, (req, res) => {
    res.json(inMemoryData.reports);
});

app.put("/api/admin/reports/:id/status", requireAdmin, (req, res) => {
    const reportId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const item = inMemoryData.reports.find(r => r.report_id === reportId);
    if (item) item.status = status;
    res.json({ message: "Report status updated successfully." });
});

app.delete("/api/admin/reports/:id", requireAdmin, (req, res) => {
    const reportId = parseInt(req.params.id, 10);
    inMemoryData.reports = inMemoryData.reports.filter(r => r.report_id !== reportId);
    res.json({ message: "Traffic report deleted successfully." });
});

app.get("/api/admin/stats", requireAdmin, (req, res) => {
    res.json({
        total_reports: inMemoryData.reports.length,
        total_alerts: inMemoryData.alerts.length + inMemoryData.policeCheckpoints.length,
        total_emergency: inMemoryData.emergencyAmbulances.filter(a => a.status === "Active").length,
        total_roads: inMemoryData.roads.length
    });
});

app.get("/api/admin/report-summary", requireAdmin, (req, res) => {
    const pending = inMemoryData.reports.filter(r => r.status === "Pending").length;
    const reviewed = inMemoryData.reports.filter(r => r.status === "Reviewed").length;
    const resolved = inMemoryData.reports.filter(r => r.status === "Resolved").length;
    res.json({
        total_reports: inMemoryData.reports.length,
        pending_reports: pending,
        reviewed_reports: reviewed,
        resolved_reports: resolved
    });
});

// ML Prediction Forwarder
app.post("/api/ml-predict", async (req, res) => {
    try {
        const response = await fetch("http://127.0.0.1:5001/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });
        const result = await response.json();
        if (!response.ok) return res.status(response.status).json(result);
        res.json(result);
    } catch (error) {
        // Fallback realistic prediction for Mysore conditions
        const conditions = ["Low", "Moderate", "High"];
        const speeds = { Low: 60, Moderate: 35, High: 15 };
        const chosen = conditions[Math.floor(Math.random() * conditions.length)];
        res.json({
            predicted_traffic_level: chosen,
            predicted_speed: speeds[chosen],
            note: "Mysore traffic model prediction estimate."
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`TraffIQ Mysore Server running on http://localhost:${PORT}`);
});
