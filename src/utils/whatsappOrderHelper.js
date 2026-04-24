export const handleWhatsAppOrder = (user, cart, address, slot, subscription, whatsappNumber) => {
  if (!cart?.items?.length) return alert("Cart is empty");
  if (!address) return alert("Please add delivery address");
  if (!user?.phone) return alert("Please add phone number");

  const name = user.name || "Customer";
  const phone = user.phone;
  const fullAddress = `${address.street || ""}, ${address.city || ""} ${address.pincode || ""}`.trim();

  const itemsList = cart.items
    .map((item) => `- ${item.product_name || item.title || "Product"} x${item.quantity} - ₹${Number(item.price || 0).toFixed(2)}`)
    .join("\n");

  let subSection = "";
  if (subscription) {
    subSection = `\nSubscription Details:
Type: ${subscription.type}
Duration: ${subscription.duration}
Frequency: ${subscription.frequency}`;

    if (subscription.rationPackage) {
      subSection += `\nPackage: ${subscription.rationPackage}`;
    }

    if (subscription.upsellItems?.length > 0) {
      const upsells = subscription.upsellItems
        .map((item) => `- ${item.product_name || item.title || "Upsell"} - ₹${Number(item.price || 0).toFixed(2)}`)
        .join("\n");
      subSection += `\n\nUpsell Items:\n${upsells}`;
    }
    subSection += "\n";
  }

  const calculatedCartTotal = cart.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const total = Number(cart.total || calculatedCartTotal) + Number(subscription?.total || 0);

  const message = `New Order Request

Name: ${name}
Phone: ${phone}
Address: ${fullAddress}

Items:
${itemsList}
${subSection}
Total: ₹${Number(total || 0).toFixed(2)}

Preferred Delivery Slot: ${slot || "Standard"}
Payment Mode: UPI / WhatsApp Pay`;

  const phoneDigits = String(whatsappNumber || "").replace(/[^0-9]/g, "");
  console.log("[WhatsAppOrder] opening order link", {
    itemCount: cart.items.length,
    total,
    phoneDigits,
  });
  window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
};
