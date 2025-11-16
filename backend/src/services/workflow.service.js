const { WorkflowRecord } = require("../models/workflow.model");
const db = require("../config/database");
const { headerSql, historySql, availableWorkflowSql, getPossiblePathsSql, getWorkflowRouteLogSql, statusSql, taskSql, getStatusSQL } = require("../sql/workflow.queries");

exports.getWorkflowDetails = (recordId) => {
    return new Promise((resolve, reject) => {

        // Fetch header details
        db.query(headerSql, [recordId], (err, results) => {
            if (err) return reject(err);
            if (!results || results.length === 0) return resolve(null);

            const row = results[0];

            // Build response object based on WorkflowRecord modal
            const response = {};
            Object.keys(WorkflowRecord).forEach((key) => {
                response[key] = row[key] ?? null;
            });

            // Initialize workflow containers
            response.nodes = [];
            response.edges = [];

            // Fetch workflow status history
            db.query(historySql, [recordId], (err2, historyRows) => {
                if (err2) return reject(err2);

                if (historyRows.length > 0) {
                    // Build nodes
                    response.nodes = historyRows.map((h) => ({
                        id: String(h.SR_STATUS_HISTORY_ID),
                        statusCode: h.STATUS_CODE,
                        label: h.DESCRIPTION,
                        status: h.DESCRIPTION,
                        owner: null,
                        timestamp: h.UPDATE_TIMESTAMP
                    }));

                    // Build edges (A → B → C)
                    for (let i = 0; i < historyRows.length - 1; i++) {
                        const curr = historyRows[i];
                        const next = historyRows[i + 1];

                        if (!curr.STATUS_CODE || !next.STATUS_CODE) continue;

                        response.edges.push({
                            id: String(curr.SR_STATUS_HISTORY_ID),
                            source: String(curr.DESCRIPTION),
                            target: String(next.DESCRIPTION),
                        });
                    }
                }

                resolve(response);
            });
        });
    });
};

exports.getAvailableActions = (statusCode) => {
    return new Promise((resolve, reject) => {


        db.query(availableWorkflowSql, [statusCode], (err, rows) => {
            if (err) return reject(err);

            if (!rows || rows.length === 0) {
                return resolve({
                    statusCode,
                    statusDescription: null,
                    type: "availableActions",
                    availableActions: []
                });
            }

            resolve({
                statusCode: rows[0].statusCode,
                status: rows[0].statusDescription,
                type: "availableActions",
                actions: rows.map(r => ({
                    actionCode: r.actionCode,
                    actionName: r.actionName
                }))
            });
        });
    });
};

exports.getPossiblePaths = (actionCode) => {
    return new Promise((resolve, reject) => {

        db.query(getPossiblePathsSql, [actionCode], (err, rows) => {
            if (err) return reject(err);

            if (!rows || rows.length === 0) {
                return resolve({
                    actionCode,
                    nextStatus: null
                });
            }

            const r = rows[0];

            resolve({
                actionCode: r.actionCode,
                actionName: r.actionName,
                paths: {
                    statusCode: r.nextStatusCode,
                    statusName: r.nextStatusName
                }
            });
        });
    });
};

exports.getWorkflowRouteLog = (moduleItemId) => {
    return new Promise((resolve, reject) => {

        db.query(getWorkflowRouteLogSql, [moduleItemId], (err, rows) => {
            if (err) return reject(err);

            if (!rows || rows.length === 0) {
                return resolve({
                    moduleItemId,
                    workflow: null,
                    stops: []
                });
            }

            const header = {
                workflowId: rows[0].WORKFLOW_ID,
                workflowStartDate: rows[0].WORKFLOW_START_DATE,
                workflowEndDate: rows[0].WORKFLOW_END_DATE
            };

            // GROUP BY STOP (MAP_NUMBER)
            const stopGroup = {};

            rows.forEach(r => {
                const stopNumber = r.MAP_NUMBER;

                if (!stopGroup[stopNumber]) {
                    stopGroup[stopNumber] = {
                        mapNumber: stopNumber,
                        mapName: r.MAP_NAME, 
                        stopName: r.STOP_NAME,
                        approvers: []
                    };
                }

                stopGroup[stopNumber].approvers.push({
                    approverPersonId: r.APPROVER_PERSON_ID,
                    approverName: r.approverName,
                    approvalStatusCode: r.approvalStatusCode,
                    approvalStatus: r.approvalStatus
                });
            });

            resolve({
                ...header,
                stops: Object.values(stopGroup)
            });
        });
    });
};

exports.getStatusAndTasks = (moduleItemKey) => {
    return new Promise((resolve, reject) => {


        // Execute both queries
        db.query(statusSql, [moduleItemKey], (err, statusRows) => {
            if (err) return reject(err);

            db.query(taskSql, [moduleItemKey], (err, taskRows) => {
                if (err) return reject(err);

                // GROUP STATUS
                const statusGroup = {};
                statusRows.forEach(r => {
                    if (!statusGroup[r.STATUS_CODE]) {
                        statusGroup[r.STATUS_CODE] = {
                            statusCode: r.STATUS_CODE,
                            statusDescription: r.statusDescription,
                            history: []
                        };
                    }

                    statusGroup[r.STATUS_CODE].history.push({
                        actionStartTime: r.ACTION_START_TIME,
                        actionEndTime: r.ACTION_END_TIME
                    });
                });

                // GROUP TASKS
                const taskGroup = {};
                taskRows.forEach(t => {
                    const key = `${t.task_type_code}-${t.task_status_code}`;

                    if (!taskGroup[key]) {
                        taskGroup[key] = {
                            taskType: t.taskTypeDescription,
                            taskStatus: t.taskStatusDescription,
                            details: []
                        };
                    }

                    taskGroup[key].details.push({
                        taskTypeCode: t.task_type_code,
                        taskStatusCode: t.task_status_code,
                        assignedTo: t.assigneeName,
                        createdBy: t.creatorName,
                        description: t.description,
                        createTimestamp: t.create_timestamp,
                        dueDate: t.due_date,
                        assignedOn: t.assigned_on
                    });
                });

                // Final Response
                resolve({
                    moduleItemKey,
                    statusHistory: Object.values(statusGroup),
                    tasks: Object.values(taskGroup)
                });
            });
        });
    });
};

exports.getStatusDetails = (headerId, statusCode) => {
    return new Promise((resolve, reject) => {

        db.query(getStatusSQL, [headerId, statusCode], (err, rows) => {
            if (err) return reject(err);

            if (!rows || rows.length === 0) {
                return resolve({
                    headerId,
                    statusCode,
                    statusDescription: null,
                    details: []
                });
            }

            const response = {
                moduleItemKey: headerId,
                statusCode: rows[0].STATUS_CODE,
                statusDescription: rows[0].statusDescription,
                details: rows.map(r => ({
                    actionStartTime: r.ACTION_START_TIME,
                    actionEndTime: r.ACTION_END_TIME,
                    updatedByName: r.updatedByName
                }))
            };

            resolve(response);
        });
    });
};


