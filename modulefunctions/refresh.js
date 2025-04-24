const axios = require('axios');

let accessToken = null; 
let refreshInterval; 

async function refreshAccessToken() {
    try {
        const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });

        if (response.data && response.data.access_token) {
            accessToken = response.data.access_token;
            console.log('Access token refreshed:', accessToken);

            const expiresInMs = (response.data.expires_in - 300) * 1000;
            clearInterval(refreshInterval); 
            refreshInterval = setTimeout(refreshAccessToken, expiresInMs); 

        } else {
            console.error('Unexpected response from Zoho:', response.data);
        }
    } catch (error) {
        console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    }
}

function getAccessToken() {
    if (!accessToken) {
        console.error('Access token is not available. Did you call refreshAccessToken()?');
    }
    return accessToken;
}

async function scheduleTokenRefresh() {
    await refreshAccessToken(); 
}

module.exports = {
    refreshAccessToken,
    getAccessToken,
    scheduleTokenRefresh
};
