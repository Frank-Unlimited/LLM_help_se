# -*- coding: utf-8 -*-
"""
AI Service: Generate itinerary using LLM via Coze Workflow
"""
import os
import json
import re
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import uuid
import random

# Coze workflow integration - Required, no fallback
try:
    from cozepy import COZE_CN_BASE_URL, Coze, TokenAuth, Stream, WorkflowEvent, WorkflowEventType
    
    # Get Coze API token from environment variable (required, no default)
    COZE_API_TOKEN = os.getenv("COZE_API_TOKEN")
    if not COZE_API_TOKEN:
        raise ValueError(
            "COZE_API_TOKEN environment variable is required but not set. "
            "Please set it in your .env file or environment variables."
        )
    
    COZE_API_BASE = COZE_CN_BASE_URL
    
    # Workflow ID from Coze platform (required, no default)
    WORKFLOW_ID = os.getenv("COZE_WORKFLOW_ID")
    if not WORKFLOW_ID:
        raise ValueError(
            "COZE_WORKFLOW_ID environment variable is required but not set. "
            "Please set it in your .env file or environment variables."
        )
    
    # Expense parsing workflow ID (required, no default)
    EXPENSE_WORKFLOW_ID = os.getenv("COZE_EXPENSE_WORKFLOW_ID")
    if not EXPENSE_WORKFLOW_ID:
        raise ValueError(
            "COZE_EXPENSE_WORKFLOW_ID environment variable is required but not set. "
            "Please set it in your .env file or environment variables."
        )
    
    # Initialize Coze client
    coze = Coze(auth=TokenAuth(token=COZE_API_TOKEN), base_url=COZE_API_BASE)
    COZE_AVAILABLE = True
    print("[AI Service] Coze workflow initialized successfully")
except ImportError as e:
    COZE_AVAILABLE = False
    coze = None
    raise RuntimeError(f"cozepy package is required but not installed. Please install it with: pip install cozepy. Original error: {str(e)}")
except (ValueError, Exception) as e:
    COZE_AVAILABLE = False
    coze = None
    raise RuntimeError(f"Failed to initialize Coze workflow: {str(e)}")


