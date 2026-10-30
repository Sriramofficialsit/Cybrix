const path = require("path");
const nodemailer = require("nodemailer");
const { BACKEND_URL, FRONTEND_URL } = require("../config/env");

// pool: reuse SMTP connections instead of a new handshake per email
const transporter = nodemailer.createTransport({
    service: "gmail",
    pool: true,
    maxConnections: 3,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const FROM = `"CyberThulir" <${process.env.SMTP_USER}>`;

// Logo is embedded in the email (cid) so it shows without a public URL
const LOGO_CID = "cyberthulir-logo";

const LOGO_ATTACHMENT = {
    filename: "logo.png",
    path: path.join(__dirname, "..", "assets", "logo.png"),
    cid: LOGO_CID
};

// Website palette
const C = {
    violet: "#7c3aed",
    violetDeep: "#6d28d9",
    ink: "#1f1633",
    text: "#4b4560",
    muted: "#9a8fb5",
    page: "#f4f2f9",
    tint: "#f5f3fa",
    line: "#ece9f4",
    lime: "#c2ef4e",
    danger: "#e5484d"
};

const FONT =
    "'Space Grotesk','Rubik',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";


// --------------------------------------------------
// Helpers
// --------------------------------------------------

// Names come from user input, so escape them before putting them in HTML
const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const button = (label, url, color = C.violet, colorEnd = C.violetDeep) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
        <tr>
            <td bgcolor="${color}" style="border-radius:12px;background:${color};background-image:linear-gradient(120deg,${color},${colorEnd});box-shadow:0 12px 24px -12px ${color}">
                <a href="${url}" target="_blank"
                   style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:12px">
                    ${label} &rarr;
                </a>
            </td>
        </tr>
    </table>`;

const infoBox = (html) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0">
        <tr>
            <td style="background:${C.tint};border-left:3px solid ${C.violet};border-radius:10px;padding:14px 16px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.text}">
                ${html}
            </td>
        </tr>
    </table>`;

const fallbackLink = (url) => `
    <p style="margin:22px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted}">
        Button not working? Copy this link into your browser:<br>
        <a href="${url}" style="color:${C.violet};word-break:break-all">${url}</a>
    </p>`;

const otpBlock = (otp) => {
    const cells = String(otp)
        .split("")
        .map((d) => `
            <td style="padding:0 4px">
                <div style="width:44px;height:54px;line-height:54px;text-align:center;background:${C.tint};border:1px solid #e4dcfa;border-radius:12px;font-family:'SF Mono',Monaco,Menlo,Consolas,monospace;font-size:26px;font-weight:700;color:${C.ink}">${d}</div>
            </td>`)
        .join("");

    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 6px">
        <tr>${cells}</tr>
    </table>`;
};

/**
 * Shared layout for every email.
 * eyebrow: small lime label, title: heading, body: inner HTML,
 * preheader: preview text shown in the inbox list.
 */
const layout = ({ preheader, eyebrow, title, body, footerNote }) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.page}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page}">
        <tr>
            <td align="center" style="padding:36px 16px">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

                    <!-- Brand -->
                    <tr>
                        <td style="padding:0 4px 20px">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="vertical-align:middle">
                                        <img src="cid:${LOGO_CID}" width="36" height="36" alt="CyberThulir" style="display:block;border:0;border-radius:50%">
                                    </td>
                                    <td style="vertical-align:middle;padding-left:10px;font-family:${FONT};font-size:18px;font-weight:700;letter-spacing:-.3px;color:${C.ink}">
                                        CyberThulir
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Card -->
                    <tr>
                        <td bgcolor="#ffffff" style="background:#ffffff;border:1px solid ${C.line};border-radius:20px;overflow:hidden;box-shadow:0 24px 48px -28px rgba(124,58,237,.35)">

                            <div style="height:5px;line-height:5px;font-size:0;background:${C.violet};background-image:linear-gradient(90deg,${C.violet},#38bdf8)">&nbsp;</div>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:36px 40px 38px">

                                        <span style="display:inline-block;background:${C.lime};color:${C.ink};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:5px 11px;border-radius:6px">${eyebrow}</span>

                                        <h1 style="margin:16px 0 0;font-family:${FONT};font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-.5px;color:${C.ink}">${title}</h1>

                                        <div style="margin-top:14px;font-family:${FONT};font-size:15px;line-height:1.7;color:${C.text}">
                                            ${body}
                                        </div>

                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding:24px 20px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.muted}">
                            ${footerNote ? `${footerNote}<br>` : ""}
                            <span style="color:${C.violet};font-weight:600">CyberThulir</span> &middot; Learn. Hack. Defend.<br>
                            This is an automated message, please do not reply.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const send = (to, subject, html, text) =>
    transporter.sendMail({
        from: FROM,
        to,
        subject,
        html,
        text,
        attachments: [LOGO_ATTACHMENT]
    });


// --------------------------------------------------
// Emails
// --------------------------------------------------

// Send account verification email
const sendVerificationEmail = async (email, username, token) => {
    const verificationLink =
        `${BACKEND_URL}/api/auth/verify-email?token=${token}`;

    const name = escapeHtml(username);

    const html = layout({
        preheader: "Confirm your email to activate your CyberThulir account.",
        eyebrow: "Verify email",
        title: `Welcome aboard, ${name}!`,
        body: `
            <p style="margin:0">
                You're one step away from starting your cybersecurity journey.
                Confirm your email address to activate your account.
            </p>
            ${button("Verify email", verificationLink)}
            ${infoBox("&#9201;&nbsp; This link expires in <strong style=\"color:#1f1633\">30 minutes</strong>. If it expires, just log in and we'll send you a new one.")}
            ${fallbackLink(verificationLink)}`,
        footerNote: "Didn't create an account? You can safely ignore this email."
    });

    const text =
`Welcome to CyberThulir, ${username}!

Confirm your email address to activate your account:
${verificationLink}

This link expires in 30 minutes. If it expires, log in and we'll send you a new one.

Didn't create an account? You can safely ignore this email.`;

    await send(email, "Verify your CyberThulir account", html, text);
};

// Send password reset email
const sendPasswordResetEmail = async (email, username, token) => {
    const resetLink =
        `${FRONTEND_URL}/reset-password?token=${token}`;

    const name = escapeHtml(username);

    const html = layout({
        preheader: "Use this link to choose a new CyberThulir password.",
        eyebrow: "Password reset",
        title: "Reset your password",
        body: `
            <p style="margin:0">
                Hi ${name}, we received a request to reset the password for
                your CyberThulir account. Click below to choose a new one.
            </p>
            ${button("Reset password", resetLink)}
            ${infoBox("&#9201;&nbsp; This link expires in <strong style=\"color:#1f1633\">30 minutes</strong> and can only be used once.")}
            ${fallbackLink(resetLink)}`,
        footerNote: "Didn't request this? Ignore this email &mdash; your password won't change."
    });

    const text =
`Hi ${username},

We received a request to reset your CyberThulir password. Choose a new one here:
${resetLink}

This link expires in 30 minutes and can only be used once.

Didn't request this? Ignore this email - your password won't change.`;

    await send(email, "Reset your CyberThulir password", html, text);
};

// Email change, step 1: sent to the NEW address. Clicking the link
// proves the user owns it; only then is the email actually changed.
const sendEmailChangeVerification = async (newEmail, username, confirmToken) => {
    const confirmLink =
        `${BACKEND_URL}/api/user/email-change/confirm?token=${confirmToken}`;

    const name = escapeHtml(username);

    const html = layout({
        preheader: "Confirm this address to finish changing your CyberThulir email.",
        eyebrow: "Confirm new email",
        title: "Confirm your new email",
        body: `
            <p style="margin:0">
                Hi ${name}, you asked to use this address for your
                CyberThulir account. Confirm it to finish the change.
            </p>
            ${button("Confirm new email", confirmLink)}
            ${infoBox("&#9201;&nbsp; This link expires in <strong style=\"color:#1f1633\">30 minutes</strong>. Until you confirm, your old email stays active.")}
            ${fallbackLink(confirmLink)}`,
        footerNote: "Didn't request this? You can safely ignore this email."
    });

    const text =
`Hi ${username},

You asked to use this address for your CyberThulir account. Confirm it here:
${confirmLink}

This link expires in 30 minutes. Until you confirm, your old email stays active.

Didn't request this? You can safely ignore this email.`;

    await send(newEmail, "Confirm your new CyberThulir email", html, text);
};

// Email change, step 2: sent to the OLD address, as a warning with a
// "this wasn't me" link that cancels the change and signs out all sessions
const sendEmailChangeAlert = async (
    email,
    username,
    newEmail,
    reportToken
) => {
    const reportLink =
        `${BACKEND_URL}/api/user/email-change/report?token=${reportToken}`;

    const name = escapeHtml(username);
    const safeNewEmail = escapeHtml(newEmail);

    const html = layout({
        preheader: "Someone asked to change the email on your CyberThulir account.",
        eyebrow: "Security alert",
        title: "Email change requested",
        body: `
            <p style="margin:0">
                Hi ${name}, a request was made to change the email address
                on your CyberThulir account to
                <strong style="color:${C.ink}">${safeNewEmail}</strong>.
                The change only happens once that address is confirmed.
            </p>
            ${infoBox(`
                <strong style="color:${C.ink}">Wasn't you?</strong>
                Report it now. We'll cancel the change and sign out every
                session on your account. Then reset your password.<br>
                <a href="${reportLink}" style="display:inline-block;margin-top:10px;font-weight:700;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:${C.danger};text-decoration:none">Report this change &rarr;</a>
            `)}
            <p style="margin:18px 0 0;font-size:13px;color:${C.muted}">This link expires in 30 minutes.</p>`,
        footerNote: "We send this alert to keep your account safe."
    });

    const text =
`Hi ${username},

A request was made to change the email address on your CyberThulir account to ${newEmail}.
The change only happens once that address is confirmed.

If this wasn't you, report it here. We'll cancel the change and sign out every session:
${reportLink}

This link expires in 30 minutes.`;

    await send(email, "Security alert: email change requested", html, text);
};

// Someone tried to sign up with an email that already has an account.
// Signup answers the same way either way, so it can't be used to find out
// which emails are registered; the real owner learns about it here.
const sendSignupAttemptEmail = async (email, username) => {
    const loginLink = `${FRONTEND_URL}/login`;
    const resetLink = `${FRONTEND_URL}/forgot-password`;

    const name = escapeHtml(username);

    const html = layout({
        preheader: "You already have a CyberThulir account.",
        eyebrow: "Account notice",
        title: "You already have an account",
        body: `
            <p style="margin:0">
                Hi ${name}, someone tried to create a new CyberThulir account
                with this email address, but it's already registered to you.
            </p>
            ${button("Log in", loginLink)}
            ${infoBox(`Forgot your password? <a href="${resetLink}" style="color:${C.violet};font-weight:700">Reset it here</a>.`)}`,
        footerNote: "If this wasn't you, no action is needed. Your account was not changed."
    });

    const text =
`Hi ${username},

Someone tried to create a new CyberThulir account with this email address, but it's already registered to you.

Log in: ${loginLink}
Forgot your password? ${resetLink}

If this wasn't you, no action is needed. Your account was not changed.`;

    await send(email, "You already have a CyberThulir account", html, text);
};

// Send admin verification email
const sendAdminVerificationEmail = async (email, name, token) => {
    const verificationLink =
        `${BACKEND_URL}/api/admin/verify-email?token=${token}`;

    const safeName = escapeHtml(name);

    const html = layout({
        preheader: "Verify your email to activate CyberThulir admin access.",
        eyebrow: "Admin access",
        title: "Verify your admin email",
        body: `
            <p style="margin:0">
                Hi ${safeName}, an administrator account was set up for you
                on CyberThulir. Verify your email address to activate it.
            </p>
            ${button("Verify admin email", verificationLink)}
            ${infoBox("&#9201;&nbsp; This link expires in <strong style=\"color:#1f1633\">30 minutes</strong>.")}
            ${fallbackLink(verificationLink)}`,
        footerNote: "Didn't expect this? You can safely ignore this email."
    });

    const text =
`Hi ${name},

An administrator account was set up for you on CyberThulir. Verify your email:
${verificationLink}

This link expires in 30 minutes.

Didn't expect this? You can safely ignore this email.`;

    await send(email, "Verify your CyberThulir admin account", html, text);
};

// Send login OTP
const sendLoginOtpEmail = async (email, username, otp) => {
    try {
        const name = escapeHtml(username);

        const html = layout({
            preheader: "Use this code to finish logging in. It expires in 5 minutes.",
            eyebrow: "Login code",
            title: "Your one-time code",
            body: `
                <p style="margin:0">
                    Hi ${name}, use this code to finish logging in to CyberThulir.
                </p>
                ${otpBlock(otp)}
                ${infoBox("&#9201;&nbsp; The code is valid for <strong style=\"color:#1f1633\">5 minutes</strong>. Never share it with anyone &mdash; CyberThulir staff will never ask for it.")}`,
            footerNote: "Didn't try to log in? Change your password right away."
        });

        const text =
`Hi ${username},

Your CyberThulir login code is: ${otp}

The code is valid for 5 minutes. Never share it with anyone.

Didn't try to log in? Change your password right away.`;

        await send(email, "Your CyberThulir login code", html, text);

    } catch (error) {
        console.error("Error sending login OTP:", error);
        throw error;
    }
};

// Send without making the request wait for SMTP (often 1-3 seconds).
// Failures are logged; every flow has a way to ask for the email again.
const sendInBackground = (label, sendFn) => {
    setImmediate(() => {
        sendFn().catch((error) => {
            console.error(`Failed to send ${label} email:`, error.message);
        });
    });
};

module.exports = {
    sendInBackground,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmailChangeVerification,
    sendEmailChangeAlert,
    sendSignupAttemptEmail,
    sendAdminVerificationEmail,
    sendLoginOtpEmail
};
