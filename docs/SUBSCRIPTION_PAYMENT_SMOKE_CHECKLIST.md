# Subscription Payment Smoke Checklist

Use this checklist after changes to subscription, checkout, payment, or admin approval flows.

## Customer Checkout

- Logged-in customer can place a normal order and reach `/payment`.
- Guest customer can place a normal order and reach `/payment`.
- Payment page loads without runtime errors.
- Payment can be submitted with only transaction ID.
- Payment can be submitted with only screenshot.
- Invalid or missing `orderId` is rejected cleanly.

## Subscription Flow

- Repeat-item subscription can be selected on payment page.
- Upsell products appear in Step 2 when recommendations are available.
- Selecting repeat-item plus upsell updates the payable amount correctly.
- Monthly ration can be selected from the subscription type section.
- Ration package dropdown switches between Basic, Standard, Advanced, and Premium.
- Changing duration updates ration pricing correctly.
- Payment submission stores `subscriptionDraftId` when a draft-backed subscription is used.

## Admin Approval

- Admin sees `payment_submitted` notification after customer submits payment.
- Admin order detail shows subscription summary when a subscription was attached.
- Approving payment activates the subscription correctly.
- Activated subscription appears in customer subscriptions.

## Regression Checks

- Existing non-subscription orders still work.
- Guest orders cannot submit payment for another guest/customer order.
- Logged-in customers cannot submit payment for another customer's order.
- Payment screenshot path is saved correctly when image upload is used.
