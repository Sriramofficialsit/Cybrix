const bcrypt = require("bcryptjs");
const { db } = require("../../prisma/db.mjs");

const {
    sendInBackground,
    sendEmailChangeVerification,
    sendEmailChangeAlert
} = require("../../services/emailService");

const {
    ACCOUNT_TABLES,
    getUserTable,
    getUserModel,
    isEmailTaken,
    isUsernameTaken,
    signUserToken
} = require("../../services/accountService");

const {
    generateVerificationToken,
    hashToken
} = require("../../utils/tokenUtils");

const {
    isNonEmptyString,
    normalizeEmail,
    validateUsername,
    validateEmail,
    validatePassword,
    validateLinkedinUrl,
    validateGithubUrl,
    checkMaxLengths,
    CURRENTLY_DOING,
    PROFESSIONAL_DESIGNATIONS
} = require("../../utils/validation");

const { setSessionCookie } = require("../../utils/sessionCookie");

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

// For learners the JWT has no userType, only accountType
const tableForUser = (reqUser) =>
    getUserTable(reqUser.userType || reqUser.accountType);

const modelForUser = (reqUser) =>
    getUserModel(reqUser.userType || reqUser.accountType);

// "" and null both clear an optional field
const emptyToNull = (value) =>
    typeof value === "string" && value.trim() === "" ? null : value;

const formatUserProfile = (userRecord, profileRecord, actualUserType, tableName) => {
    if (!userRecord) return null;

    const base = {
        id: userRecord.id,
        username: userRecord.username,
        email: userRecord.email,
        accountType: actualUserType,
        account_type: actualUserType,
        is_email_verified: Boolean(userRecord.isEmailVerified),
        isEmailVerified: Boolean(userRecord.isEmailVerified),
        current_status: userRecord.currentStatus ?? null,
        currentStatus: userRecord.currentStatus ?? null,
        contact_number: userRecord.contactNumber ?? null,
        contactNumber: userRecord.contactNumber ?? null,
        linkedin_profile: userRecord.linkedinProfile ?? null,
        linkedinProfile: userRecord.linkedinProfile ?? null,
        pending_email: userRecord.pendingEmail ?? null,
        pendingEmail: userRecord.pendingEmail ?? null,
        last_active_at: userRecord.lastActiveAt ? userRecord.lastActiveAt.toString() : null,
        lastActiveAt: userRecord.lastActiveAt ? userRecord.lastActiveAt.toString() : null,
        created_at: userRecord.createdAt ? userRecord.createdAt.toString() : null,
        createdAt: userRecord.createdAt ? userRecord.createdAt.toString() : null,
        updated_at: userRecord.updatedAt ? userRecord.updatedAt.toString() : null,
        updatedAt: userRecord.updatedAt ? userRecord.updatedAt.toString() : null
    };

    if (tableName === "users") {
        base.currently_doing = userRecord.currentlyDoing ?? null;
        base.currentlyDoing = userRecord.currentlyDoing ?? null;
    } else if (tableName === "organisation") {
        base.user_type = userRecord.userType ?? null;
        base.userType = userRecord.userType ?? null;
        base.college_name = userRecord.collegeName ?? null;
        base.collegeName = userRecord.collegeName ?? null;
        base.department = userRecord.department ?? null;
        base.year = userRecord.year ?? null;
        base.designation = userRecord.designation ?? null;
    } else if (tableName === "professionals") {
        base.user_type = userRecord.userType ?? null;
        base.userType = userRecord.userType ?? null;
        base.full_name = userRecord.fullName ?? null;
        base.fullName = userRecord.fullName ?? null;
        base.company_name = userRecord.companyName ?? null;
        base.companyName = userRecord.companyName ?? null;
        base.designation = userRecord.designation ?? null;
        base.department = userRecord.designation ?? null;
    }

    if (profileRecord) {
        const githubUrl = profileRecord.githubUrl != null
            ? (typeof profileRecord.githubUrl === "string" ? profileRecord.githubUrl : JSON.stringify(profileRecord.githubUrl))
            : null;
        const linkedinUrl = profileRecord.linkedinUrl != null
            ? (typeof profileRecord.linkedinUrl === "string" ? profileRecord.linkedinUrl : JSON.stringify(profileRecord.linkedinUrl))
            : null;

        base.bio = profileRecord.bio ?? null;
        base.profile_image = profileRecord.profileImage ?? null;
        base.profileImage = profileRecord.profileImage ?? null;
        base.phone_number = profileRecord.phoneNumber ?? null;
        base.phoneNumber = profileRecord.phoneNumber ?? null;
        base.github_url = githubUrl;
        base.githubUrl = githubUrl;
        base.linkedin_url = linkedinUrl;
        base.linkedinUrl = linkedinUrl;
        base.profile_updated_at = profileRecord.updatedAt ? profileRecord.updatedAt.toString() : null;
        base.profileUpdatedAt = profileRecord.updatedAt ? profileRecord.updatedAt.toString() : null;
    }

    return base;
};

