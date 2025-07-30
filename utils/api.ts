// utils/api.ts
const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`API Response for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Upload file
  async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
  }
}

// Create and export API instance
export const api = new ApiService(API_BASE_URL);

// Specific API functions
export const userApi = {
  getProfile: () => api.get<User>("/user/profile"),
  updateProfile: (userData: Partial<User>) =>
    api.put<User>("/user/profile", userData),
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>("/auth/login", credentials),
};

export const travelApi = {
  createPlan: (planData: TravelPlan) =>
    api.post<TravelPlan>("/travel/plans", planData),
  getPlans: () => api.get<TravelPlan[]>("/travel/plans"),
  getPlan: (id: string) => api.get<TravelPlan>(`/travel/plans/${id}`),
  updatePlan: (id: string, planData: Partial<TravelPlan>) =>
    api.put<TravelPlan>(`/travel/plans/${id}`, planData),
  deletePlan: (id: string) => api.delete(`/travel/plans/${id}`),
};

export const placesApi = {
  autocomplete: (query: string, sessionToken?: string) => {
    const params = new URLSearchParams({ query });
    if (sessionToken) {
      params.append("session_token", sessionToken);
    }
    return api.get<AutocompleteResponse>(`/autocomplete?${params.toString()}`);
  },
  placeDetails: (placeId: string, fields?: string) => {
    const params = new URLSearchParams({ place_id: placeId });
    if (fields) {
      params.append("fields", fields);
    }
    return api.get<PlaceDetailsResponse>(`/place-details?${params.toString()}`);
  },
};

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface TravelPlan {
  id: string;
  placeName: string;
  rating: number;
  radius: number;
  numberOfDays: number;
  date: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
  status: string;
  query: string;
}

interface AutocompleteSuggestion {
  place_id: string;
  text: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface PlaceDetailsResponse {
  place: PlaceDetails;
  status: string;
}

interface PlaceDetails {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  user_rating_count?: number;
  primary_type?: string;
  types: string[];
  address?: string;
  opening_hours?: any;
}
