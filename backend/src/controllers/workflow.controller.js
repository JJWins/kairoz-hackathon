const WorkflowService = require("../services/workflow.service");

exports.getWorkflowDetails = async (req, res, next) => {
    try {
        const recordId = req.params.recordId;
        if (!recordId) {
            return next({ status: 400, message: "recordId is required" });
        }

        const record = await WorkflowService.getWorkflowDetails(recordId);
        if (!record) {
            return next({ status: 404, message: "Record not found" });
        }

        res.json(record);
    } catch (err) {
        next(err);
    }
};

exports.getAvailableActions = async (req, res, next) => {
    try {
        const statusCode = req.params.statusCode;
        if (!statusCode) {
            return next({ status: 400, message: "Status code is required" })
        }

        const record = await WorkflowService.getAvailableActions(statusCode);
        if (!record) {
            return next({ status: 404, message: "Status code not found" });
        }

        res.json(record);
    } catch (err) {
        next(err);
    }
}


exports.getPossiblePaths = async (req, res, next) => {
    try {
        const actionCode = req.params.actionCode;
        if (!actionCode) {
            return next({ status: 400, message: "Action code is required" })
        }

        const record = await WorkflowService.getPossiblePaths(actionCode)
        if (!record) {
            return next({ status: 404, message: "Action code not found" });
        }

        res.json(record);
    } catch (err) {
        next(err);
    }
}

exports.getRouteLog = async (req, res, next) => {
    try {
        const moduleItemKey = req.params.moduleItemKey;
        if (!moduleItemKey) {
            return next({ status: 400, message: "Module Key is required" })
        }

        const record = await WorkflowService.getWorkflowRouteLog(moduleItemKey)
        if (!record) {
            return next({ status: 404, message: "Module Item Key not found" });
        }

        res.json(record);
    } catch (err) {
        next(err);
    }
}