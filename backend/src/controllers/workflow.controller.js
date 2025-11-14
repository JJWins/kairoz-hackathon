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

        res.json({ record });
    } catch (err) {
        next(err);
    }
};
