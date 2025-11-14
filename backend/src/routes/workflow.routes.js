const express = require("express");
const router = express.Router();
const WorkflowController = require("../controllers/workflow.controller");

router.get("/details/:recordId", WorkflowController.getWorkflowDetails);

module.exports = router;
