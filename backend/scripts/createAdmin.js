// Create an admin account. Credentials are never hard-coded:
//
//   ADMIN_NAME="Jane Doe" ADMIN_EMAIL=jane@yourdomain.com \
//   ADMIN_PASSWORD='a-long-unique-password1' node scripts/createAdmin.js
//
// Optional: ADMIN_USERNAME, ADMIN_ROLE (admin | superior_admin)

const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { validatePassword, validateEmail, normalizeEmail } = require("../utils/validation");

const createAdmin = async () => {
    try {
        const name = (process.env.ADMIN_NAME || "").trim();
        const email = normalizeEmail(process.env.ADMIN_EMAIL || "");
        const password = process.env.ADMIN_PASSWORD || "";
        const username = (process.env.ADMIN_USERNAME || "").trim() || null;
        const role = process.env.ADMIN_ROLE || "admin";

        if (!name || !email || !password) {
            throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD");
        }

        const problem =
            validateEmail(email) ||
            validatePassword(password) ||
            (!["admin", "superior_admin"].includes(role) ? "ADMIN_ROLE must be admin or superior_admin" : null);

        if (problem) {
            throw new Error(problem);
        }

        // Check if admin already exists
        const existingAdmin = await pool.query(
            "SELECT id FROM admins WHERE LOWER(email) = $1",
            [email]
        );

        if (existingAdmin.rows.length > 0) {
            console.log("Admin already exists");
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // The operator chose this email, so it is trusted as verified
        await pool.query(
            `INSERT INTO admins
            (name, email, username, password_hash, is_email_verified, admin_role)
            VALUES ($1, $2, $3, $4, TRUE, $5)`,
            [name, email, username, passwordHash, role]
        );

        console.log("Admin created successfully");
        console.log("Email:", email);

    } catch (error) {
        console.error("Error creating admin:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

createAdmin();
