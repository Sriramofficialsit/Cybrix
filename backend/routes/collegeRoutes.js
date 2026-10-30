const express = require("express");
const router = express.Router();

const { getColleges } = require("../controllers/collegeController");

router.get("/", getColleges);

module.exports = router;