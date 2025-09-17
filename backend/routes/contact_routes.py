# contact_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime
from db import db
import uuid

router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("/contact")
async def submit_contact_form(data: ContactRequest):
    try:
        contact_entry = {
            "contact_id": str(uuid.uuid4()),
            "name": data.name,
            "email": data.email,
            "message": data.message,
            "submitted_at": datetime.now(),
            "status": "unread"  # unread, read, replied
        }
        
        result = db.contacts.insert_one(contact_entry)
        
        return {
            "message": "Contact form submitted successfully",
            "contact_id": contact_entry["contact_id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit contact form: {str(e)}")

@router.get("/admin/contacts")
async def get_all_contacts():
    try:
        contacts = list(db.contacts.find().sort("submitted_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for contact in contacts:
            contact["_id"] = str(contact["_id"])
            
        return contacts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch contacts: {str(e)}")

@router.put("/admin/contacts/{contact_id}/status")
async def update_contact_status(contact_id: str, status: str):
    try:
        if status not in ["unread", "read", "replied"]:
            raise HTTPException(status_code=400, detail="Invalid status")
            
        result = db.contacts.update_one(
            {"contact_id": contact_id},
            {"$set": {"status": status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        return {"message": f"Contact status updated to {status}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update contact status: {str(e)}")

@router.delete("/admin/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    try:
        result = db.contacts.delete_one({"contact_id": contact_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        return {"message": "Contact deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete contact: {str(e)}")