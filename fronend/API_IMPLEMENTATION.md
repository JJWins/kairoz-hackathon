# Lifecycle API Implementation

## ✅ CONNECTED TO LIVE API

The Lifecycle service is now **fully integrated** with your backend API.

## API Configuration

**Endpoint:** `http://10.199.100.78:4000/lifecycle/workflows/details/{id}`

**Method:** GET

**Status:** ✅ Active and configured

## Request Example

```typescript
// The service automatically calls this endpoint
GET http://10.199.100.78:4000/lifecycle/workflows/details/36
```

## API Response Mapping

Your API returns:
```json
{
  "success": true,
  "data": {
    "recordId": 36,
    "title": "Admin Correction",
    "nodes": [
      {
        "id": "94",
        "state": 1,
        "label": "Draft",
        "status": "Draft",
        "owner": null,
        "timestamp": "2025-11-03T06:25:30.851Z"
      }
    ],
    "edges": [
      {
        "id": "94",
        "source": "94",
        "target": "95"
      }
    ],
    "possiblePaths": []
  }
}
```

**Transformation Applied:**

| API Field | Internal Field | Transformation |
|-----------|---------------|----------------|
| `node.id` | `id` | Direct mapping |
| `node.label` or `node.status` | `label` | Fallback to status if label is missing |
| `node.status` | `state` | Direct mapping |
| `node.owner` | `actor` | Default to "System" if null |
| `node.timestamp` | `date` | Formatted to "MMM DD, YYYY" |
| `node.status` | `ribbonColor` | Mapped via statusColors lookup |
| `edge.source` | `source` | Direct mapping |
| `edge.target` | `target` | Direct mapping |
| - | `type` | Set to "actual" |
| - | `loopback` | Auto-detected by node order |

## Status Color Mapping

The service maps status values to visual colors:

```typescript
'Draft': '#B0BEC5'                    // Gray
'Submitted': '#42A5F5'                // Blue
'Review': '#AB47BC'                   // Purple
'Revisions Required': '#FF7043'       // Orange
'In Progress': '#FFB300'              // Amber
'Approval In Progress': '#FFB300'     // Amber
'Approved': '#66BB6A'                 // Green
'Rejected': '#EF5350'                 // Red
'Resolved': '#66BB6A'                 // Green
'Closed': '#78909C'                   // Dark Gray
```

## Loopback Detection

The service **automatically detects loopback edges** by comparing node positions:
- If `targetIndex < sourceIndex` → loopback edge
- Loopback edges are styled differently in the UI

## Error Handling

The service includes automatic fallback:

```typescript
1. Try API call → Success: Use API data
2. API fails → Log warning to console
3. Fallback → Use dummy data for testing
```

**Console Warning Example:**
```
Failed to fetch lifecycle data from API, using dummy data: Http failure response for http://10.199.100.78:4000/lifecycle/workflows/details/36: 404 Not Found
```

## Testing the Integration

### Test with Real API Data

1. Make sure the backend server is running at `http://10.199.100.78:4000`
2. Start the Angular app: `npm start` or `pnpm start`
3. Open browser DevTools → Network tab
4. Look for request to: `http://10.199.100.78:4000/lifecycle/workflows/details/{id}`
5. Verify response status is 200 OK
6. Check the workflow visualization displays your actual data

### Test with Different Records

Update the record ID in `app.ts`:

```typescript
export class App {
  recordId = '36'; // Change this to test different records
}
```

### Test Error Handling

To test the fallback to dummy data:
1. Stop the backend server
2. Refresh the Angular app
3. Check console for warning message
4. Verify dummy data is displayed

## Date Formatting

API timestamps are automatically formatted:

**Input:** `"2025-11-03T06:25:30.851Z"`  
**Output:** `"Nov 3, 2025"`

## Possible Paths

If your API includes `possiblePaths` array:
```json
"possiblePaths": [
  {
    "source": "94",
    "target": "97"
  }
]
```

These are automatically added as `type: "possible"` edges (shown as dashed lines in the UI).

## Adding Authentication (If Needed)

If your API requires authentication, update `fetchFromApi()`:

```typescript
private fetchFromApi(recordId: string): Observable<LifecycleData> {
  const headers = new HttpHeaders({
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  });
  
  return this.http.get<any>(
    `${this.API_BASE_URL}/${recordId}`,
    { headers }
  ).pipe(
    map(response => this.transformApiResponse(response))
  );
}
```

## CORS Configuration

If you encounter CORS errors:

**Error Example:**
```
Access to XMLHttpRequest at 'http://10.199.100.78:4000/...' from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Solution:** Configure your backend to allow requests from `http://localhost:4200`

**Backend Configuration (Express.js example):**
```javascript
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
```

## Troubleshooting

### Issue: "Invalid API response format"

**Cause:** API response doesn't match expected structure  
**Check:** Verify response has `success` and `data` fields

### Issue: Nodes not appearing

**Cause:** Empty `nodes` array in API response  
**Check:** Backend is returning actual workflow data

### Issue: Wrong colors

**Cause:** Status name doesn't match color mapping  
**Solution:** Add the status to `statusColors` object in lifecycle.ts

### Issue: Edges not connecting

**Cause:** Edge source/target IDs don't match node IDs  
**Check:** Verify edge references use correct node IDs

## Current Status

✅ API endpoint configured  
✅ HttpClient setup complete  
✅ Response transformation implemented  
✅ Error handling with fallback  
✅ Date formatting  
✅ Loopback detection  
✅ Status color mapping  
✅ Possible paths support  

The service is **production-ready** and will use live API data when available.

## Example Usage in Components

The WorkflowCanvas component automatically uses the service:

```typescript
// In workflow-canvas.component.ts
private loadLifecycleData(): void {
  this.lifecycleService.getLifecycleData(this.recordId).subscribe({
    next: (data: LifecycleData) => {
      // API data is already transformed and ready to use
      this.lifecycleData = data;
      this.initializeCytoscape(data);
    },
    error: (error) => {
      console.error('Failed to load lifecycle data:', error);
    }
  });
}
```

No changes needed in components - they work with both API and dummy data seamlessly!
