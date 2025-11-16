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
    `,
    getWorkflowRouteLogSql: `
            SELECT
                w.WORKFLOW_ID,
                w.WORKFLOW_START_DATE,
                w.WORKFLOW_END_DATE,

                wd.MAP_NUMBER,
                wm.MAP_NAME,

                wd.APPROVER_PERSON_ID,
                p.FULL_NAME AS approverName,
                wd.APPROVAL_STATUS as approvalStatusCode,
                ws.DESCRIPTION as approvalStatus

            FROM workflow w
            LEFT JOIN workflow_detail wd
                ON wd.WORKFLOW_ID = w.WORKFLOW_ID
            LEFT JOIN workflow_map wm
                ON wm.MAP_ID = wd.MAP_ID
            LEFT JOIN person p
                ON p.PERSON_ID = wd.APPROVER_PERSON_ID
            LEFT JOIN workflow_status ws
                ON ws.APPROVAL_STATUS = wd.APPROVAL_STATUS    

            WHERE w.MODULE_ITEM_ID = ?
            ORDER BY wd.MAP_NUMBER
        `,

        statusSql: `
            SELECT
                h.ACTION_START_TIME,
                h.ACTION_END_TIME,
                h.STATUS_CODE,
                s.DESCRIPTION AS statusDescription
            FROM sr_status_history h
            LEFT JOIN sr_status s
                ON s.STATUS_CODE = h.STATUS_CODE
            WHERE h.SR_HEADER_ID = ?
            ORDER BY h.ACTION_START_TIME ASC
        `,

        taskSql: `
            SELECT
                t.task_type_code,
                tt.description AS taskTypeDescription,

                t.task_status_code,
                ts.description AS taskStatusDescription,

                t.assignee_person_id,
                assignee.FULL_NAME AS assigneeName,

                t.create_user,
                creator.FULL_NAME AS creatorName,

                t.description,
                t.create_timestamp,
                t.due_date,
                t.assigned_on

            FROM sr_task t
            LEFT JOIN person assignee
                ON assignee.PERSON_ID = t.assignee_person_id
            LEFT JOIN person creator
                ON creator.PERSON_ID = t.create_user
            LEFT JOIN sr_type tt
                ON tt.TYPE_CODE = t.task_type_code
            LEFT JOIN sr_task_status ts
                ON ts.task_status_code = t.task_status_code
            WHERE t.SR_HEADER_ID = ?
            ORDER BY t.create_timestamp ASC
        `,

        getStatusSQL: `
            SELECT
                h.ACTION_START_TIME,
                h.ACTION_END_TIME,
                h.STATUS_CODE,
                s.DESCRIPTION AS statusDescription,
                p.FULL_NAME AS updatedByName
            FROM sr_status_history h
            LEFT JOIN sr_status s
                ON s.STATUS_CODE = h.STATUS_CODE
            LEFT JOIN person p
                ON p.USER_NAME = h.UPDATE_USER
            WHERE h.SR_HEADER_ID = ?
              AND h.STATUS_CODE = ?
            ORDER BY h.ACTION_START_TIME ASC
        `

};