def generate_trip_with_llm(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate itinerary using Coze Workflow (REQUIRED - no fallback)
    
    This function REQUIRES Coze workflow to be available and functional.
    If Coze workflow fails, an exception will be raised.
    No mock data or fallback is provided.
    
    Raises:
        RuntimeError: If Coze workflow is unavailable or fails
        ValueError: If workflow response cannot be parsed
    """
    
    print("\n" + "="*60)
    print("[AI Service] Received trip generation request")
    print("="*60)
    
    # Parse user requirements
    requirements = request_data.get("requirementsText", "")
    preferences = request_data.get("preferences", [])
    travel_types = request_data.get("travelType", [])
    transport = request_data.get("transportPreference", [])
    accommodation = request_data.get("accommodationType", [])
    
    print(f"[Input] Requirements: {requirements}")
    print(f"[Input] Preferences: {preferences}")
    print(f"[Input] Travel Types: {travel_types}")
    print(f"[Input] Transport: {transport}")
    print(f"[Input] Accommodation: {accommodation}")
    
    # Force Coze workflow - no fallback
    if not COZE_AVAILABLE:
        raise RuntimeError("Coze workflow is not available. Please check Coze configuration.")
    
    result = _generate_with_coze_workflow(request_data)
    
    if not result:
        raise RuntimeError("Coze workflow returned no result. Please check workflow configuration and input data.")
    
    print("\n[Output] AI Service Result Summary:")
    print(f"  Trip Name: {result.get('tripName', 'N/A')}")
    print(f"  Departure: {result.get('departure', 'Not specified')}")
    print(f"  Destination: {result.get('destination', 'N/A')}")
    print(f"  Total Days: {result.get('totalDays', 'N/A')}")
    print(f"  Start Date: {result.get('startDate', 'N/A')}")
    print(f"  End Date: {result.get('endDate', 'N/A')}")
    print(f"  Budget: {result.get('budget', 'N/A')}")
    print(f"  Num Travellers: {result.get('numTravellers', 'N/A')}")
    print(f"  Itinerary Days: {len(result.get('itinerary', []))}")
    print(f"  Budget Breakdown Items: {len(result.get('budgetBreakdown', []))}")
    print(f"  Notes Count: {len(result.get('notes', []))}")
    print("="*60 + "\n")
    return result


def parse_expense_from_voice(voice_text: str) -> Dict[str, Any]:
    """
    Parse expense information from voice text using Coze Workflow
    
    Input: Voice recognized text (e.g., "����Է�����200Ԫ")
    Output: Parsed expense data with amount, category, date, description
    
    Returns:
        Dict with keys: amount, category, date, description
    """
    print("\n" + "="*60)
    print("[AI Service] Received expense voice parsing request")
    print("="*60)
    print(f"[Input] Voice text: {voice_text}")
    
    if not COZE_AVAILABLE:
        raise RuntimeError("Coze workflow is not available. Please check Coze configuration.")
    
    # Call expense workflow - only accepts user's spoken sentence as input
    
    # Collect messages from stream
    messages = []
    errors = []
    
    def handle_workflow_iterator(stream: Stream[WorkflowEvent]):
        for event in stream:
            if event.event == WorkflowEventType.MESSAGE:
                print("got message", event.message)
                if event.message and hasattr(event.message, 'content'):
                    content = event.message.content
                    if isinstance(content, str):
                        messages.append(content)
                elif isinstance(event.message, dict) and 'content' in event.message:
                    messages.append(event.message['content'])
            elif event.event == WorkflowEventType.ERROR:
                error_msg = str(event.error) if event.error else "Unknown error"
                print("got error", error_msg)
                errors.append(error_msg)
            elif event.event == WorkflowEventType.INTERRUPT:
                print("[Coze Workflow] Interrupt received")
                if hasattr(event, 'interrupt') and event.interrupt:
                    interrupt_data = event.interrupt.interrupt_data if hasattr(event.interrupt, 'interrupt_data') else None
                    if interrupt_data:
                        handle_workflow_iterator(
                            coze.workflows.runs.resume(
                                workflow_id=EXPENSE_WORKFLOW_ID,
                                event_id=interrupt_data.event_id if hasattr(interrupt_data, 'event_id') else "",
                                resume_data="continue",
                                interrupt_type=interrupt_data.type if hasattr(interrupt_data, 'type') else "",
                            )
                        )
    
    try:
        # Call expense workflow with user's spoken sentence as input
        # The workflow only accepts the user's spoken sentence as input
        print(f"[Coze Workflow] Calling expense workflow {EXPENSE_WORKFLOW_ID}")
        print(f"[Coze Workflow] Input voice text: {voice_text}")
        
        # Try to pass voice_text as parameter - workflow may accept it directly
        # If the workflow doesn't accept parameters, try without parameters
        try:
            stream = coze.workflows.runs.stream(
                workflow_id=EXPENSE_WORKFLOW_ID,
                parameters={"input": voice_text} if voice_text else None
            )
        except (TypeError, ValueError, AttributeError) as e:
            print(f"[Coze Workflow] Parameters not accepted, trying without parameters: {e}")
            # Workflow might not accept parameters, try without
            stream = coze.workflows.runs.stream(
                workflow_id=EXPENSE_WORKFLOW_ID
            )
        
        handle_workflow_iterator(stream)
        
        if errors:
            error_msg = f"Coze workflow errors: {errors}"
            print(f"[Coze Workflow] Workflow completed with errors: {errors}")
            raise RuntimeError(error_msg)
        
        if not messages:
            error_msg = "No messages received from Coze workflow"
            print(f"[Coze Workflow] {error_msg}")
            raise RuntimeError(error_msg)
        
        # Combine all messages
        combined_message = "".join(messages)
        print(f"[Coze Workflow] Combined message length: {len(combined_message)}")
        
        # Try to parse as JSON
        try:
            cleaned_message = combined_message.strip()
            if cleaned_message.startswith("```json"):
                cleaned_message = cleaned_message[7:]
            if cleaned_message.startswith("```"):
                cleaned_message = cleaned_message[3:]
            if cleaned_message.endswith("```"):
                cleaned_message = cleaned_message[:-3]
            cleaned_message = cleaned_message.strip()
            
            result = json.loads(cleaned_message)
            print("[Coze Workflow] Successfully parsed JSON response")
            print(f"[Coze Workflow] Parsed result keys: {list(result.keys())}")
            
            # Extract expense fields from result
            # The result might contain expense information in various formats
            # We'll try to extract amount, category, date, description
            expense_data = {}
            
            # Extract amount
            amount = result.get('amount') or result.get('���') or result.get('money')
            if amount:
                if isinstance(amount, str):
                    # Extract number from string
                    import re
                    numbers = re.findall(r'\d+\.?\d*', amount)
                    if numbers:
                        amount = float(numbers[0])
                    else:
                        amount = 0.0
                expense_data['amount'] = float(amount)
            else:
                raise ValueError("Amount not found in parsed result")
            
            # Extract category
            category = result.get('category') or result.get('���') or result.get('categoryName')
            if not category:
                # Try to infer from description
                desc = result.get('description') or result.get('����') or voice_text.lower()
                if any(keyword in desc for keyword in ['��', '��', '��', 'food', 'restaurant']):
                    category = '����'
                elif any(keyword in desc for keyword in ['��', '��ͨ', 'transport', 'taxi', 'bus']):
                    category = '��ͨ'
                elif any(keyword in desc for keyword in ['ס', '�Ƶ�', 'hotel', 'accommodation']):
                    category = 'ס��'
                elif any(keyword in desc for keyword in ['��', '����', 'shop', 'shopping']):
                    category = '����'
                elif any(keyword in desc for keyword in ['��Ʊ', '����', 'ticket', 'attraction']):
                    category = '����'
                else:
                    category = '����'
            expense_data['category'] = category
            
            # Extract date (default to today if not found)
            date = result.get('date') or result.get('����')
            if not date:
                date = datetime.now().strftime("%Y-%m-%d")
            else:
                # Validate and format date
                try:
                    datetime.strptime(date, "%Y-%m-%d")
                except ValueError:
                    # If date format is wrong, use today
                    date = datetime.now().strftime("%Y-%m-%d")
            expense_data['date'] = date
            
            # Extract description
            description = result.get('description') or result.get('����') or result.get('note') or voice_text
            expense_data['description'] = description[:200] if description else ''  # Limit length
            
            print(f"[AI Service] Parsed expense data: {expense_data}")
            print("="*60 + "\n")
            return expense_data
            
        except json.JSONDecodeError as e:
            print(f"[Coze Workflow] Failed to parse JSON: {str(e)}")
            print(f"[Coze Workflow] Raw message: {combined_message[:500]}...")
            raise ValueError(f"Failed to parse JSON from Coze workflow response: {str(e)}")
            
    except Exception as e:
        import traceback
        print(f"[Coze Workflow] Exception during workflow execution: {str(e)}")
        print(f"[Coze Workflow] Traceback: {traceback.format_exc()}")
        raise RuntimeError(f"Coze workflow failed: {str(e)}")


def _generate_with_coze_workflow(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call Coze workflow to generate trip itinerary
    
    Returns parsed and normalized JSON result.
    Raises exception if workflow fails or returns invalid data.
    """
    
    print("[Coze Workflow] Starting workflow execution...")
    
    # Prepare input for workflow
    # Format the input as JSON string for the workflow
    workflow_input = {
        "requirementsText": request_data.get("requirementsText", ""),
        "preferences": request_data.get("preferences", []),
        "travelType": request_data.get("travelType", []),
        "transportPreference": request_data.get("transportPreference", []),
        "accommodationType": request_data.get("accommodationType", []),
        "currency": request_data.get("currency", "CNY")
    }
    
    print(f"[Coze Workflow] Input data: {json.dumps(workflow_input, ensure_ascii=False)}")
    
    # Collect messages from stream
    messages = []
    errors = []
    
    def handle_workflow_iterator(stream: Stream[WorkflowEvent]):
        for event in stream:
            if event.event == WorkflowEventType.MESSAGE:
                print(f"[Coze Workflow] Received message: {event.message}")
                if event.message and hasattr(event.message, 'content'):
                    content = event.message.content
                    if isinstance(content, str):
                        messages.append(content)
                elif isinstance(event.message, dict) and 'content' in event.message:
                    messages.append(event.message['content'])
            elif event.event == WorkflowEventType.ERROR:
                error_msg = str(event.error) if event.error else "Unknown error"
                print(f"[Coze Workflow] Error: {error_msg}")
                errors.append(error_msg)
            elif event.event == WorkflowEventType.INTERRUPT:
                print(f"[Coze Workflow] Interrupt received")
                if hasattr(event, 'interrupt') and event.interrupt:
                    interrupt_data = event.interrupt.interrupt_data if hasattr(event.interrupt, 'interrupt_data') else None
                    if interrupt_data:
                        handle_workflow_iterator(
                            coze.workflows.runs.resume(
                                workflow_id=WORKFLOW_ID,
                                event_id=interrupt_data.event_id if hasattr(interrupt_data, 'event_id') else "",
                                resume_data="continue",
                                interrupt_type=interrupt_data.type if hasattr(interrupt_data, 'type') else "",
                            )
                        )
    
    try:
        # Start workflow run with input
        stream = coze.workflows.runs.stream(
            workflow_id=WORKFLOW_ID,
            parameters=workflow_input
        )
        
        handle_workflow_iterator(stream)
        
        if errors:
            error_msg = f"Coze workflow errors: {errors}"
            print(f"[Coze Workflow] Workflow completed with errors: {errors}")
            raise RuntimeError(error_msg)
        
        if not messages:
            error_msg = "No messages received from Coze workflow"
            print(f"[Coze Workflow] {error_msg}")
            raise RuntimeError(error_msg)
        
        # Combine all messages
        combined_message = "".join(messages)
        print(f"[Coze Workflow] Combined message length: {len(combined_message)}")
        
        # Try to parse as JSON
        try:
            # Remove markdown code blocks if present
            cleaned_message = combined_message.strip()
            if cleaned_message.startswith("```json"):
                cleaned_message = cleaned_message[7:]
            if cleaned_message.startswith("```"):
                cleaned_message = cleaned_message[3:]
            if cleaned_message.endswith("```"):
                cleaned_message = cleaned_message[:-3]
            cleaned_message = cleaned_message.strip()
            
            result = json.loads(cleaned_message)
            print("[Coze Workflow] Successfully parsed JSON response")
            print(f"[Coze Workflow] Raw result keys: {list(result.keys())}")
            
            # Normalize and extract all fields
            normalized_result = _normalize_ai_result(result)
            print("[Coze Workflow] Field extraction complete")
            _log_extracted_fields(normalized_result)
            return normalized_result
            
        except json.JSONDecodeError as e:
            print(f"[Coze Workflow] Failed to parse JSON: {str(e)}")
            print(f"[Coze Workflow] Raw message: {combined_message[:500]}...")
            # Try to extract JSON from the message
            # Look for JSON object in the text
            json_match = re.search(r'\{.*\}', combined_message, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                    print("[Coze Workflow] Extracted JSON from message")
                    # Normalize and extract all fields
                    normalized_result = _normalize_ai_result(result)
                    _log_extracted_fields(normalized_result)
                    return normalized_result
                except json.JSONDecodeError:
                    pass
            error_msg = f"Failed to parse JSON from Coze workflow response. Raw message: {combined_message[:500]}"
            print(f"[Coze Workflow] {error_msg}")
            raise ValueError(error_msg)
            
    except Exception as e:
        print(f"[Coze Workflow] Exception during workflow execution: {str(e)}")
        import traceback
        print(f"[Coze Workflow] Traceback: {traceback.format_exc()}")
        # Re-raise the exception instead of returning None
        raise


def generate_mock_activities(day: int, destination: str, 
                             preferences: list) -> list:
    """Generate mock activities"""
    
    activity_templates = {
        "Beijing": [
            {"title": "Visit Forbidden City", "category": "Sightseeing", "location": "Forbidden City", "cost": 60},
            {"title": "Walk along Great Wall", "category": "Sightseeing", "location": "Badaling Great Wall", "cost": 45},
            {"title": "Enjoy Peking Duck", "category": "Food", "location": "Quanjude Restaurant", "cost": 150},
            {"title": "Temple of Heaven Tour", "category": "Sightseeing", "location": "Temple of Heaven", "cost": 35},
            {"title": "Explore Summer Palace", "category": "Sightseeing", "location": "Summer Palace", "cost": 30}
        ],
        "Shanghai": [
            {"title": "Visit The Bund", "category": "Sightseeing", "location": "The Bund", "cost": 0},
            {"title": "Yu Garden Tour", "category": "Sightseeing", "location": "Yu Garden", "cost": 40},
            {"title": "Shanghai Tower Visit", "category": "Sightseeing", "location": "Shanghai Tower", "cost": 180},
            {"title": "Nanjing Road Shopping", "category": "Shopping", "location": "Nanjing Road", "cost": 200},
            {"title": "Xiaolongbao Tasting", "category": "Food", "location": "Din Tai Fung", "cost": 100}
        ],
        "Chengdu": [
            {"title": "Panda Base Visit", "category": "Sightseeing", "location": "Chengdu Research Base", "cost": 58},
            {"title": "Jinli Ancient Street", "category": "Sightseeing", "location": "Jinli Street", "cost": 0},
            {"title": "Hot Pot Dinner", "category": "Food", "location": "Xiaolongkan Hot Pot", "cost": 120},
            {"title": "Wuhou Temple", "category": "Sightseeing", "location": "Wuhou Temple", "cost": 60},
            {"title": "Wide and Narrow Alley", "category": "Shopping", "location": "Kuanzhai Alley", "cost": 50}
        ],
        "Default": [
            {"title": "City Tour", "category": "Sightseeing", "location": f"{destination}", "cost": 100},
            {"title": "Local Market Visit", "category": "Shopping", "location": "Local Market", "cost": 80},
            {"title": "Traditional Lunch", "category": "Food", "location": "Local Restaurant", "cost": 60},
            {"title": "Museum Visit", "category": "Sightseeing", "location": "City Museum", "cost": 40},
            {"title": "Evening Walk", "category": "Sightseeing", "location": "City Center", "cost": 0}
        ]
    }
    
    templates = activity_templates.get(destination, activity_templates["Default"])
    
    # Select 3-4 activities per day
    num_activities = 3 if day == 1 else 4
    selected = random.sample(templates, min(num_activities, len(templates)))
    
    activities = []
    times = ["09:00", "12:00", "15:00", "18:00"]
    
    for i, template in enumerate(selected):
        activity_id = f"activity_{uuid.uuid4().hex[:8]}"
        activities.append({
            "id": activity_id,
            "time": times[i] if i < len(times) else "20:00",
            "title": template["title"],
            "category": template["category"],
            "location": template["location"],
            "description": f"Experience {template['title']} at {template['location']}",
            "image": None,
            "estimatedCost": template["cost"]
        })
    
    return activities


def _normalize_ai_result(raw_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize and extract all fields from AI workflow result
    
    Handles field name variations and ensures all fields are properly extracted
    """
    normalized = {}
    
    # Field name mapping (handle variations)
    field_mappings = {
        "tripName": ["tripName", "trip_name", "name", "title", "tripTitle"],
        "destination": ["destination", "dest", "place", "city", "location"],
        "departure": ["departure", "from", "departureCity", "origin"],
        "totalDays": ["totalDays", "total_days", "days", "duration", "tripDays"],
        "startDate": ["startDate", "start_date", "start", "beginDate", "departureDate"],
        "endDate": ["endDate", "end_date", "end", "returnDate", "finishDate"],
        "budget": ["budget", "totalBudget", "budgetTotal", "cost", "price"],
        "numTravellers": ["numTravellers", "num_travellers", "travellers", "people", "persons", "travelers"],
        "itinerary": ["itinerary", "schedule", "plan", "days", "itineraries"],
        "budgetBreakdown": ["budgetBreakdown", "budget_breakdown", "breakdown", "budgetDetails"],
        "notes": ["notes", "note", "remarks", "tips", "suggestions"],
        "img_url": ["img_url", "imageUrl", "image_url", "image", "mainImage", "coverImage"]
    }
    
    # Extract each field using all possible variations
    for standard_name, variations in field_mappings.items():
        value = None
        
        # First try standard name
        if standard_name in raw_result:
            value = raw_result[standard_name]
        else:
            # Try variations
            for variant in variations:
                if variant in raw_result:
                    value = raw_result[variant]
                    print(f"[Coze Workflow] Found field '{standard_name}' as '{variant}'")
                    break
        
        if value is not None:
            # Normalize data types
            if standard_name == "totalDays" or standard_name == "numTravellers":
                if isinstance(value, str):
                    # Extract number from string
                    num_match = re.search(r'\d+', value)
                    if num_match:
                        value = int(num_match.group())
                    else:
                        value = None
                elif isinstance(value, (int, float)):
                    value = int(value)
                else:
                    value = None
                    
            elif standard_name == "budget":
                if isinstance(value, str):
                    try:
                        value = float(value)
                    except (ValueError, TypeError):
                        value = None
                elif isinstance(value, (int, float)):
                    value = float(value)
                else:
                    value = None
                    
            elif standard_name == "startDate" or standard_name == "endDate":
                if isinstance(value, str):
                    # Ensure date format is YYYY-MM-DD
                    value = value.strip()
                    # Handle "unknown" or invalid dates
                    if value.lower() in ["unknown", "null", "none", ""]:
                        value = None
                elif value is not None:
                    # Keep non-None values but log if not string
                    if not isinstance(value, str):
                        print(f"[Coze Workflow] Warning: {standard_name} is not a string: {type(value)}")
                        value = None
                        
            elif standard_name == "itinerary":
                if not isinstance(value, list):
                    print(f"[Coze Workflow] Warning: itinerary is not a list: {type(value)}")
                    value = []
                else:
                    # Validate each day item
                    validated_itinerary = []
                    for day_item in value:
                        if isinstance(day_item, dict):
                            validated_itinerary.append(day_item)
                    value = validated_itinerary
                    
            elif standard_name == "budgetBreakdown":
                if not isinstance(value, list):
                    print(f"[Coze Workflow] Warning: budgetBreakdown is not a list: {type(value)}")
                    value = []
                else:
                    # Validate each breakdown item
                    validated_breakdown = []
                    for item in value:
                        if isinstance(item, dict):
                            validated_breakdown.append(item)
                    value = validated_breakdown
                    
            elif standard_name == "notes":
                if isinstance(value, str):
                    # Convert string to list
                    value = [value]
                elif not isinstance(value, list):
                    print(f"[Coze Workflow] Warning: notes is not a list or string: {type(value)}")
                    value = []
                    
            elif standard_name == "tripName":
                # tripName should be a string
                if not isinstance(value, str):
                    if value is not None:
                        # Try to convert to string
                        value = str(value)
                    else:
                        value = None
                elif value:
                    # Trim whitespace
                    value = value.strip()
                    # Empty string after trimming is treated as None
                    if not value:
                        value = None
            
            elif standard_name == "img_url":
                # img_url/imageUrl should be a string URL
                if not isinstance(value, str):
                    if value is not None:
                        # Try to convert to string
                        value = str(value)
                    else:
                        value = None
                elif value:
                    # Trim whitespace
                    value = value.strip()
                    # Empty string after trimming is treated as None
                    if not value:
                        value = None
                    # Validate URL format (basic check)
                    elif not (value.startswith("http://") or value.startswith("https://")):
                        print(f"[Coze Workflow] Warning: img_url does not start with http:// or https://: {value}")
                        # Still keep it, might be a relative path or valid URL without protocol
                        # But log a warning
            
            normalized[standard_name] = value
        else:
            print(f"[Coze Workflow] Field '{standard_name}' not found in result")
    
    return normalized


def _log_extracted_fields(result: Dict[str, Any]) -> None:
    """
    Log all extracted fields for debugging
    """
    print("\n" + "-"*60)
    print("[Coze Workflow] Extracted Fields Summary:")
    print("-"*60)
    
    # Core fields
    print(f"  tripName: {result.get('tripName', 'NOT FOUND')}")
    print(f"  destination: {result.get('destination', 'NOT FOUND')}")
    print(f"  departure: {result.get('departure', 'NOT FOUND')}")
    print(f"  totalDays: {result.get('totalDays', 'NOT FOUND')}")
    print(f"  startDate: {result.get('startDate', 'NOT FOUND')}")
    print(f"  endDate: {result.get('endDate', 'NOT FOUND')}")
    print(f"  budget: {result.get('budget', 'NOT FOUND')}")
    print(f"  numTravellers: {result.get('numTravellers', 'NOT FOUND')}")
    
    # Complex fields
    itinerary = result.get('itinerary', [])
    print(f"  itinerary: {len(itinerary)} day(s)" if isinstance(itinerary, list) else f"  itinerary: {type(itinerary)}")
    
    budget_breakdown = result.get('budgetBreakdown', [])
    print(f"  budgetBreakdown: {len(budget_breakdown)} item(s)" if isinstance(budget_breakdown, list) else f"  budgetBreakdown: {type(budget_breakdown)}")
    
    notes = result.get('notes', [])
    print(f"  notes: {len(notes)} note(s)" if isinstance(notes, list) else f"  notes: {type(notes)}")
    
    # Image URL
    img_url = result.get('img_url', 'NOT FOUND')
    print(f"  img_url: {img_url}")
    
    print("-"*60 + "\n")

