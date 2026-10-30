const bcrypt = require("bcryptjs");
const { db } = require("../../prisma/db.mjs");

const {
    generateVerificationToken,
    hashToken
} = require("../../utils/tokenUtils");

const {
    sendInBackground,
    sendVerificationEmail,
    sendSignupAttemptEmail
} = require("../../services/emailService");

const {
    findAccountByEmail,
    isUsernameTaken
} = require("../../services/accountService");

const {
    isNonEmptyString,
    normalizeEmail,
    validateUsername,
    validateEmail,
    validatePassword,
    validateLinkedinUrl,
    checkMaxLengths,
    CURRENTLY_DOING,
    PROFESSIONAL_DESIGNATIONS
} = require("../../utils/validation");

// Minimal Temporal polyfill for Node.js runtime when using @prisma/orm-postgres
// timestamp-temporal and timestamptz-temporal codecs
if (typeof Temporal === "undefined") {
    globalThis.Temporal = {
        PlainDateTime: {
            from(str) {
                return { toString: () => str, [Symbol.toStringTag]: "Temporal.PlainDateTime" };
            }
        },
        Instant: {
            from(str) {
                return { toString: () => str, [Symbol.toStringTag]: "Temporal.Instant" };
            }
        }
    };
}

const toPlainDateTime = (date) => ({
    toString: () => date.toISOString().replace("T", " ").replace("Z", ""),
    [Symbol.toStringTag]: "Temporal.PlainDateTime",
    calendarId: "iso8601"
});

const validUserTypes = [
    "learner",
    "student",
    "faculty",
    "professional",
    "recruiter"
];

// Same answer whether or not the email is already registered, so signup
// can't be used to find out who has an account
const SIGNUP_RESPONSE = {
    message: "Registration received. Please check your email to verify your account."
};

const trimOrNull = (value) =>
    typeof value === "string" && value.trim() ? value.trim() : null;


