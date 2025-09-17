// src/api/contact.js
const BASE_URL = "http://localhost:8000/api";

export async function submitContactForm(formData) {
  const response = await fetch(`${BASE_URL}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export async function getContacts() {
  const response = await fetch(`${BASE_URL}/admin/contacts`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch contacts");
  }

  return await response.json();
}

export async function updateContactStatus(contactId, status) {
  const response = await fetch(`${BASE_URL}/admin/contacts/${contactId}/status?status=${status}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to update contact status");
  }

  return await response.json();
}

export async function deleteContact(contactId) {
  const response = await fetch(`${BASE_URL}/admin/contacts/${contactId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to delete contact");
  }

  return await response.json();
}