export const formatChange = (change) => {
    const num = Number(change);

    if(!Number.isFinite(num)) {
        return "0.00%";
    }

    if (num > 0) {
        return `+${num.toFixed(2)}%`;
    }

    if (num < 0) {
        return `${num.toFixed(2)}%`;
    }

    return "0.00%";
};