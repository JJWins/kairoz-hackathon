module.exports = {
    headerSql: `
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
    `,

    historySql: `
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
    `,

    availableWorkflowSql: `
        SELECT
            aa.STATUS_CODE AS statusCode,
            s.DESCRIPTION AS statusDescription,
            aa.ACTION_TYPE_CODE AS actionCode,
            at.DESCRIPTION AS actionName
        FROM sr_available_action aa
        LEFT JOIN sr_action_type at
        ON at.ACTION_TYPE_CODE = aa.ACTION_TYPE_CODE
        LEFT JOIN sr_status s
            ON s.STATUS_CODE = aa.STATUS_CODE
            WHERE aa.STATUS_CODE = ?
    `,

    getPossiblePathsSql: `
        SELECT
            at.ACTION_TYPE_CODE AS actionCode,
            at.DESCRIPTION AS actionName,
            at.STATUS_CODE AS nextStatusCode,
            ss.DESCRIPTION AS nextStatusName
        FROM sr_action_type at
        LEFT JOIN sr_status ss
            ON ss.STATUS_CODE = at.STATUS_CODE
            WHERE at.ACTION_TYPE_CODE = ?
    `
};
