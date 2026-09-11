const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/';

export async function apiRequest(method, endpoint, data = null) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : null,
    });

    const responseData = await response.json();

    if (!response.ok) {
        const error = new Error(responseData.error || 'API_REQUEST_FAILED');
        error.status = response.status;
        error.data = responseData;
        throw error;
    }

    return responseData;
}