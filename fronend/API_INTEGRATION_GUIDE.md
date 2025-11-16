# Lifecycle API Integration Guide

## Overview
The `Lifecycle` service is configured to fetch workflow lifecycle data from an API, with automatic fallback to dummy data if the API is unavailable.

## Quick Start

### 1. Configure API Endpoint
Edit `src/app/services/lifecycle.ts` and update the API URL:

```typescript
private readonly API_BASE_URL = 'https://your-backend.com/api/lifecycle';
```

### 2. Enable API Calls
In the `fetchFromApi()` method, remove this line:
```typescript
throw new Error('API not implemented yet'); // DELETE THIS LINE
```

Uncomment and use:
```typescript
return this.http.get<LifecycleData>(`${this.API_BASE_URL}/${recordId}`);
```

### 3. Test
Start the application. The service will:
- Try to fetch from your API
- Fall back to dummy data if API fails
- Log errors to the browser console

## API Response Formats

### Format 1: Direct LifecycleData (Recommended)
If your API returns data in this format, no transformation needed:

```json
{
  "nodes": [
    {
      "id": "draft",
      "label": "Draft",
      "state": "Draft",
      "actor": "Dr. Sarah Chen",
      "date": "Jan 10, 2025",
      "ribbonColor": "#B0BEC5"
    },
    {
      "id": "submitted",
      "label": "Submitted",
      "state": "Submitted",
      "actor": "Dr. Sarah Chen",
      "date": "Jan 12, 2025",
      "ribbonColor": "#42A5F5"
    }
  ],
  "edges": [
    {
      "source": "draft",
      "target": "submitted",
      "type": "actual",
      "loopback": false,
      "transitionDate": "Jan 12, 2025"
    }
  ]
}
```

### Format 2: Chronological History (Auto-transformed)
If your API returns chronological history, it will be automatically processed:

```json
{
  "recordId": "REC-2025-001847",
  "history": [
    {
      "state": "Draft",
      "actor": "Dr. Sarah Chen",
      "timestamp": "2025-01-10T00:00:00Z"
    },
    {
      "state": "Submitted",
      "actor": "Dr. Sarah Chen",
      "timestamp": "2025-01-12T00:00:00Z"
    },
    {
      "state": "Review",
      "actor": "Prof. Michael Brown",
      "timestamp": "2025-01-14T00:00:00Z"
    },
    {
      "state": "Submitted",
      "actor": "Dr. Sarah Chen",
      "timestamp": "2025-01-16T00:00:00Z"
    }
  ]
}
```

The service will:
- Deduplicate nodes (only one node per unique state)
- Generate edges from the chronological sequence
- Automatically detect loopbacks (when state repeats)

## Authentication

### Using Bearer Token
```typescript
private fetchFromApi(recordId: string): Observable<LifecycleData> {
  const token = 'your-auth-token'; // Get from auth service
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  
  return this.http.get<LifecycleData>(
    `${this.API_BASE_URL}/${recordId}`,
    { headers }
  );
}
```

### Using API Key
```typescript
private fetchFromApi(recordId: string): Observable<LifecycleData> {
  const headers = new HttpHeaders({
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  });
  
  return this.http.get<LifecycleData>(
    `${this.API_BASE_URL}/${recordId}`,
    { headers }
  );
}
```

## Custom Transformation

If your API returns a completely different format, implement custom transformation:

```typescript
private transformApiResponse(response: any): LifecycleData {
  // Example: Transform your custom API format
  return {
    nodes: response.statuses.map((status: any) => ({
      id: status.code.toLowerCase(),
      label: status.name,
      state: status.name,
      actor: status.assignedTo,
      date: this.formatDate(status.createdAt),
      ribbonColor: status.color || '#B0BEC5'
    })),
    edges: response.transitions.map((transition: any) => ({
      source: transition.from.toLowerCase(),
      target: transition.to.toLowerCase(),
      type: transition.isComplete ? 'actual' : 'possible',
      loopback: transition.isBacktrack || false,
      transitionDate: this.formatDate(transition.timestamp)
    }))
  };
}
```

## Error Handling

The service automatically handles errors:
- Network failures
- 404 Not Found
- 500 Server errors
- Invalid JSON responses

All errors fall back to dummy data and log warnings to console.

### Custom Error Handling
```typescript
getLifecycleData(recordId: string): Observable<LifecycleData> {
  return this.fetchFromApi(recordId).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 404) {
        console.warn('Record not found, using dummy data');
      } else if (error.status === 401) {
        console.error('Unauthorized, please login');
      }
      return of(this.getDummyData(recordId));
    })
  );
}
```

## Testing

### Test with Real API
1. Update `API_BASE_URL`
2. Remove the `throw new Error()` line
3. Run `npm start` or `pnpm start`
4. Open browser DevTools > Network tab
5. Verify API request is made to your endpoint

### Test Fallback to Dummy Data
1. Set invalid API URL or keep the error throw
2. Check console for warning: "Failed to fetch lifecycle data from API, using dummy data"
3. Verify dummy data is displayed correctly

## Status Color Mapping

Default colors for states (can be customized):

```typescript
private statusColors: { [key: string]: string } = {
  'Draft': '#B0BEC5',           // Gray
  'Submitted': '#42A5F5',       // Blue
  'Review': '#AB47BC',          // Purple
  'Revisions Required': '#FF7043', // Orange
  'In Progress': '#FFB300',     // Amber
  'Approved': '#66BB6A',        // Green
  'Rejected': '#EF5350',        // Red
  'Closed': '#78909C',          // Dark Gray
};
```

Add your custom states to this mapping.

## Complete Example

Here's a complete working example with authentication:

```typescript
import { HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service'; // Your auth service

export class Lifecycle {
  private readonly API_BASE_URL = 'https://api.example.com/lifecycle';
  private authService = inject(AuthService);

  private fetchFromApi(recordId: string): Observable<LifecycleData> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.get<any>(
      `${this.API_BASE_URL}/${recordId}`,
      { headers }
    ).pipe(
      map(response => this.transformApiResponse(response))
    );
  }
}
```

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API endpoint is accessible
3. Check network tab for request/response details
4. Test API endpoint with curl or Postman first
