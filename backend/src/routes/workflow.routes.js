const express = require("express");
const router = express.Router();
const WorkflowController = require("../controllers/workflow.controller");

router.get("/details/:recordId", WorkflowController.getWorkflowDetails);
router.get("/available-actions/:statusCode", WorkflowController.getAvailableActions);
router.get("/possible-paths/:actionCode", WorkflowController.getPossiblePaths);
router.get("/route-log/:moduleItemKey", WorkflowController.getRouteLog);

module.exports = router;
