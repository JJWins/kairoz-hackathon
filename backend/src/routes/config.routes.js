const express = require("express");
const router = express.Router();
const configController = require("../controllers/config.controller");

router.get("/lookup/modules", configController.getModuleLookup);

module.exports = router;
