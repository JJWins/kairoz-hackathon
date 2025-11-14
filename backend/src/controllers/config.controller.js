const WorkflowService = require("../services/config.service");

exports.getModuleLookup = (req, res) => {
    const sql = `
        SELECT 
            MODULE_CODE AS moduleCode,
            DESCRIPTION AS description
        FROM coeus_module
        ORDER BY MODULE_CODE ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        return res.status(200).json({
            success: true,
            data: results
        });
    });
};
