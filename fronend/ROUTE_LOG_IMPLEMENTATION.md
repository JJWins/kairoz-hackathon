# Route Log Implementation

## Overview
When the final workflow node's status is **"Approval in Progress"**, the system displays:
1. Available Actions (existing feature)
2. Route Log Button (new feature - purple pill)
3. Route Log Stops as Branch Nodes (rendered on click)

## Visual Flow

```
[Final State: Approval In Progress]
          |
          ├── [Action: Recalled]
          ├── [Action: Withdraw]
          └── [📋 Route Log] (Purple Pill)
                    |
                    ├── [Stop 1: HOD Review] (Purple bordered card)
                    │     • 2 Waiting, 1 Pending
                    │
                    └── [Stop 2: HOD Review] (Purple bordered card)
                          • 3 Pending
```

## Implementation Details

### 1. Detection Logic
The system checks if the final node's state contains both "approval" and "progress" (case-insensitive):

```typescript
const hasApprovalInProgress = 
  finalNode.state.toLowerCase().includes('approval') && 
  finalNode.state.toLowerCase().includes('progress');
```

### 2. API Integration

#### Endpoint
```
GET http://10.199.100.192:4000/lifecycle/workflows/route-log/{recordId}
```

#### Response Structure
```typescript
interface ApiRouteLogResponse {
  workflowId: number;
  workflowStartDate: string;
  workflowEndDate: string | null;
  stops: ApiRouteLogStop[];
}

interface ApiRouteLogStop {
  mapNumber: number;
  mapName: string;
  approvers: ApiRouteLogApprover[];
}

interface ApiRouteLogApprover {
  approverPersonId: string;
  approverName: string;
  approvalStatusCode: string;  // 'W' = Waiting, 'T' = To be submitted, 'A' = Approved
  approvalStatus: string;       // 'Waiting for approval', 'To be submitted', 'Approved'
}
```

#### Example API Response
```json
{
  "workflowId": 5362,
  "workflowStartDate": "2025-11-16T04:54:23.000Z",
  "workflowEndDate": null,
  "stops": [
    {
      "mapNumber": 1,
      "mapName": "HOD Review",
      "approvers": [
        {
          "approverPersonId": "900048864",
          "approverName": "Saeki, Souichi",
          "approvalStatusCode": "W",
          "approvalStatus": "Waiting for approval"
        }
      ]
    }
  ]
}
```

### 3. Visual Representation