const signup = async (req, res) => {
    try {

        const {
            name,
            fullName,
            username,
            email,
            password,
            retypePassword,

            // Learner
            doing,
            currentlyDoing,

            // Organisation
            collegeName,
            college,
            department,
            year,
            designation,

            // Professional / Recruiter
            companyName,
            company,

            // Common
            contactNumber,
            mobile,
            linkedinProfile,
            linkedin,

            // Support both names temporarily
            userType,
            accountType
        } = req.body || {};


        // --------------------------------------------------
        // 1. Account type
        // --------------------------------------------------

        const selectedUserType = accountType || userType;

        if (!validUserTypes.includes(selectedUserType)) {
            return res.status(400).json({
                message: selectedUserType
                    ? "Invalid user type"
                    : "User type is required"
            });
        }


        // --------------------------------------------------
        // 2. Common fields
        // --------------------------------------------------

        const finalEmail = isNonEmptyString(email) ? normalizeEmail(email) : "";
        const finalUsername = trimOrNull(username) || "";
        const finalPassword = password || "";
        const finalRetypePassword = retypePassword || "";
        const finalContactNumber = trimOrNull(contactNumber) || trimOrNull(mobile);
        const finalLinkedinProfile = trimOrNull(linkedinProfile) || trimOrNull(linkedin);
        const finalCollegeName = trimOrNull(collegeName) || trimOrNull(college);
        const finalCompanyName = trimOrNull(companyName) || trimOrNull(company);
        const finalDoing = trimOrNull(doing) || trimOrNull(currentlyDoing);
        const finalFullName = trimOrNull(fullName) || trimOrNull(name);
        const finalDepartment = trimOrNull(department);
        const finalYear = trimOrNull(year);
        const finalDesignation = trimOrNull(designation);


        // --------------------------------------------------
        // 3. Required fields
        // --------------------------------------------------

        if (
            !finalUsername ||
            !finalEmail ||
            !finalPassword ||
            !finalRetypePassword
        ) {
            return res.status(400).json({
                message:
                    "Username, email, password and retype password are required"
            });
        }

        if (!finalContactNumber) {
            return res.status(400).json({
                message: "Mobile number is required"
            });
        }


        // --------------------------------------------------
        // 4. Format checks
        // --------------------------------------------------

        const formatError =
            validateUsername(finalUsername) ||
            validateEmail(finalEmail) ||
            validatePassword(finalPassword) ||
            (finalPassword !== finalRetypePassword ? "Passwords do not match" : null) ||
            (finalLinkedinProfile ? validateLinkedinUrl(finalLinkedinProfile) : null) ||
            checkMaxLengths([
                ["Mobile number", finalContactNumber, 20],
                ["Full name", finalFullName, 100],
                ["College name", finalCollegeName, 150],
                ["Department", finalDepartment, 100],
                ["Year", finalYear, 20],
                ["Designation", finalDesignation, 150],
                ["Company name", finalCompanyName, 150]
            ]);

        if (formatError) {
            return res.status(400).json({
                message: formatError
            });
        }


        // --------------------------------------------------
        // 5. Role-specific validation
        // --------------------------------------------------

        let roleError = null;

        if (selectedUserType === "learner") {
            if (!finalDoing) {
                roleError = "Please select what you are currently doing";
            } else if (!CURRENTLY_DOING.includes(finalDoing)) {
                roleError = "Invalid currently doing value. Allowed values are Student, Freelancer, Job seeking, or Other";
            }
        }

        if (selectedUserType === "student" || selectedUserType === "faculty") {
            if (!finalCollegeName) {
                roleError = "College name is required";
            } else if (!finalDepartment) {
                roleError = "Department is required";
            } else if (selectedUserType === "student" && !finalYear) {
                roleError = "Year of study is required";
            } else if (selectedUserType === "faculty" && !finalDesignation) {
                roleError = "Designation is required";
            }
        }

        // Frontend sends professional/recruiter designation in "department"
        if (selectedUserType === "professional" || selectedUserType === "recruiter") {
            if (selectedUserType === "recruiter" && !finalFullName) {
                roleError = "Full name is required";
            } else if (!finalCompanyName) {
                roleError = "Company name is required";
            } else if (!finalDepartment) {
                roleError = "Designation is required";
            } else if (!PROFESSIONAL_DESIGNATIONS.includes(finalDepartment)) {
                roleError = "Invalid designation. Allowed values are HR, Technical, Management, or Talent Acquisition";
            }
        }

        if (roleError) {
            return res.status(400).json({
                message: roleError
            });
        }


        // --------------------------------------------------
        // 6. Duplicate checks
        // --------------------------------------------------

        // Usernames are public, so saying one is taken leaks nothing
        if (await isUsernameTaken(finalUsername)) {
            return res.status(409).json({
                message: "Username already registered"
            });
        }

        // Email already registered: tell the owner by email instead of
        // telling whoever is calling this API
        const existingAccount = await findAccountByEmail(finalEmail);

        if (existingAccount) {
            sendInBackground("signup attempt", () =>
                sendSignupAttemptEmail(
                    existingAccount.email,
                    existingAccount.full_name || existingAccount.username
                )
            );

            return res.status(201).json(SIGNUP_RESPONSE);
        }


        // --------------------------------------------------
        // 7. Create account + verification token together
        // --------------------------------------------------

        const hashedPassword = await bcrypt.hash(finalPassword, 10);
        const verificationToken = generateVerificationToken();

        await db.transaction(async (tx) => {
            let createdUser;

            // Learner → users
            if (selectedUserType === "learner") {
                createdUser = await tx.orm.public.Users.create({
                    username: finalUsername,
                    email: finalEmail,
                    passwordHash: hashedPassword,
                    contactNumber: finalContactNumber,
                    currentlyDoing: finalDoing,
                    linkedinProfile: finalLinkedinProfile
                });
            }

            // Student / Faculty → organisation
            else if (
                selectedUserType === "student" ||
                selectedUserType === "faculty"
            ) {
                createdUser = await tx.orm.public.Organisation.create({
                    username: finalUsername,
                    email: finalEmail,
                    passwordHash: hashedPassword,
                    contactNumber: finalContactNumber,
                    userType: selectedUserType,
                    collegeName: finalCollegeName,
                    department: finalDepartment,
                    year: finalYear,
                    designation: finalDesignation,
                    linkedinProfile: finalLinkedinProfile
                });
            }

            // Professional / Recruiter → professionals
            else {
                createdUser = await tx.orm.public.Professionals.create({
                    name: finalFullName || finalUsername,
                    username: finalUsername,
                    email: finalEmail,
                    passwordHash: hashedPassword,
                    contactNumber: finalContactNumber,
                    userType: selectedUserType,
                    companyName: finalCompanyName,
                    designation: finalDepartment,
                    fullName: finalFullName,
                    linkedinProfile: finalLinkedinProfile
                });
            }

            const expiresAt = toPlainDateTime(new Date(Date.now() + 30 * 60 * 1000));

            await tx.orm.public.EmailVerificationTokens.create({
                userId: createdUser.id,
                token: hashToken(verificationToken),
                userType: selectedUserType,
                expiresAt
            });
        });


        // --------------------------------------------------
        // 8. Send verification email
        // --------------------------------------------------

        // Sent after responding. If it fails, logging in with the
        // correct password sends a new link.
        sendInBackground("verification", () =>
            sendVerificationEmail(
                finalEmail,
                finalFullName || finalUsername,
                verificationToken
            )
        );

        return res.status(201).json(SIGNUP_RESPONSE);


    } catch (error) {

        // Two signups racing for the same username / email
        const isUniqueViolation = error.code === "23505" || error.sqlState === "23505" || error.cause?.code === "23505";
        const constraintName = error.constraint || error.cause?.constraint || "";

        if (isUniqueViolation) {
            if (/username/.test(constraintName) || /username/.test(error.message || "")) {
                return res.status(409).json({
                    message: "Username already registered"
                });
            }

            return res.status(201).json(SIGNUP_RESPONSE);
        }

        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    signup
};
