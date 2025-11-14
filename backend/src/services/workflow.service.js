const { WorkflowRecord } = require("../models/workflow.model");
const db = require("../config/database");

exports.getWorkflowDetails = (recordId) => {
    return new Promise((resolve, reject) => {

        const headerSql = `
            SELECT
                sh.SR_HEADER_ID AS recordId,
                sh.SUBJECT AS title,
                NULL AS currentState,
                sh.CREATE_TIMESTAMP AS createTimeStamp,
                sh.UPDATE_TIMESTAMP AS updateTimeStamp,
                sh.UPDATE_USER AS updateUser,
                sh.CREATE_USER AS createUser,
                sp.DESCRIPTION AS priority,
                sc.DESCRIPTION AS category,
                sh.UNIT_NUMBER AS unitNumber,
                u.unit_name AS unitName
            FROM sr_header sh
            LEFT JOIN sr_category sc ON sh.CATEGORY_CODE = sc.CATEGORY_CODE
            LEFT JOIN sr_priority sp ON sh.PRIORITY_ID = sp.PRIORITY_ID
            LEFT JOIN unit u ON sh.UNIT_NUMBER = u.unit_number
            WHERE sh.SR_HEADER_ID = ?
            LIMIT 1
        `;

        const historySql = `
            SELECT
                h.SR_STATUS_HISTORY_ID,
                h.STATUS_CODE,
                h.ACTION_START_TIME,
                h.ACTION_END_TIME,
                h.UPDATE_TIMESTAMP,
                s.DESCRIPTION
            FROM sr_status_history h
            LEFT JOIN sr_status s ON h.STATUS_CODE = s.STATUS_CODE
            WHERE h.SR_HEADER_ID = ?
            ORDER BY h.UPDATE_TIMESTAMP ASC
        `;

        // Fetch header details
        db.query(headerSql, [recordId], (err, results) => {
            if (err) return reject(err);
            if (!results || results.length === 0) return resolve(null);

            const row = results[0];

            // Create the base response object based on WorkflowRecord modal
            const response = {};

            Object.keys(WorkflowRecord).forEach((key) => {
                response[key] = row[key] ?? null;
            });

            // Initialize workflow containers
            response.nodes = [];
            response.edges = [];
            response.possiblePaths = [];

            // Fetch workflow status history
            db.query(historySql, [recordId], (err2, historyRows) => {
                if (err2) return reject(err2);

                if (historyRows.length > 0) {
                    // Build workflow nodes
                    response.nodes = historyRows.map((h) => ({
                        id: String(h.SR_STATUS_HISTORY_ID),
                        state: h.STATUS_CODE,
                        label: h.DESCRIPTION,
                        status: h.DESCRIPTION,
                        owner: null,
                        timestamp: h.UPDATE_TIMESTAMP,
                        metadata: {
                            durationInState: null,
                            comments: null,
                            revisionNumber: null,
                            changeSummary: null,
                            submissionMethod: null,
                            assignedReviewer: null,
                            notes: null,
                            approvalLevel: null,
                        },
                    }));

                    // Build workflow edges (A → B → C)
                    for (let i = 0; i < historyRows.length - 1; i++) {
                        const curr = historyRows[i];
                        const next = historyRows[i + 1];

                        // Prevent faulty edges
                        if (!curr.STATUS_CODE || !next.STATUS_CODE) continue;

                        response.edges.push({
                            id: String(curr.SR_STATUS_HISTORY_ID),
                            source: String(curr.SR_STATUS_HISTORY_ID),
                            target: String(next.SR_STATUS_HISTORY_ID),
                        });
                    }
                }

                resolve(response);
            });
        });
    });
};
