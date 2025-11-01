# Intelligent Field Inference

## Overview

The backend now includes intelligent field inference logic that automatically fills in missing fields from AI responses based on existing information.

## Implementation

### Function: `infer_missing_fields(ai_result, request_data)`

This function intelligently infers missing fields using multiple strategies:

### 1. **Destination Inference**
- Extracts destination from requirements text
- Supports Chinese and English city names:
  - 上海/Shanghai
  - 北京/Beijing
  - 成都/Chengdu
  - 三亚/Sanya
  - 东京/Tokyo
  - 西安/Xi'an
- Falls back to "Unknown" if not found

### 2. **Departure Inference**
- Extracts departure city from requirements text
- Patterns: "从北京", "from beijing", "beijing to"
- Supports: Beijing, Shanghai, Chengdu
- Optional field (can remain None)

### 3. **Total Days Inference**
Priority order:
1. From itinerary length (if itinerary exists)
2. From requirements text (e.g., "5天", "3日")
3. Default: 3 days

### 4. **Start Date Inference**
- Default: 7 days from current date
- Format: YYYY-MM-DD

### 5. **End Date Inference**
Priority order:
1. Calculated from `startDate + (totalDays - 1)`
2. Default: 9 days from current date (for 3-day default trip)

### 6. **Itinerary Date Completion**
- Automatically fills missing `date` fields in itinerary items
- Calculates dates based on `startDate` and day index
- Ensures all itinerary days have valid dates

### 7. **Budget Inference**
- Extracts budget from requirements text
- Patterns: "10000元", "1万元", "5000yuan"
- Supports "万" (10,000 multiplier)
- Falls back to 10,000 CNY if not found

### 8. **Trip Name Generation**
Intelligent trip name generation:
- Format: "{destination} {totalDays}日游" (e.g., "上海 5日游")
- Falls back to: "旅行计划 - {current_date}" if destination is unknown

## Usage Example

### Input (AI returns incomplete data):
```json
{
  "itinerary": [
    {"day": 1, "title": "Day 1", "activities": [...]},
    {"day": 2, "title": "Day 2", "activities": [...]}
  ]
}
```

### After Inference:
```json
{
  "destination": "Shanghai",
  "departure": "Beijing",
  "totalDays": 2,
  "startDate": "2024-11-06",
  "endDate": "2024-11-07",
  "budget": 10000.0,
  "itinerary": [
    {"day": 1, "date": "2024-11-06", "title": "Day 1", ...},
    {"day": 2, "date": "2024-11-07", "title": "Day 2", ...}
  ],
  ...
}
```

## Logging

All inference operations are logged with `[API]` prefix:
- `[API] Inferring destination from requirements...`
- `[API] Inferred destination: Shanghai`
- `[API] Inferred totalDays from itinerary length: 5`
- `[API] Added date to day 1: 2024-11-06`

## Error Handling

- All inference operations have fallback defaults
- Date parsing errors are caught and handled gracefully
- Invalid data types are automatically converted
- System continues to function even if inference fails

## Benefits

1. **Resilience**: System works even if AI returns incomplete data
2. **User Experience**: Users get complete trips even with partial AI responses
3. **Debugging**: Detailed logs help identify data quality issues
4. **Flexibility**: Handles various AI response formats

## Future Enhancements

- [ ] More sophisticated NLP for destination/departure extraction
- [ ] Integration with external APIs for location validation
- [ ] Learning from user corrections to improve inference accuracy
- [ ] Support for more languages and date formats

---

**Version**: 1.0.0  
**Last Updated**: 2024-10-30



