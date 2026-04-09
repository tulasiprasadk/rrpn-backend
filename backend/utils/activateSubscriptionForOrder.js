import { buildPlanForBasePrice } from "./subscriptionPlans.js";

export async function activateSubscriptionForOrder(models, order) {
  const { Subscription, Notification, SubscriptionItem } = models;
  if (!order || !order.CustomerId) {
    return null;
  }

  const paymentInfo = order.paymentInfo && typeof order.paymentInfo === "object"
    ? { ...order.paymentInfo }
    : {};
  const selection = paymentInfo.subscriptionSelection;
  const subscriptionDraftId = Number(paymentInfo.subscriptionDraftId || 0);

  if (subscriptionDraftId) {
    const draft = await Subscription.findOne({
      where: { id: subscriptionDraftId, customerId: order.CustomerId },
      include: [{ model: SubscriptionItem, as: "items" }]
    });

    if (!draft) {
      return null;
    }

    if (draft.status === "active") {
      return draft;
    }

    const pricing = draft.pricingDetails || {};
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(pricing.months || 1));

    await draft.update({
      status: "active",
      orderId: order.id,
      startDate,
      endDate,
      autoRenew: true,
      activationMode: "payment_approval"
    });

    paymentInfo.subscriptionActivatedAt = new Date().toISOString();
    paymentInfo.subscription = {
      id: draft.id,
      category: draft.category,
      duration: draft.duration || draft.period,
      frequency: draft.frequency || null,
      planType: draft.planType || null,
      price: Number(draft.price || 0),
      itemCount: draft.items?.length || pricing.itemCount || 0
    };
    await order.update({ paymentInfo });

    if (Notification) {
      await Notification.create({
        type: "subscription_activated",
        title: "Subscription Activated",
        message: `Your ${draft.category.replace("_", " ")} subscription for order #${order.id} is now active.`,
        isRead: false,
        audience: "customer",
        customerId: order.CustomerId,
        meta: JSON.stringify({
          orderId: order.id,
          subscriptionId: draft.id,
          route: "/subscriptions"
        })
      });
    }

    return draft;
  }

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
