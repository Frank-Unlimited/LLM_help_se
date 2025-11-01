# Coze Workflow Integration Guide

## Overview

The `ai_service.py` has been updated to use **Coze Workflow** for generating trip itineraries. The system automatically falls back to mock data if Coze is unavailable or fails.

## Setup

### 1. Install Dependencies

```bash
pip install cozepy
```

Or install all dependencies:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables (Optional)

You can set these environment variables to customize the Coze integration:

```bash
# Coze API Token (required)
export COZE_API_TOKEN="your_coze_api_token_here"

# Coze Workflow ID (required)
export COZE_WORKFLOW_ID="7566908212949270528"
```

Or create a `.env` file in the `backend` directory:
```
COZE_API_TOKEN=cztei_hUwd3NvdAAUp4XBPBwWHdG0NJ2hgb2SpaCkENCt2bZLEklR3O7DkqwybOc5xZcpnt
COZE_WORKFLOW_ID=7566908212949270528
```

**Note**: Default values are provided in the code, but it's recommended to use environment variables for production.

## How It Works

### Flow Diagram

```
Request → generate_trip_with_llm()
    │
    ├─→ [Coze Available?]
    │   │
    │   ├─ Yes → _generate_with_coze_workflow()
    │   │        │
    │   │        ├─→ Call Coze Workflow Stream API
    │   │        ├─→ Collect MESSAGE events
    │   │        ├─→ Parse JSON response
    │   │        └─→ Return result
    │   │
    │   └─ No/Failed → generate_mock_trip()
    │                  └─→ Return mock data
    │
    └─→ Return Result
```

### Key Functions

#### `generate_trip_with_llm(request_data)`

Main entry point for trip generation. Automatically handles Coze integration and fallback.

**Input Format**:
```python
{
    "requirementsText": "从北京去上海玩5天",
    "preferences": ["food", "shopping"],
    "travelType": ["food", "culture"],
    "transportPreference": ["high-speed-rail"],
    "accommodationType": ["comfortable"],
    "currency": "CNY"
}
```

**Output Format**:
```python
{
    "departure": "Beijing",
    "destination": "Shanghai",
    "totalDays": 5,
    "startDate": "2024-11-06",
    "endDate": "2024-11-10",
    "budget": 10000.0,
    "itinerary": [...],
    "budgetBreakdown": [...],
    "notes": [...]
}
```

#### `_generate_with_coze_workflow(request_data)`

Internal function that:
1. Formats input data for Coze workflow
2. Streams workflow events
3. Collects MESSAGE events
4. Parses JSON response
5. Handles errors and interrupts

## Workflow Event Handling

### Event Types

1. **MESSAGE**: Contains workflow output/response
   - Extracts `content` from message
   - Combines multiple messages if needed

2. **ERROR**: Workflow execution error
   - Logs error
   - Returns `None` to trigger fallback

3. **INTERRUPT**: Workflow paused for input
   - Automatically resumes with "continue"
   - Handles recursive resume calls

### JSON Parsing

The system handles multiple JSON formats:

1. **Pure JSON**: `{"key": "value"}`
2. **Markdown code block**: ` ```json {...} ``` `
3. **JSON embedded in text**: Extracts `{...}` using regex

## Error Handling & Fallback

### When Fallback Occurs

1. **cozepy not installed**: Falls back to mock data
2. **Coze initialization failed**: Falls back to mock data
3. **Workflow execution error**: Falls back to mock data
4. **No messages received**: Falls back to mock data
5. **JSON parse failed**: Falls back to mock data

### Fallback Behavior

When fallback is triggered:
- Logs error message
- Uses `generate_mock_trip()` function
- Returns mock itinerary data
- System continues to function normally

## Logging

The system provides detailed logging:

```
============================================================
[AI Service] Received trip generation request
============================================================
[Input] Requirements: 从北京去上海玩5天
[Input] Preferences: ['food', 'shopping']
...
[Coze Workflow] Starting workflow execution...
[Coze Workflow] Input data: {...}
[Coze Workflow] Received message: ...
[Coze Workflow] Successfully parsed JSON response
[Output] Departure: Beijing
[Output] Destination: Shanghai
...
============================================================
```

## Testing

### Test Coze Integration

```bash
# Make sure cozepy is installed
pip install cozepy

# Start backend
cd backend
python app.py

# Test API endpoint
curl -X POST http://localhost:3000/api/trips/generate \
  -H "Content-Type: application/json" \
  -d '{
    "requirementsText": "从北京去上海玩5天",
    "preferences": ["food"],
    "travelType": ["food"],
    "transportPreference": [],
    "accommodationType": [],
    "currency": "CNY"
  }'
```

### Test Fallback (Without Coze)

```bash
# Without installing cozepy, the system will automatically use mock data
# Check logs for: "[AI Service] Warning: cozepy not installed"
```

## Troubleshooting

### Issue: "cozepy not installed"

**Solution**: Install cozepy
```bash
pip install cozepy
```

### Issue: "Failed to initialize Coze"

**Solution**: Check API token and base URL
- Verify `COZE_API_TOKEN` is correct
- Ensure network connectivity to Coze API
- Check if using correct base URL (CN vs COM)

### Issue: "No messages received from workflow"

**Possible Causes**:
1. Workflow ID is incorrect
2. Workflow input format doesn't match expected schema
3. Workflow execution failed silently

**Solution**:
- Verify `COZE_WORKFLOW_ID` matches your workflow
- Check workflow input schema in Coze platform
- Review workflow logs in Coze dashboard

### Issue: "Failed to parse JSON"

**Possible Causes**:
1. Workflow returns non-JSON format
2. JSON is embedded in markdown/text
3. JSON structure doesn't match expected format

**Solution**:
- Check workflow output format
- Verify workflow returns valid JSON
- Adjust JSON parsing logic if needed

## Production Recommendations

1. **Use Environment Variables**: Don't hardcode API tokens
2. **Monitor Logs**: Set up log aggregation for workflow errors
3. **Add Retry Logic**: Implement retry for transient failures
4. **Validate Output**: Add schema validation for workflow responses
5. **Rate Limiting**: Consider rate limits for Coze API
6. **Error Alerts**: Set up alerts for frequent fallbacks

## File Structure

```
backend/
├── ai_service.py          # Main AI service with Coze integration
├── requirements.txt       # Includes cozepy dependency
├── COZE_INTEGRATION.md    # This file
└── .env                   # Environment variables (optional)
```

## References

- [Coze Python SDK](https://github.com/coze-dev/coze-py)
- [Coze Workflow Documentation](https://www.coze.com/docs/workflows)

---

**Status**: ? Integrated  
**Fallback**: ? Mock data available  
**Version**: v1.0.0



