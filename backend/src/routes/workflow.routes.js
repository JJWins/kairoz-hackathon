const express = require("express");
const router = express.Router();
const WorkflowController = require("../controllers/workflow.controller");

router.get("/details/:recordId", WorkflowController.getWorkflowDetails);
router.get("/available-actions/:statusCode", WorkflowController.getAvailableActions);
router.get("/possible-paths/:actionCode", WorkflowController.getPossiblePaths);

module.exports = router;