#### Route Log Button Node
- **Color**: Purple (#7C3AED)
- **Icon**: 📋 emoji
- **Label**: "Route Log"
- **Size**: 150px × 50px (pill shape)
- **Position**: Below available action nodes
- **Shadow**: Purple tinted shadow (rgba(124,58,237,0.3))
- **Behavior**: Clickable - fetches and renders route log stops

#### Route Log Stop Nodes
- **Color**: White with purple border (#7C3AED, 2px solid)
- **Size**: 280px × 140px minimum
- **Layout**: Card-style with purple top bar
- **Content**:
  - Stop number and map name (e.g., "1. HOD Review")
  - Total approver count
  - Status badges showing counts:
    - 🟡 Waiting: Amber (#F59E0B)
    - ⚪ Pending: Gray (#6B7280)  
    - 🟢 Approved: Green (#10B981)
- **Position**: Vertically stacked below route log button (180px apart)
- **Behavior**: Clickable - shows detailed approver information

### 4. Interaction Flow

#### Step 1: Click Route Log Button
1. User clicks purple "📋 Route Log" pill
2. System calls `lifecycleService.getRouteLog(recordId)`
3. API returns route log data with stops and approvers
4. `renderRouteLogStops()` creates graph nodes for each stop

#### Step 2: View Stop Nodes
- Each stop appears as a card showing:
  - Stop number and name
  - Total number of approvers
  - Badge counts by status (Waiting/Pending/Approved)
- Nodes are connected from Route Log button with bezier curves

#### Step 3: Click Stop Node (Optional)
1. User clicks on a stop card
2. `showApproverDetails()` displays detailed list:
   - Approver name
   - Approval status
   - Person ID
3. Currently shows in alert (TODO: proper modal)

### 5. Status Code Mapping

| Code | Status Text | Badge Color | Meaning |
|------|-------------|-------------|---------|
| W | Waiting for approval | Amber (#F59E0B) | Approver has not yet approved |
| T | To be submitted | Gray (#6B7280) | Pending submission to approver |
| A | Approved | Green (#10B981) | Approver has approved |

### 6. Files Modified

#### `/src/app/services/lifecycle.ts`
- Updated `ApiRouteLogApprover` interface with correct fields
- Updated `ApiRouteLogStop` interface with mapNumber
- Added `getRouteLog(recordId: string)` method

#### `/src/app/components/workflow-canvas/workflow-canvas.ts`
- Modified `loadAvailableActionsForFinalState()` to detect approval status
- Modified `renderAvailableActions()` to accept `includeRouteLog` parameter
- Added `renderRouteLogNode()` method to create the route log button
- Added `loadRouteLogData()` method to fetch route log via API
- Added `renderRouteLogStops()` method to create stop nodes with status badges
- Added `showApproverDetails()` method to display approver information
- Added click handler for route log button nodes
- Added click handler for route log stop nodes
- Added route log button styling in Cytoscape configuration
- Added route log stop node styling in Cytoscape configuration (280×140)
- Added route log button HTML template in nodeHtmlLabel
- Added route log stop HTML template with status badges

### 7. Node Data Structure

#### Route Log Button Node
```typescript
{
  id: 'route-log-${timestamp}',
  label: 'Route Log',
  type: 'route-log',
  recordId: string  // From workflow record
}
```

#### Route Log Stop Node
```typescript
{
  id: 'route-log-stop-${mapNumber}',
  label: string,              // mapName (e.g., "HOD Review")
  mapNumber: number,          // Stop sequence number
  type: 'route-log-stop',
  approvers: ApiRouteLogApprover[],
  approversSummary: string,   // Formatted text of all approvers
  waitingCount: number,       // Count of approvers with status 'W'
  toBeSubmittedCount: number, // Count of approvers with status 'T'
  approvedCount: number,      // Count of approvers with status 'A'
  totalApprovers: number
}
```

### 8. Layout Algorithm

```typescript
// Route log stop nodes are positioned vertically
const yOffset = 150 + (index * 180); // First stop at +150px, then 180px apart
position: {
  x: routeLogPos.x,  // Same X as route log button
  y: routeLogPos.y + yOffset
}
```

### 9. Example Usage

When a workflow has a final state like:
```json
{
  "id": "12345",
  "state": "Approval in Progress",
  "actor": "Finance Team",
  "date": "2024-01-15"
}
```

The system will:
1. Render available actions (e.g., "Recalled", "Withdraw")
2. **Additionally** render a purple "📋 Route Log" button
3. When clicked, fetch route log data from API
4. Render each stop as a card node showing:
   - "1. HOD Review" with "3 Approver(s)"
   - Status badges: "2 Waiting", "1 Pending"
5. When stop card clicked, show detailed list of all approvers

### 10. Future Enhancements (TODO)

- [ ] Replace `alert()` with proper modal/panel component for approver details
- [ ] Add loading spinner while fetching route log data
- [ ] Add error handling UI (toast notifications)
- [ ] Add animated expand/collapse for stop nodes
- [ ] Show approver avatars/photos
- [ ] Add timeline view showing approval progression
- [ ] Support filtering approvers by status
- [ ] Add export functionality (PDF/CSV) for route log
- [ ] Cache route log data to avoid redundant API calls
- [ ] Add approval action buttons directly on stop cards
- [ ] Show approval timestamps and comments
- [ ] Highlight current approval step

### 11. Testing

To test this feature:
1. Ensure a workflow has a final node with state "Approval in Progress"
2. Verify that action nodes AND a purple "📋 Route Log" button appear
3. Click the route log button
4. Confirm stop nodes appear below showing map names and status counts
5. Click a stop card
6. Verify alert shows detailed approver list with names, statuses, and IDs

### 12. Configuration

#### Route Log Button
Customize in `renderRouteLogNode()`:
- **Color**: Change `#7C3AED` in Cytoscape style and HTML template
- **Position**: Adjust `y: maxY + 120` (default: 120px below actions)
- **Size**: Modify `width: 150, height: 50` in node style

#### Route Log Stop Cards
Customize in `renderRouteLogStops()` and HTML template:
- **Color**: Change `#7C3AED` border color
- **Position**: Adjust `yOffset = 150 + (index * 180)` (spacing between stops)
- **Size**: Modify `width: 280px; min-height: 140px` in template
- **Badge Colors**: Update status color mapping in `getStatusBadge()`

### 13. API Service Method

```typescript
getRouteLog(recordId: string): Observable<ApiRouteLogResponse> {
  return this.http.get<ApiRouteLogResponse>(
    `${this.apiUrl}/lifecycle/workflows/route-log/${recordId}`
  );
}
```

## Summary

The route log feature provides a complete approval routing visualization:
1. **Button Node**: Clickable purple pill to load route log
2. **Stop Nodes**: Cards showing each approval stop with status summary
3. **Detail View**: Click stops to see full approver list
4. **Status Tracking**: Color-coded badges for Waiting/Pending/Approved counts
5. **Hierarchical Display**: Branch structure from Route Log → Stops

This gives users full visibility into the approval workflow process, showing which approvers are involved at each stop and their current approval status.
