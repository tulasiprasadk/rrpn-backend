import { buildSubscriptionPricing, validateSubscriptionPayload } from "./subscriptionPricing.js";
import { normalizeSubscriptionCategory } from "./subscriptionConfig.js";

export async function createSubscriptionDraft(models, payload, customerId) {
  const { Subscription, SubscriptionItem, Product } = models;
  const validation = validateSubscriptionPayload(payload);
  if (!validation.ok) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    throw error;
  }

  const requestedItems = Array.isArray(payload.items) ? payload.items : [];
  const productIds = [...new Set(requestedItems.map((item) => Number(item.productId || item.id)).filter(Boolean))];
  const products = productIds.length
    ? await Product.findAll({ where: { id: productIds } })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  if (productMap.size !== productIds.length) {
    const error = new Error("One or more subscription items are invalid");
    error.statusCode = 400;
    throw error;
  }

  const category = normalizeSubscriptionCategory(payload.category);
  const primaryProductId = Number(payload.primaryProductId || requestedItems[0]?.productId || requestedItems[0]?.id || 0);

  const enrichedItems = requestedItems.map((item) => {
    const productId = Number(item.productId || item.id);
    const product = productMap.get(productId);
    const metadata = item.metadata || {};
    return {
      productId: productId || null,
      title: product?.title || item.title || item.name || metadata.title || "Subscription item",
      unit: product?.unit || item.unit || metadata.unit || "",
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice ?? item.price ?? product?.price ?? 0),
      metadata: {
        ...metadata,
        title: product?.title || item.title || item.name || metadata.title || "Subscription item",
        unit: product?.unit || item.unit || metadata.unit || ""
      }
    };
  });

  const pricing = buildSubscriptionPricing({
    ...payload,
    category,
    items: enrichedItems
  });

  const subscription = await Subscription.create({
    customerId,
    productId: primaryProductId || enrichedItems[0]?.productId || null,
    category,
    duration: pricing.duration,
    period: pricing.duration,
    frequency: pricing.frequency,
    planType: pricing.planType,
    status: "pending_payment",
    price: pricing.totalPayable,
    savings: pricing.savings,
    pricingDetails: pricing,
    metadata: {
      source: payload.source || "popup",
      upsellAccepted: Boolean(payload.upsellAccepted),
      recommendationIds: payload.recommendationIds || []
    },
    activationMode: "payment_approval",
    autoRenew: true
  });

  const items = await Promise.all(
    pricing.items.map((item) =>
      SubscriptionItem.create({
        subscriptionId: subscription.id,
        productId: item.productId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        itemType: item.productId ? "product" : "plan_item",
        metadata: item.metadata || {
          title: item.title,
          unit: item.unit
        }
      })
    )
  );

  return { subscription, items, pricing };
}

export async function hydrateSubscription(models, subscriptionId, customerId) {
  const { Subscription, SubscriptionItem, Product } = models;
  return Subscription.findOne({
    where: { id: subscriptionId, customerId },
    include: [
      {
        model: SubscriptionItem,
        as: "items",
        include: [{ model: Product }]
      },
      { model: Product }
    ]
  });
}
