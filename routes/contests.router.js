const express = require("express");
const {
  getAllContests,
  getContests,
  scrape,
} = require("../controllers/contests.controller");

const router = express.Router();

// Route to serve all available platform contest data
router.post("/contests/all", getAllContests);
router.get("/contests/:platform", getContests);
router.get("/scrape", scrape);

module.exports = router;
