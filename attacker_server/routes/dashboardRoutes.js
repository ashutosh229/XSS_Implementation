const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/stolen-sessions", dashboardController.getStolenSessionsPage);

module.exports = router;
