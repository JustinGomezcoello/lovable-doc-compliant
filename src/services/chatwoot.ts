
export const getChatwootTotalConversations = async (): Promise<number> => {
    const apiUrl = import.meta.env.VITE_CHATWOOT_API_URL;
    const accessToken = import.meta.env.VITE_CHATWOOT_ACCESS_TOKEN;
    const accountId = import.meta.env.VITE_CHATWOOT_ACCOUNT_ID;

    if (!apiUrl || !accessToken || !accountId) {
        console.error("Chatwoot configuration missing in .env");
        return 0;
    }

    try {
        const response = await fetch(
            `${apiUrl}/api/v1/accounts/${accountId}/conversations?status=all&page=1`,
            {
                method: "GET",
                headers: {
                    "api_access_token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Chatwoot API error: ${response.statusText}`);
        }

        const data = await response.json();
        // The user specifically requested "all_count" from the meta data
        // Based on the screenshot/request: "all_count": 3560
        return data.data.meta.all_count || 0;
    } catch (error) {
        console.error("Error fetching Chatwoot conversations:", error);
        return 0;
    }
};
