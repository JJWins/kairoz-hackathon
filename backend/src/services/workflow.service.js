const { WorkflowRecord } = require("../models/workflow.model");
const db = require("../config/database");
const { headerSql, historySql, availableWorkflowSql, getPossiblePathsSql } = require("../sql/workflow.queries");

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
                        state: h.STATUS_CODE,
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
