// API Configuration - Update these URLs to match your Java backend
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080', // Change this to your backend URL
    ENDPOINTS: {
        // Authentication - Updated to match backend endpoints
        LOGIN: '/user/login',
        REGISTER: '/user/register',
        LOGOUT: '/user/logout',
        REFRESH_TOKEN: '/auth/refresh',

        // Cards - Based on your GwentController
        GET_CARD_TEMPLATES: '/cards/templates',
        GET_CARD_TEMPLATE: '/cards/templates/{templateId}',
        GET_ALL_CARDS: '/cards',
        GET_CARD_LISTINGS: '/cards/listings/{cardName}',
        LIST_CARD: '/cards/list/{cardName}/{number}',
        BUY_CARD: '/cards/buy/{cardName}/{number}',

        // Packs - Based on your PackController
        GET_PACKS: '/pack',
        OPEN_PACK: '/pack/{packName}',

        // User endpoints - Available in backend
        GET_USER_COLLECTION: '/user/collection',
        GET_USER_BALANCE: '/user/balance',
        QUICKSELL_CARD: '/cards/quicksell/{cardName}/{number}'
    }
};

// Authentication token management - Updated for cookie-based auth
class AuthManager {
    constructor() {
        // Since your backend uses cookies (JwtUtils.JWT_HEADER), we don't need localStorage
        this.authenticated = this.checkAuthStatus();
    }

    checkAuthStatus() {
        // Check if JWT cookie exists
        return document.cookie.split(';').some(cookie => cookie.trim().startsWith('JWT='));
    }

    setAuthenticated(status) {
        this.authenticated = status;
    }

    clearTokens() {
        this.authenticated = false;
        // Clear JWT cookie by setting it to expire
        document.cookie = 'JWT=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    isAuthenticated() {
        return this.authenticated;
    }

    getAuthHeaders() {
        // Since using cookies, no need to add Authorization header
        // The browser will automatically send cookies
        return {};
    }
}

const authManager = new AuthManager();

// HTTP Client
class HttpClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Content-Type': 'application/json',
                ...authManager.getAuthHeaders(),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            // Handle authentication errors
            if (response.status === 401) {
                authManager.clearTokens();
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Authentication failed');
            }

            return this.handleResponse(response);
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async handleResponse(response) {
        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorText || errorMessage;
            } catch {
                // If not JSON, use the raw text as error message
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        return response.text();
    }

    async refreshAuthToken() {
        if (!authManager.refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: authManager.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                authManager.setTokens(data.token, data.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        return false;
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

const httpClient = new HttpClient(API_CONFIG.BASE_URL);

// API Service Classes
class AuthAPI {
    async login(email, password) {
        // Backend expects GET request with query parameters
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);
        
        const response = await httpClient.get(`${API_CONFIG.ENDPOINTS.LOGIN}?${params.toString()}`);
        
        // Backend sets JWT cookie automatically, update auth status
        authManager.setAuthenticated(true);
        
        return response;
    }

    async register(username, email, password) {
        // Backend expects POST request with form parameters
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('email', email);
        params.append('password', password);
        
        const response = await httpClient.request(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });
        
        return response;
    }

    async logout() {
        try {
            await httpClient.get(API_CONFIG.ENDPOINTS.LOGOUT);
        } finally {
            authManager.clearTokens();
        }
    }

    isAuthenticated() {
        return authManager.isAuthenticated();
    }
}

class UserAPI {
    async getCollection() {
        return httpClient.get(API_CONFIG.ENDPOINTS.GET_USER_COLLECTION);
    }

    async getBalance() {
        return httpClient.get(API_CONFIG.ENDPOINTS.GET_USER_BALANCE);
    }

    async quicksellCard(cardName, cardNumber) {
        const endpoint = API_CONFIG.ENDPOINTS.QUICKSELL_CARD
            .replace('{cardName}', encodeURIComponent(cardName))
            .replace('{number}', cardNumber);
        return httpClient.post(endpoint);
    }
}

class CardsAPI {
    async getTemplates(filters = {}) {
        const params = new URLSearchParams();

        // Load all cards without size limit for client-side pagination
        const sortBy = filters.sortBy || 'name';
        params.append('sortBy', sortBy);

        const queryString = params.toString();
        const endpoint = `${API_CONFIG.ENDPOINTS.GET_CARD_TEMPLATES}?${queryString}`;

        return httpClient.get(endpoint);
    }

    async getTemplate(templateId) {
        const endpoint = API_CONFIG.ENDPOINTS.GET_CARD_TEMPLATE.replace('{templateId}', templateId);
        return httpClient.get(endpoint);
    }

    async getAllCardsByName(name) {
        return httpClient.get(`${API_CONFIG.ENDPOINTS.GET_ALL_CARDS}?name=${encodeURIComponent(name)}`);
    }

    async getCardListings(cardName) {
        const endpoint = API_CONFIG.ENDPOINTS.GET_CARD_LISTINGS.replace('{cardName}', encodeURIComponent(cardName));
        return httpClient.get(endpoint);
    }

    async listCard(cardName, cardNumber, price) {
        const endpoint = API_CONFIG.ENDPOINTS.LIST_CARD
            .replace('{cardName}', encodeURIComponent(cardName))
            .replace('{number}', cardNumber);
        return httpClient.post(`${endpoint}?price=${price}`);
    }

    async buyCard(cardName, cardNumber) {
        const endpoint = API_CONFIG.ENDPOINTS.BUY_CARD
            .replace('{cardName}', encodeURIComponent(cardName))
            .replace('{number}', cardNumber);
        return httpClient.put(endpoint);
    }
}

class ListingsAPI {
    async getCardListings(cardName) {
        const endpoint = API_CONFIG.ENDPOINTS.GET_CARD_LISTINGS.replace('{cardName}', encodeURIComponent(cardName));
        return httpClient.get(endpoint);
    }

    async createListing(cardName, cardNumber, price) {
        const endpoint = API_CONFIG.ENDPOINTS.LIST_CARD
            .replace('{cardName}', encodeURIComponent(cardName))
            .replace('{number}', cardNumber);
        return httpClient.post(`${endpoint}?price=${price}`);
    }

    async buyCard(cardName, cardNumber) {
        const endpoint = API_CONFIG.ENDPOINTS.BUY_CARD
            .replace('{cardName}', encodeURIComponent(cardName))
            .replace('{number}', cardNumber);
        return httpClient.put(endpoint);
    }
}

class PacksAPI {
    async getPacks() {
        return httpClient.get(API_CONFIG.ENDPOINTS.GET_PACKS);
    }

    async openPack(packName) {
        const endpoint = API_CONFIG.ENDPOINTS.OPEN_PACK.replace('{packName}', encodeURIComponent(packName));
        return httpClient.get(endpoint);
    }

    async buyPack(packName) {
        const endpoint = API_CONFIG.ENDPOINTS.OPEN_PACK.replace('{packName}', encodeURIComponent(packName));
        return httpClient.get(endpoint);
    }
}

// API instances
const authAPI = new AuthAPI();
const userAPI = new UserAPI();
const cardsAPI = new CardsAPI();
const listingsAPI = new ListingsAPI();
const packsAPI = new PacksAPI();

// Note: Mock data removed - now using real Spring Boot API endpoints
// Make sure your Spring Boot backend is running on the configured BASE_URL

// Export API instances for use in the main application
window.API = {
    auth: authAPI,
    user: userAPI,
    cards: cardsAPI,
    listings: listingsAPI,
    packs: packsAPI,
    config: API_CONFIG,
    isAuthenticated: () => authAPI.isAuthenticated()
};