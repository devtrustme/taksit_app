const DEFAULT_MONTHLY_AMOUNT = 5000;

export function generatePaymentSchedule(saleDate, planMonths, totalPrice, firstPayment, monthlyAmount) {
  const payments = [];
  const base = new Date(saleDate);

  for (let i = 1; i <= planMonths; i++) {
    const due = new Date(base);
    due.setMonth(due.getMonth() + i);

    // For 12-month plans all installments are equal; for others the 1st is different
    const amount = (i === 1 && planMonths !== 12) ? firstPayment : monthlyAmount;

    payments.push({
      payment_number: i,
      amount_due: amount,
      amount_paid: 0,
      remaining: amount,
      due_date: due.toISOString().split('T')[0],
      status: 'pending',
    });
  }
  return payments;
}

export function suggestPayments(planMonths, totalPrice) {
  if (planMonths === 12) {
    // 12-month plan: equal monthly payments
    const monthly = totalPrice / 12;
    return { firstPayment: monthly, monthlyAmount: monthly };
  }
  if (planMonths === 6) {
    const monthly = DEFAULT_MONTHLY_AMOUNT;
    const first = totalPrice - 5 * monthly;
    return { firstPayment: first > 0 ? first : 0, monthlyAmount: monthly };
  }
  if (planMonths === 5) {
    const monthly = DEFAULT_MONTHLY_AMOUNT;
    const first = totalPrice - 4 * monthly;
    return { firstPayment: first > 0 ? first : 0, monthlyAmount: monthly };
  }
  const monthly = Math.ceil(totalPrice / planMonths);
  return { firstPayment: monthly, monthlyAmount: monthly };
}

export function getDueStatus(dueDate, status, snoozedTo) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const snoozed = snoozedTo ? new Date(snoozedTo) : null;

  if (status === 'paid') return 'paid';
  if (snoozed && snoozed > today) return 'snoozed';
  if (status === 'partial') return 'partial';
  if (due < today) return 'late';
  if (due.toDateString() === today.toDateString()) return 'today';
  return 'pending';
}

export function getDaysLate(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
