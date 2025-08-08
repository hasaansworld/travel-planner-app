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
  
  // NEW: Create or get existing user
  createUser: (params: { email: string; name: string }) => {
    const query = new URLSearchParams();
    query.append("email", params.email);
    query.append("name", params.name);

    return api.get<CreateUserResponse>(`/create-user?${query.toString()}`);
  },

  // NEW: Get all original plans for a user
  getUserPlans: (userId: number) => {
    const query = new URLSearchParams();
    query.append("user_id", userId.toString());

    return api.get<UserPlansResponse>(`/user-plans?${query.toString()}`);
  },

  // NEW: Get plan by ID with all updates
  getPlanById: (params: { plan_id: number; user_id: number }) => {
    const query = new URLSearchParams();
    query.append("user_id", params.user_id.toString());

    return api.get<GetPlanByIdResponse>(`/plan/${params.plan_id}?${query.toString()}`);
  },
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
  getNearbyPlaces: (params: { lat: number; long: number }) => {
    const query = new URLSearchParams();
    query.append("lat", params.lat.toString());
    query.append("long", params.long.toString());

    return api.get<{
      places: {
        name: string;
        location: { latitude: number; longitude: number };
        rating: number;
        address: string;
        types: string[];
        photos: any;
      }[];
    }>(`/get-nearby-places?${query.toString()}`);
  },

  createUserVisit: (params: {
    user_id: number;
    lat: number;
    long: number;
    name: string;
    place_type: string;
    address?: string;
  }) => {
    const query = new URLSearchParams();
    query.append("user_id", params.user_id.toString());
    query.append("lat", params.lat.toString());
    query.append("long", params.long.toString());
    query.append("name", params.name);
    query.append("place_type", params.place_type);
    if (params.address) query.append("address", params.address);

    return api.get<{
      success: boolean;
      id: number;
      history: string[];
    }>(`/user-visits?${query.toString()}`);
  },
};


// Add to travelApi or create a new api group if you prefer
export const planApi = {
  getPlan: (params: {
    user_id?: number;
    city_id?: number;
    lat?: number;
    lon?: number;
    radius_km?: number;
    rating?: number;
    intent?: string;
    start_date?: string; // ISO string date
    number_of_days?: number;
    model?: string;
    apiKey?: string;
  }) => {
    const query = new URLSearchParams();

    if (params.user_id !== undefined)
      query.append("user_id", params.user_id.toString());
    if (params.city_id !== undefined)
      query.append("city_id", params.city_id.toString());
    if (params.lat !== undefined) query.append("lat", params.lat.toString());
    if (params.lon !== undefined) query.append("lon", params.lon.toString());
    if (params.radius_km !== undefined)
      query.append("radius_km", params.radius_km.toString());
    if (params.rating !== undefined)
      query.append("rating", params.rating.toString());
    if (params.intent !== undefined) query.append("intent", params.intent);
    if (params.start_date !== undefined)
      query.append("start_date", params.start_date);
    if (params.number_of_days !== undefined)
      query.append("number_of_days", params.number_of_days.toString());
    if (params.model !== undefined) query.append("model", params.model);

    return api.get<{
      travel_plan_id: number;
      travel_plan: any;
      unique_places_count: number;
      processed_data: any;
      start_date: string;
      number_of_days: number;
      day_name: string;
      city: string;
      country: string;
      queries: string[];
      user_activity: string;
    }>(`/plan?${query.toString()}`);
  },
  updatePlan: (params: {
    user_id?: number;
    plan_id?: number;
    message?: string;
    model?: string;
    apiKey?: string;
  }) => {
    const query = new URLSearchParams();

    if (params.user_id !== undefined)
      query.append("user_id", params.user_id.toString());
    if (params.plan_id !== undefined) query.append("plan_id", params.plan_id.toString());
    if (params.message !== undefined) query.append("message", params.message);
    if (params.model !== undefined) query.append("model", params.model);

    return api.get<{
        travel_plan_id: number;
      updated_traval_plan: any;
    }>(`/update-plan?${query.toString()}`);
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

interface CreateUserResponse {
  user_id: number;
}

interface UserPlan {
  travel_plan_id: number;
  city: string;
  country: string;
  intent: string;
  travel_date: string | null;
  number_of_days: number;
  rating: number;
  radius_km: number;
  created_at: string | null;
  model: string;
}

interface UserPlansResponse {
  plans: UserPlan[];
  total_count: number;
}


interface PlanData {
  travel_plan_id: number;
  travel_plan: any;
  city: string;
  country: string;
  intent: string;
  start_date: string | null;
  number_of_days: number;
  rating: number;
  radius_km: number;
  lat: number;
  lon: number;
  model: string;
  created_at: string | null;
  update_for: number | null;
  day_name: string | null;
}

interface GetPlanByIdResponse {
  original_plan: PlanData;
  update_plans: PlanData[];
  total_updates: number;
  requested_plan_id: number;
  is_original: boolean;
}