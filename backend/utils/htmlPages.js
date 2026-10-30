// Small standalone pages for links opened from emails.
//
// Email links are GET requests, and corporate mail scanners open them
// before the user does. So a GET only shows a confirm button; the token is
// used up by the POST that the button sends.

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const shell = (title, inner) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>${escapeHtml(title)} · CyberThulir</title>
    <style>
        body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
               background:#f4f2f9; font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif; color:#1f1633; }
        main { max-width:440px; margin:16px; padding:36px 32px; background:#fff; border:1px solid #ece9f4;
               border-radius:20px; box-shadow:0 24px 48px -28px rgba(124,58,237,.35); }
        h1 { margin:0 0 12px; font-size:22px; }
        p { margin:0; font-size:15px; line-height:1.6; color:#4b4560; }
        button, a.btn { display:inline-block; margin-top:24px; padding:13px 26px; border:0; border-radius:12px;
               background:#7c3aed; color:#fff; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; }
        .err h1 { color:#e5484d; }
    </style>
</head>
<body>
    <main>${inner}</main>
</body>
</html>`;

// Page with a button that POSTs the token back to `action`
const confirmPage = ({ title, message, action, token, buttonLabel }) =>
    shell(title, `
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <form method="POST" action="${escapeHtml(action)}">
            <input type="hidden" name="token" value="${escapeHtml(token)}">
            <button type="submit">${escapeHtml(buttonLabel)}</button>
        </form>`);

const resultPage = ({ title, message, error = false, link, linkLabel }) =>
    shell(title, `
        <div class="${error ? "err" : ""}">
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(message)}</p>
            ${link ? `<a class="btn" href="${escapeHtml(link)}">${escapeHtml(linkLabel)}</a>` : ""}
        </div>`);

module.exports = {
    confirmPage,
    resultPage
};
