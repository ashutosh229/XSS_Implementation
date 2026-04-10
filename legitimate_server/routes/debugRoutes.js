const express = require("express");
const router = express.Router();
const debugController = require("../controllers/debugController");

router.get("/sessions", debugController.getSessions);

module.exports = router;
