export const formatCurrency = (amount = 0) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatPercentage = (value = 0, total = 0) => {
    if (!total || total === 0) return "0.0";
    return ((value / total) * 100).toFixed(1);
};