// Get profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const tableName = tableForUser(req.user);
        const modelName = modelForUser(req.user);

        if (!tableName || !modelName) {
            return res.status(400).json({
                message: "Invalid user type"
            });
        }

        const user = await db.orm.public[modelName]
            .where((r) => r.id.eq(userId))
            .first();

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const profileRecord = await db.orm.public.UserProfiles
            .where((r) => r.userId.eq(userId))
            .first();

        const actualUserType = req.user.userType || req.user.accountType;
        const formattedUser = formatUserProfile(user, profileRecord, actualUserType, tableName);

        return res.status(200).json({
            message: "Profile fetched successfully",
            user: formattedUser
        });

    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Update profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const actualUserType = req.user.userType || req.user.accountType;
        const tableName = tableForUser(req.user);
        const modelName = modelForUser(req.user);

        if (!tableName || !modelName) {
            return res.status(400).json({
                message: "Invalid user type"
            });
        }

        const body = req.body || {};

        const username = body.username !== undefined ? String(body.username).trim() : undefined;
        const email = body.email !== undefined ? normalizeEmail(String(body.email)) : undefined;
        const contactNumber = emptyToNull(body.contactNumber);
        const linkedinUrl = emptyToNull(body.linkedinUrl);
        const githubUrl = emptyToNull(body.githubUrl);
        const bio = emptyToNull(body.bio);
        const phoneNumber = emptyToNull(body.phoneNumber);

        // Validate username
        if (username !== undefined) {
            const usernameError = validateUsername(username);

            if (usernameError) {
                return res.status(400).json({
                    message: usernameError
                });
            }
        }

        // Validate email
        if (email !== undefined) {
            const emailError = validateEmail(email);

            if (emailError) {
                return res.status(400).json({
                    message: emailError
                });
            }
        }

        // Mobile number is required at signup, so it can't be cleared
        if (contactNumber === null) {
            return res.status(400).json({
                message: "Mobile number is required"
            });
        }

        // Links must be https links to the right site
        const linkError =
            (linkedinUrl ? validateLinkedinUrl(linkedinUrl) : null) ||
            (githubUrl ? validateGithubUrl(githubUrl) : null);

        if (linkError) {
            return res.status(400).json({
                message: linkError
            });
        }

        const lengthError = checkMaxLengths([
            ["Contact number", contactNumber, 20],
            ["Phone number", phoneNumber, 20],
            ["Bio", bio, 5000],
            ["College name", body.collegeName, 150],
            ["Department", body.department, 100],
            ["Year", body.year, 20],
            ["Designation", body.designation, 150],
            ["Full name", body.fullName, 100],
            ["Company name", body.companyName, 150]
        ]);

        if (lengthError) {
            return res.status(400).json({
                message: lengthError
            });
        }

        // Role-specific columns that may be updated
        let roleFields;

        if (actualUserType === "learner") {
            const currentlyDoing = emptyToNull(body.currentlyDoing);

            if (currentlyDoing && !CURRENTLY_DOING.includes(currentlyDoing)) {
                return res.status(400).json({
                    message: "Invalid currently doing value"
                });
            }

            roleFields = {
                currentlyDoing: body.currentlyDoing !== undefined ? currentlyDoing : undefined
            };
        } else if (tableName === "organisation") {
            roleFields = {
                collegeName: body.collegeName !== undefined ? emptyToNull(body.collegeName) : undefined,
                department: body.department !== undefined ? emptyToNull(body.department) : undefined,
                year: body.year !== undefined ? emptyToNull(body.year) : undefined,
                designation: body.designation !== undefined ? emptyToNull(body.designation) : undefined
            };
        } else {
            // Accept designation, or department (what signup sends)
            const desVal = body.designation !== undefined ? body.designation : body.department;
            const designation = emptyToNull(desVal);

            if (designation && !PROFESSIONAL_DESIGNATIONS.includes(designation)) {
                return res.status(400).json({
                    message: "Invalid designation. Allowed values are HR, Technical, Management, or Talent Acquisition"
                });
            }

            const fullName = body.fullName !== undefined ? emptyToNull(body.fullName) : undefined;

            roleFields = {
                fullName,
                name: fullName || undefined,
                companyName: body.companyName !== undefined ? emptyToNull(body.companyName) : undefined,
                designation: desVal !== undefined ? designation : undefined
            };
        }

        const outcome = await db.transaction(async (tx) => {
            // Get current user
            const currentUser = await tx.orm.public[modelName]
                .where((r) => r.id.eq(userId))
                .first();

            if (!currentUser) {
                return { status: 404, message: "User not found" };
            }

            const usernameChanged =
                username !== undefined && username !== currentUser.username;

            const emailChanged =
                email !== undefined && email !== currentUser.email;

            // Check duplicate username (case-insensitive, all tables)
            if (
                usernameChanged &&
                username.toLowerCase() !== currentUser.username.toLowerCase() &&
                await isUsernameTaken(username, userId, tx)
            ) {
                return { status: 409, message: "Username already registered" };
            }

            // Check duplicate email across all account tables
            if (
                emailChanged &&
                await isEmailTaken(email, { excludeId: userId, client: tx })
            ) {
                return { status: 409, message: "Email already registered" };
            }

            // Email change: the new address must be confirmed before it is
            // used. Only touch the pending_* columns when the email changes,
            // so an ordinary save doesn't cancel a pending change.
            let confirmToken = null;
            let reportToken = null;

            const accountUpdates = {
                updatedAt: toPlainDateTime(new Date())
            };

            if (usernameChanged) {
                accountUpdates.username = username;
            }

            if (contactNumber !== undefined) {
                accountUpdates.contactNumber = contactNumber;
            }

            if (linkedinUrl !== undefined) {
                accountUpdates.linkedinProfile = linkedinUrl;
            }

            for (const [k, v] of Object.entries(roleFields)) {
                if (v !== undefined) {
                    accountUpdates[k] = v;
                }
            }

            if (emailChanged && modelName !== "Professionals") {
                confirmToken = generateVerificationToken();
                reportToken = generateVerificationToken();

                accountUpdates.pendingEmail = email;
                accountUpdates.emailChangeToken = hashToken(confirmToken);
                accountUpdates.emailChangeReportToken = hashToken(reportToken);
                accountUpdates.emailChangeExpiresAt = toPlainDateTime(new Date(Date.now() + 30 * 60 * 1000));
            }

            const updatedUser = await tx.orm.public[modelName]
                .where((r) => r.id.eq(userId))
                .update(accountUpdates);

            // Create or update profile, only with the fields that were sent
            const profileFields = {};
            if (bio !== undefined) profileFields.bio = bio;
            if (phoneNumber !== undefined) profileFields.phoneNumber = phoneNumber;
            if (githubUrl !== undefined) {
                profileFields.githubUrl = githubUrl === null ? null : JSON.stringify(githubUrl);
            }
            if (linkedinUrl !== undefined) {
                profileFields.linkedinUrl = linkedinUrl === null ? null : JSON.stringify(linkedinUrl);
            }

            const hasProfileUpdates = Object.keys(profileFields).length > 0;
            const existingProfile = await tx.orm.public.UserProfiles
                .where((r) => r.userId.eq(userId))
                .first();

            let profileResult = null;

            if (hasProfileUpdates) {
                if (existingProfile) {
                    profileResult = await tx.orm.public.UserProfiles
                        .where((r) => r.userId.eq(userId))
                        .update({
                            ...profileFields,
                            updatedAt: toPlainDateTime(new Date())
                        });
                } else {
                    profileResult = await tx.orm.public.UserProfiles
                        .create({
                            userId,
                            ...profileFields,
                            createdAt: toPlainDateTime(new Date()),
                            updatedAt: toPlainDateTime(new Date())
                        });
                }
            } else {
                profileResult = existingProfile;
            }

            const formattedUser = formatUserProfile(
                updatedUser,
                profileResult,
                actualUserType,
                tableName
            );

            return {
                status: 200,
                emailChanged,
                confirmToken,
                reportToken,
                oldEmail: currentUser.email,
                user: formattedUser
            };
        });

        if (outcome.status !== 200) {
            return res.status(outcome.status).json({
                message: outcome.message
            });
        }

        if (outcome.emailChanged) {
            const displayName = outcome.user.full_name || outcome.user.fullName || outcome.user.username;

            // Confirm link goes to the NEW address (proves ownership);
            // the old address gets a warning with a "wasn't me" link
            sendInBackground("email change confirmation", () =>
                sendEmailChangeVerification(email, displayName, outcome.confirmToken)
            );

            sendInBackground("email change alert", () =>
                sendEmailChangeAlert(outcome.oldEmail, displayName, email, outcome.reportToken)
            );
        }

        return res.status(200).json({
            message: outcome.emailChanged
                ? "Profile updated. We sent a confirmation link to your new email address. Your email changes once you click it."
                : "Profile updated successfully",
            user: outcome.user
        });

    } catch (error) {
        const errorText = `${error.code || ""} ${error.constraint || ""} ${error.message || ""} ${error.why || ""}`;
        if (error.code === "23505" || error.code === "P2002" || /unique/i.test(errorText)) {
            return res.status(409).json({
                message: /username/i.test(errorText)
                    ? "Username already registered"
                    : "Email already registered"
            });
        }

        console.error("Update profile error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const tableName = tableForUser(req.user);
        const modelName = modelForUser(req.user);

        if (!tableName || !modelName) {
            return res.status(400).json({
                message: "Invalid user type"
            });
        }

        const {
            currentPassword,
            newPassword,
            retypePassword
        } = req.body || {};

        // Check required fields
        if (
            !isNonEmptyString(currentPassword) ||
            !isNonEmptyString(newPassword) ||
            !isNonEmptyString(retypePassword)
        ) {
            return res.status(400).json({
                message: "All password fields are required"
            });
        }

        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            return res.status(400).json({
                message: passwordError
            });
        }

        // Check password match
        if (newPassword !== retypePassword) {
            return res.status(400).json({
                message: "New passwords do not match"
            });
        }

        // Get current password
        const user = await db.orm.public[modelName]
            .where((r) => r.id.eq(userId))
            .select("id", "passwordHash", "tokenVersion")
            .first();

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Compare current password
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const nextTokenVersion = (user.tokenVersion || 0) + 1;

        // Update password and sign out every other session
        await db.orm.public[modelName]
            .where((r) => r.id.eq(userId))
            .update({
                passwordHash: hashedPassword,
                tokenVersion: nextTokenVersion,
                updatedAt: toPlainDateTime(new Date())
            });

        // New session cookie so this device stays logged in
        const accountType = Object.keys(ACCOUNT_TABLES)
            .find((key) => ACCOUNT_TABLES[key] === tableName);

        setSessionCookie(res, signUserToken({
            id: userId,
            userId,
            accountType,
            account_type: accountType,
            userType: req.user.userType,
            user_type: req.user.userType,
            tokenVersion: nextTokenVersion,
            token_version: nextTokenVersion
        }));

        return res.status(200).json({
            message: "Password changed successfully. Other sessions have been signed out."
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};
