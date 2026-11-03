const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const crypto = require("crypto");
const cors = require("cors");


const app = express();
// TraffIQ ML API runs separately on port 5001
app.use(cors({
    origin: "http://localhost:5500",
    credentials: true
}));
app.use(express.json()); // Add this line to parse JSON request bodies
// Check whether user is logged in
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }

    next();
}

// Check whether logged-in user is an admin
function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admin privileges required."
        });
    }

    next();
}

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET ||
        crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 30 * 60 * 1000
    }
}));

const PORT = 5000;

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Sathvik@2707",
    database: "traffiq"
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.log("MySQL connection failed!");
        console.log(err.message);
        return;
    }

    console.log("MySQL connected successfully!");
});

app.get("/", (req, res) => {
    res.send("TraffIQ Backend is running!");
});

app.get("/api/roads", (req, res) => {
    const sql = "SELECT * FROM roads";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching roads:", err.message);

            return res.status(500).json({
                message: "Failed to fetch roads"
            });
        }

        res.json(results);
    });
});
app.get("/api/predictions", (req, res) => {
    const sql = `
        SELECT
            r.road_name,
            tp.predicted_condition,
            tp.predicted_speed,
            tp.prediction_time
        FROM roads r
        JOIN traffic_predictions tp
            ON r.road_id = tp.road_id
        ORDER BY tp.prediction_time DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching predictions:", err.message);

            return res.status(500).json({
                message: "Failed to fetch traffic predictions"
            });
        }

        res.json(results);
    });
});
app.get("/api/alerts", (req, res) => {
    const sql = `
        SELECT
            r.road_name,
            a.alert_type,
            a.title,
            a.message,
            a.severity,
            a.created_at
        FROM alerts a
        JOIN roads r
            ON a.road_id = r.road_id
        WHERE a.is_active = TRUE
        ORDER BY a.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching alerts:", err.message);

            return res.status(500).json({
                message: "Failed to fetch alerts"
            });
        }

        res.json(results);
    });
});

// User Registration API
app.post("/api/register", async (req, res) => {
    const { full_name, email, password } = req.body;

    // Validate input
    if (
        typeof full_name !== "string" ||
        !full_name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        password.length < 8
    ) {
        return res.status(400).json({
            message: "Enter your name, email, and a password of at least 8 characters."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
        INSERT INTO users (full_name, email, password)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [full_name.trim(), email.trim().toLowerCase(), hashedPassword],
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "This email is already registered."
                    });
                }

                console.error("Registration error:", err.message);

                return res.status(500).json({
                    message: "Registration failed."
                });
            }

            res.status(201).json({
                message: "Registration successful!",
                user_id: result.insertId
            });
        }
    );
});

// User Login API
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password
    ) {
        return res.status(400).json({
            message: "Please enter email and password."
        });
    }

    const sql = `
        SELECT user_id, full_name, email, password, is_admin
        FROM users
        WHERE email = ?
    `;

    db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
        if (err) {
            console.error("Login error:", err.message);

            return res.status(500).json({
                message: "Login failed."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = results[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }
        // Create authenticated user session
req.session.user = {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.is_admin ? "admin" : "user"
};

        res.json({
            message: "Login successful!",
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.is_admin ? "admin" : "user"
            }
        });
    });
});

