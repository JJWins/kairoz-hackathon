const NodeMetadata = {
    durationInState: String,
    comments: String,
    revisionNumber: Number,
    changeSummary: String,
    submissionMethod: String,
    assignedReviewer: String,
    notes: String,
    approvalLevel: String
}

const WorkflowNode = {
    id: String,
    state: String,
    label: String,
    status: String,
    owner: String,
    timestamp: String,
    metadata: NodeMetadata
}

const WorkflowEdge = {
    id: String,
    source: String,
    target: String
}

const PossiblePathGroup = {
    from: String,
    paths: Array
}

const WorkflowRecord = {
    recordId: String,
    title: String,
    currentState: String,
    createTimeStamp: String,
    updateTimeStamp: String,
    updateUser: String,
    createUser: String,
    priority: String,
    category: String,
    unitNumber: Number,
    unitName: String,
    nodes: WorkflowNode,
    edges: WorkflowEdge,
    possiblePaths: PossiblePathGroup
}

module.exports = {
    WorkflowRecord
}
