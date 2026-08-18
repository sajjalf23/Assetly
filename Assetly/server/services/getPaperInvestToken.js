import fetch from "node-fetch";

export const getPaperInvestToken = async () => {
    const response = await fetch(
        `${process.env.PAPER_INVEST_BASE_URL}/v1/auth/token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                apiKey: process.env.PAPER_INVEST_API_KEY,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to authenticate with PaperInvest");
    }

    const data = await response.json();
    return data.token; // JWT token
};
