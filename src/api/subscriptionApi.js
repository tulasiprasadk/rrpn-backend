// d:\RRPN\frontend\src\api\subscriptionApi.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // Adjust as per your actual API base URL

/**
 * Fetches subscription plans from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of subscription plan objects.
 */
export const fetchSubscriptionPlans = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Map backend response to the desired frontend format
    return data.map(plan => ({
      id: plan.id,
      name: plan.title || plan.name, // Assuming 'title' or 'name' from backend
      price: plan.monthlyPrice || plan.price,
      savings: plan.discountAmount || plan.savings || 0, // Assuming 'discountAmount' or 'savings'
      totalWeight: plan.weightKg || plan.totalWeight || 0, // Assuming 'weightKg' or 'totalWeight'
      items: plan.includedItems ? plan.includedItems.map(item => ({ // Assuming 'includedItems'
        name: item.itemName || item.name,
        quantity: item.itemQuantity || item.quantity
      })) : [],
      isPopular: plan.isPopular || false, // Assuming backend provides this
    }));
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
};