// Check Logged-in User Session
app.get("/api/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    res.json({
        user: req.session.user
    });
});
// Protected Admin Test API
app.get("/api/admin/test", requireAdmin, (req, res) => {
    res.json({
        message: "Admin authorization successful!",
        admin: req.session.user.full_name
    });
});
// Admin Dashboard - Total Traffic Reports
// Admin Dashboard - Statistics
app.get("/api/admin/stats", requireAdmin, (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM traffic_reports) AS total_reports,
            (SELECT COUNT(*) FROM alerts) AS total_alerts,
            (SELECT COUNT(*) FROM emergency_alerts) AS total_emergency,
            (SELECT COUNT(*) FROM roads) AS total_roads
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Admin stats error:", err);

            return res.status(500).json({
                message: "Failed to load admin statistics."
            });
        }

        res.json(results[0]);
    });
});
// Admin - Report Status Summary
app.get("/api/admin/report-summary", requireAdmin, (req, res) => {

    const sql = `
        SELECT
            COUNT(*) AS total_reports,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_reports,
            SUM(CASE WHEN status = 'Reviewed' THEN 1 ELSE 0 END) AS reviewed_reports,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_reports
        FROM traffic_reports
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Report summary error:", err);

            return res.status(500).json({
                message: "Failed to load report summary."
            });
        }

        res.json(results[0]);
    });
});
// Admin Dashboard - Recent Traffic Reports
app.get("/api/admin/reports", requireAdmin, (req, res) => {

    const sql = `
    SELECT
        report_id,
        road_name,
        traffic_condition,
        description,
        reported_at,
        status
    FROM traffic_reports
    ORDER BY reported_at DESC
    LIMIT 10
`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Admin reports error:", err);

            return res.status(500).json({
                message: "Failed to load traffic reports."
            });
        }

        res.json(results);
    });
});
// User - View My Traffic Reports
app.get("/api/my-reports", requireAuth, (req, res) => {

    const userId = req.session.user.user_id;

    const sql = `
        SELECT
            report_id,
            road_name,
            traffic_condition,
            description,
            reported_at,
            status
        FROM traffic_reports
        WHERE user_id = ?
        ORDER BY reported_at DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("My reports error:", err);

            return res.status(500).json({
                message: "Failed to load your reports."
            });
        }

        res.json(results);
    });
});
// Admin - Update Traffic Report Status
app.put("/api/admin/reports/:id/status", requireAdmin, (req, res) => {

    const reportId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Reviewed", "Resolved"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid report status."
        });
    }

    const sql = `
        UPDATE traffic_reports
        SET status = ?
        WHERE report_id = ?
    `;

    db.query(sql, [status, reportId], (err, result) => {

        if (err) {
            console.error("Status update error:", err);

            return res.status(500).json({
                message: "Failed to update report status."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Traffic report not found."
            });
        }

        res.json({
            message: "Report status updated successfully."
        });
    });
});
// Admin - Delete Traffic Report
app.delete("/api/admin/reports/:id", requireAdmin, (req, res) => {

    const reportId = req.params.id;

    const sql = `
        DELETE FROM traffic_reports
        WHERE report_id = ?
    `;

    db.query(sql, [reportId], (err, result) => {

        if (err) {
            console.error("Delete report error:", err);

            return res.status(500).json({
                message: "Failed to delete traffic report."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Traffic report not found."
            });
        }

        res.json({
            message: "Traffic report deleted successfully."
        });
    });
});
// User Logout API
app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: "Logout failed."
            });
        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        });

        res.json({
            message: "Logged out successfully."
        });
    });
});
app.get("/api/reports", (req, res) => {
    const sql = `
        SELECT
            tr.report_id,
            tr.road_name,
            tr.traffic_condition,
            tr.description,
            tr.reported_at,
            u.full_name
        FROM traffic_reports tr
        LEFT JOIN users u
            ON tr.user_id = u.user_id
        ORDER BY tr.reported_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching reports:", err.message);

            return res.status(500).json({
                message: "Failed to fetch traffic reports"
            });
        }

        res.json(results);
    });
});



app.post("/api/reports", requireAuth, (req, res) => {
    const { road_name, traffic_condition, description } = req.body;

    // Get user ID from the logged-in session
    const user_id = req.session.user.user_id;

    // Validate road name
    if (
        typeof road_name !== "string" ||
        !road_name.trim() ||
        road_name.trim().length > 100
    ) {
        return res.status(400).json({
            message: "Please provide a valid road name (maximum 100 characters)."
        });
    }

    // Validate traffic condition
    if (
        typeof traffic_condition !== "string" ||
        !traffic_condition.trim()
    ) {
        return res.status(400).json({
            message: "Please select a valid traffic condition."
        });
    }

    // Validate description
    if (
        description !== undefined &&
        description !== null &&
        (typeof description !== "string" || description.length > 250)
    ) {
        return res.status(400).json({
            message: "Description must not exceed 250 characters."
        });
    }

    const sql = `
        INSERT INTO traffic_reports
        (user_id, road_name, traffic_condition, description)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        user_id,
        road_name.trim(),
        traffic_condition.trim(),
        description ? description.trim() : null
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error("Error saving traffic report:", error);

            return res.status(500).json({
                message: "Failed to save traffic report."
            });
        }

        res.status(201).json({
            message: "Traffic report saved successfully.",
            report_id: result.insertId
        });
    });
});


app.get("/api/routes", (req, res) => {
    const sql = `
        SELECT
            r.road_name,
            rt.route_name,
            rt.distance_km,
            rt.estimated_time_minutes,
            rt.route_status,
            tp.predicted_condition,
            tp.predicted_speed
        FROM routes rt
        JOIN roads r
            ON rt.road_id = r.road_id
        LEFT JOIN traffic_predictions tp
            ON r.road_id = tp.road_id
        ORDER BY
            CASE
                WHEN rt.route_status = 'Available' THEN 0
                ELSE 1
            END,
            CASE tp.predicted_condition
                WHEN 'Low' THEN 1
                WHEN 'Moderate' THEN 2
                WHEN 'High' THEN 3
                ELSE 4
            END,
            rt.estimated_time_minutes ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching routes:", err.message);

            return res.status(500).json({
                message: "Failed to fetch routes"
            });
        }

        res.json(results);
    });
});
app.get("/api/emergency-alerts", (req, res) => {
    const sql = `
        SELECT
            r.road_name,
            e.emergency_type,
            e.message,
            e.alert_time
        FROM emergency_alerts e
        JOIN roads r
            ON e.road_id = r.road_id
        WHERE e.is_active = TRUE
        ORDER BY e.alert_time DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(
                "Error fetching emergency alerts:",
                err.message
            );

            return res.status(500).json({
                message: "Failed to fetch emergency alerts"
            });
        }

        res.json(results);
    });
});



app.listen(PORT, () => {
    console.log(`TraffIQ server running on http://localhost:${PORT}`);
});

app.post("/api/ml-predict", async (req, res) => {
    try {
        const response = await fetch("http://127.0.0.1:5001/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        const result = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(result);
        }

        res.json(result);

    } catch (error) {
        console.error("ML prediction error:", error.message);

        res.status(503).json({
            error: "ML prediction service is unavailable. Make sure the Python ML API is running on port 5001."
        });
    }
});
