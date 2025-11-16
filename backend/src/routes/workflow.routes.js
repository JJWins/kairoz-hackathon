const express = require("express");
const router = express.Router();
const WorkflowController = require("../controllers/workflow.controller");

router.get("/details/:recordId", WorkflowController.getWorkflowDetails);
router.get("/available-actions/:statusCode", WorkflowController.getAvailableActions);
router.get("/possible-paths/:actionCode", WorkflowController.getPossiblePaths);
router.get("/route-log/:moduleItemKey", WorkflowController.getRouteLog);
router.get("/get-status-details/:moduleItemKey", WorkflowController.getStatusAndTasks);
router.get("/get-status-code-details/:headerId/:statusCode", WorkflowController.getStatusHistoryByCode);

module.exports = router;
