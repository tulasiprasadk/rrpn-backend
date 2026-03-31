# UI Flows

1. User selects a product from catalog.
2. Show "Subscribe & Save" on product page.
3. User opens SubscriptionSelector (plans vary by category).
4. User picks plan → FrequencySelector adapts (weeks/days/time slots).
5. User picks delivery days with CalendarPicker (for frequency model).
6. Show BundleUpgradeModal with recommended bundles (from RecommendationCarousel).
7. User confirms subscription, proceed to checkout with subscription metadata.
8. Backend creates subscription and schedules deliveries; notifications sent accordingly.

