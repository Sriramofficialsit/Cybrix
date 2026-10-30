// Timestamps come back from the ORM as text. Columns without a time zone
// look like "2026-10-05 07:17:56.888" (stored as UTC); timestamptz columns
// carry an offset, e.g. "2026-10-05 07:17:56.888+00". Returns epoch millis,
// or NaN when the value is missing or unparseable.
const toMillis = (value) => {
    if (!value) return NaN;

    let str = value.toString().trim().replace(" ", "T");

    if (/T.*[+-]\d{2}$/.test(str)) {
        str += ":00"; // "+00" -> "+00:00", which Date accepts
    } else if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(str)) {
        str += "Z";
    }

    return new Date(str).getTime();
};

module.exports = {
    toMillis
};
