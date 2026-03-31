const dayjs = require('dayjs');

function computeNextDelivery(payload) {
  const now = dayjs();
  if (payload.next_delivery_date) return payload.next_delivery_date;
  // if delivery_days provided, pick next matching day
  if (payload.delivery_days && payload.delivery_days.length) {
    // delivery_days are weekday numbers 0(Sun)-6(Sat) or ISO day names
    const days = payload.delivery_days;
    for (let i=0;i<14;i++){
      const candidate = now.add(i, 'day');
      const wd = candidate.day();
      if (days.includes(wd)) return candidate.toISOString();
    }
  }
  // fallback: use frequency weeks ahead
  const freq = payload.frequency || 1;
  return now.add(freq, 'week').toISOString();
}

module.exports = { computeNextDelivery };
