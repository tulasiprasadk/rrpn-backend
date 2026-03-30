import { buildPlanForBasePrice } from "./subscriptionPlans.js";

export async function activateSubscriptionForOrder(models, order) {
  const { Subscription, Notification } = models;
  if (!order || !order.CustomerId || !order.productId) {
    return null;
  }

  const paymentInfo = order.paymentInfo && typeof order.paymentInfo === "object"
    ? { ...order.paymentInfo }
    : {};
  const selection = paymentInfo.subscriptionSelection;

  if (!selection?.period || paymentInfo.subscriptionActivatedAt) {
    return null;
  }

  const plan = buildPlanForBasePrice(selection.basePrice || 0, selection.period);
  if (!plan) {
    return null;
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.months);

  const subscription = await Subscription.create({
    customerId: order.CustomerId,
    productId: order.productId,
    period: plan.period,
    status: "active",
    startDate,
    endDate,
    price: plan.discountedPrice,
    autoRenew: true
  });

  paymentInfo.subscriptionActivatedAt = new Date().toISOString();
  paymentInfo.subscription = {
    id: subscription.id,
    period: plan.period,
    label: plan.label,
    months: plan.months,
    price: plan.discountedPrice
  };
  await order.update({ paymentInfo });

  if (Notification) {
    await Notification.create({
      type: "subscription_activated",
      title: "Subscription Activated",
      message: `Your ${plan.label.toLowerCase()} subscription for order #${order.id} is now active.`,
      isRead: false,
      audience: "customer",
      customerId: order.CustomerId,
      meta: JSON.stringify({
        orderId: order.id,
        subscriptionId: subscription.id,
        route: "/subscriptions"
      })
    });
  }

  return subscription;
}
