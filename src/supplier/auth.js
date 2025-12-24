// frontend/src/supplier/auth.js
import axios from "axios";
import { API_BASE } from "../api/client";


/**
 * Request OTP for supplier login (email only)
 */
export async function requestOtp({ email }) {
  try {
    const response = await axios.post(`/api/supplier/auth/request-email-otp`, { email });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to request OTP");
  }
}

/**
 * Verify OTP and login supplier (email only)
 */
export async function verifyOtp({ email, otp }) {
  try {
    const response = await axios.post(`/api/supplier/auth/verify-email-otp`, { email, otp });
    if (response.data.supplier) {
      localStorage.setItem("supplierToken", response.data.token || "supplier-logged-in");
      localStorage.setItem("supplierId", response.data.supplier.id);
      localStorage.setItem("supplierData", JSON.stringify(response.data.supplier));
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to verify OTP");
  }
}

/**
 * Logout supplier
 */
export function logoutSupplier() {
  localStorage.removeItem("supplierToken");
  localStorage.removeItem("supplierId");
  localStorage.removeItem("supplierData");
}

/**
 * Check if supplier is logged in
 */
export function isSupplierLoggedIn() {
  return !!localStorage.getItem("supplierToken");
}

/**
 * Get current supplier data
 */
export function getCurrentSupplier() {
  const data = localStorage.getItem("supplierData");
  return data ? JSON.parse(data) : null;
}
