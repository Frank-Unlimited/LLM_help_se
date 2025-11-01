# -*- coding: utf-8 -*-
"""
Data Model Definitions
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ============ Request Models ============

class TripGenerationRequest(BaseModel):
    """Trip generation request"""
    requirementsText: str = Field(..., description="User input travel requirements text")
    preferences: List[str] = Field(default_factory=list, description="All preference tags")
    travelType: List[str] = Field(default_factory=list, description="Travel type preferences")
    transportPreference: List[str] = Field(default_factory=list, description="Transport preferences")
    accommodationType: List[str] = Field(default_factory=list, description="Accommodation preferences")
    currency: Optional[str] = Field(default="CNY", description="Currency type")
    userId: Optional[str] = Field(default=None, description="User ID")


class ExpenseCreateRequest(BaseModel):
    """Record expense request"""
    amount: float = Field(..., description="Amount")
    category: str = Field(..., description="Category")
    date: str = Field(..., description="Date")
    description: Optional[str] = Field(default="", description="Notes")


class ExpenseVoiceParseRequest(BaseModel):
    """Parse expense from voice text request"""
    voiceText: str = Field(..., description="Voice recognized text")


class TripUpdateRequest(BaseModel):
    """Update trip request"""
    tripName: Optional[str] = None
    destination: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    numTravellers: Optional[int] = None
    status: Optional[str] = None
    budget: Optional[Dict[str, Any]] = None
    itinerary: Optional[List[Dict[str, Any]]] = None


# ============ Response Models ============

class Activity(BaseModel):
    """Activity"""
    id: str
    time: str
    title: str
    category: str
    location: str
    description: str
    image: Optional[str] = None
    estimatedCost: float = 0.0
    nextLocation: Optional[str] = None


class DailyItinerary(BaseModel):
    """Daily itinerary"""
    day: int
    date: str
    title: str
    summary: Optional[str] = None
    activities: List[Activity]


class BudgetInfo(BaseModel):
    """Budget information"""
    total: float
    currency: str = "CNY"
    spent: float = 0.0
    remaining: float = 0.0


class BudgetBreakdownItem(BaseModel):
    """Budget breakdown item"""
    category: str
    allocated: float
    spent: float = 0.0


class Expense(BaseModel):
    """Expense record"""
    expenseId: str
    amount: float
    category: str
    date: str
    description: Optional[str] = None
    createdAt: str


class TripDetail(BaseModel):
    """Trip details (complete)"""
    tripId: str
    tripName: str
    departure: Optional[str] = None
    destination: str
    startDate: str
    endDate: str
    totalDays: int
    numTravellers: Optional[int] = None
    status: str = "draft"
    budget: BudgetInfo
    budgetBreakdown: List[BudgetBreakdownItem]
    itinerary: List[DailyItinerary]
    expenses: List[Expense] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)
    imageUrl: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class TripSummary(BaseModel):
    """Trip summary (for list)"""
    tripId: str
    tripName: str
    departure: Optional[str] = None
    destination: str
    startDate: str
    endDate: str
    totalDays: int
    status: str
    budget: BudgetInfo
    imageUrl: Optional[str] = None


class TripGenerationResponse(BaseModel):
    """Trip generation response"""
    tripId: str
    status: str = "success"
    message: str = "Trip generated successfully"


class ExpenseCreateResponse(BaseModel):
    """Record expense response"""
    expenseId: str
    success: bool = True
    updatedBudget: BudgetInfo


class ExpenseVoiceParseResponse(BaseModel):
    """Expense voice parse response"""
    amount: float
    category: str
    date: str
    description: str


class TripsListResponse(BaseModel):
    """Trips list response"""
    trips: List[TripSummary]
    total: int
    page: int
    limit: int


class DeleteResponse(BaseModel):
    """Delete response"""
    success: bool = True
    message: str = "Deleted successfully"


# ============ Authentication Models ============

class LoginRequest(BaseModel):
    """Login request"""
    username: str = Field(..., description="Phone or email")
    password: str = Field(..., description="Password")
    rememberMe: Optional[bool] = Field(default=False, description="Remember me")


class RegisterRequest(BaseModel):
    """Register request"""
    phone: str = Field(..., description="Phone number")
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    verifyCode: str = Field(..., description="Verification code")


class SendVerifyCodeRequest(BaseModel):
    """Send verification code request"""
    phone: str = Field(..., description="Phone number")


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: str = Field(..., description="Email address")


class AuthResponse(BaseModel):
    """Authentication response"""
    success: bool = True
    message: str = "Success"
    token: Optional[str] = None
    userId: Optional[str] = None
    username: Optional[str] = None


class VerifyCodeResponse(BaseModel):
    """Verification code response"""
    success: bool = True
    message: str = "Verification code sent successfully"


class UserProfileResponse(BaseModel):
    """User profile response"""
    userId: str
    phone: str
    email: str
    nickname: Optional[str] = None
    gender: Optional[str] = None
    avatar: Optional[str] = None
    createdAt: Optional[str] = None
    lastLoginAt: Optional[str] = None


class UpdateUserProfileRequest(BaseModel):
    """Update user profile request"""
    nickname: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    avatar: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    currentPassword: str
    newPassword: str

