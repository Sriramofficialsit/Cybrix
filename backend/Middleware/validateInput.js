// Every API field is a string (or null). Rejecting anything else up front
// means controllers can safely call .trim() / .length, and a request like
// {"email": 123} gets a 400 instead of crashing into a 500.

const hasNonStringValue = (obj) =>
    Object.values(obj).some(
        (value) =>
            value !== null &&
            value !== undefined &&
            typeof value !== "string"
    );

const requireStringFields = (req, res, next) => {
    const body = req.body;

    const badBody =
        body !== undefined &&
        (typeof body !== "object" ||
            body === null ||
            Array.isArray(body) ||
            hasNonStringValue(body));

    if (badBody || hasNonStringValue(req.query)) {
        return res.status(400).json({
            message: "Invalid request: every field must be text"
        });
    }

    next();
};

module.exports = {
    requireStringFields
};
