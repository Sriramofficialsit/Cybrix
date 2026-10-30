// Shared input rules, so signup / profile update / password reset agree

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 10;
const PASSWORD_MAX = 72; // bcrypt ignores anything after 72 bytes

// Small list of passwords that pass the length/letter/number rule but are
// among the first guesses in any password-spraying list
const COMMON_PASSWORDS = new Set([
    "password12", "password123", "password1234", "password12345",
    "passw0rd123", "p@ssword123", "qwerty1234", "qwerty12345",
    "qwerty123456", "qwertyuiop1", "1234567890a", "a1234567890",
    "abc1234567", "abcd123456", "abcdef1234", "iloveyou123",
    "welcome123", "welcome1234", "letmein123", "admin12345",
    "administrator1", "changeme123", "football123", "baseball123",
    "princess123", "sunshine123", "monkey12345", "dragon12345",
    "cyberthulir1", "cyberthulir123"
]);

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const normalizeEmail = (email) => email.trim().toLowerCase();

// Returns an error message, or null when the username is valid
const validateUsername = (username) => {
    if (
        username.length < USERNAME_MIN ||
        username.length > USERNAME_MAX
    ) {
        return `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters`;
    }

    if (!/^[A-Za-z0-9_]+$/.test(username)) {
        return "Username can contain only letters, numbers and underscore";
    }

    return null;
};

const validateEmail = (email) => {
    if (email.length > 255) {
        return "Email must not exceed 255 characters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email address";
    }

    return null;
};

const validatePassword = (password) => {
    if (
        password.length < PASSWORD_MIN ||
        password.length > PASSWORD_MAX
    ) {
        return `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return "Password must contain at least one letter and one number";
    }

    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        return "This password is too common. Please choose a different one";
    }

    return null;
};

// Only https links to the expected site, so a stored value can never be
// a javascript: or data: URL when rendered as a link
const validateSiteUrl = (value, hosts, label) => {
    let url;

    try {
        url = new URL(value);
    } catch {
        return `${label} must be a valid https:// link`;
    }

    if (url.protocol !== "https:" || url.username || url.password) {
        return `${label} must be a valid https:// link`;
    }

    const host = url.hostname.toLowerCase();

    if (!hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
        return `${label} must be a ${hosts[0]} link`;
    }

    if (value.length > 500) {
        return `${label} must not exceed 500 characters`;
    }

    return null;
};

const validateLinkedinUrl = (value) =>
    validateSiteUrl(value, ["linkedin.com"], "LinkedIn profile");

const validateGithubUrl = (value) =>
    validateSiteUrl(value, ["github.com"], "GitHub profile");

// Returns an error message for the first field that is too long
const checkMaxLengths = (fields) => {
    for (const [label, value, max] of fields) {
        if (typeof value === "string" && value.length > max) {
            return `${label} must not exceed ${max} characters`;
        }
    }

    return null;
};

const CURRENTLY_DOING = ["Student", "Freelancer", "Job seeking", "Other"];

const PROFESSIONAL_DESIGNATIONS = [
    "HR",
    "Technical",
    "Management",
    "Talent Acquisition"
];

module.exports = {
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
};
