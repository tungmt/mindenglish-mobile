import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_CONFIG } from "../constants/config"
import type {
  AuthResponse,
  User,
  Course,
  Book,
  Post,
  Progress,
  Favorite,
  Comment,
  Note,
  CoursesResponse,
  BooksResponse,
  PostsResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  CreateProgressRequest,
  CreateFavoriteRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  Purchase,
  CreatePurchaseRequest,
} from "../types/api"

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem("token")
  }

  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken()

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }))
      // Handle both { error: "..." } and { message: "..." } formats
      const errorMessage = error.error || error.message || `HTTP ${response.status}`
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // ==================== Auth APIs ====================
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(API_CONFIG.ENDPOINTS.USER_LOGIN, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(API_CONFIG.ENDPOINTS.USER_REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(API_CONFIG.ENDPOINTS.SEND_VERIFICATION_CODE, {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(data: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async verifyEmail(data: { email: string; code: string }): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(API_CONFIG.ENDPOINTS.VERIFY_EMAIL, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(API_CONFIG.ENDPOINTS.RESEND_VERIFICATION, {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  // ==================== User Profile APIs ====================
  async getUserProfile(): Promise<User> {
    return this.makeRequest<User>(API_CONFIG.ENDPOINTS.USER_PROFILE)
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return this.makeRequest<User>(API_CONFIG.ENDPOINTS.USER_PROFILE, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(API_CONFIG.ENDPOINTS.USER_CHANGE_PASSWORD, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async uploadAvatar(file: { uri: string; type: string; name: string }): Promise<{ avatarUrl: string }> {
    const token = await this.getAuthToken()
    const formData = new FormData()
    formData.append("avatar", file as any)

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.USER_UPLOAD_AVATAR}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // ==================== Course APIs ====================
  async getCourses(params?: { page?: number; limit?: number; level?: string }): Promise<CoursesResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.level) queryParams.append("level", params.level)

    const query = queryParams.toString()
    const endpoint = query ? `${API_CONFIG.ENDPOINTS.USER_COURSES}?${query}` : API_CONFIG.ENDPOINTS.USER_COURSES

    return this.makeRequest<CoursesResponse>(endpoint)
  }

  async getCourseById(id: string): Promise<Course> {
    return this.makeRequest<Course>(API_CONFIG.ENDPOINTS.USER_COURSE_BY_ID(id))
  }

  // ==================== Book APIs ====================
  async getBooks(params?: { page?: number; limit?: number; bookType?: string; level?: string }): Promise<BooksResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.bookType) queryParams.append("bookType", params.bookType)
    if (params?.level) queryParams.append("level", params.level)

    const query = queryParams.toString()
    const endpoint = query ? `${API_CONFIG.ENDPOINTS.USER_BOOKS}?${query}` : API_CONFIG.ENDPOINTS.USER_BOOKS

    return this.makeRequest<BooksResponse>(endpoint)
  }

  async getBookById(id: string): Promise<Book> {
    return this.makeRequest<Book>(API_CONFIG.ENDPOINTS.USER_BOOK_BY_ID(id))
  }

  // ==================== Post APIs ====================
  async getPosts(params?: { page?: number; limit?: number; postType?: string; bookId?: string }): Promise<PostsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.postType) queryParams.append("postType", params.postType)
    if (params?.bookId) queryParams.append("bookId", params.bookId)

    const query = queryParams.toString()
    const endpoint = query ? `${API_CONFIG.ENDPOINTS.USER_POSTS}?${query}` : API_CONFIG.ENDPOINTS.USER_POSTS

    return this.makeRequest<PostsResponse>(endpoint)
  }

  async getPostById(id: string): Promise<Post> {
    return this.makeRequest<Post>(API_CONFIG.ENDPOINTS.USER_POST_BY_ID(id))
  }

  // ==================== Progress APIs ====================
  async getUserProgress(params?: { postId?: string; bookId?: string; courseId?: string }): Promise<Progress[]> {
    const queryParams = new URLSearchParams()
    if (params?.postId) queryParams.append("postId", params.postId)
    if (params?.bookId) queryParams.append("bookId", params.bookId)
    if (params?.courseId) queryParams.append("courseId", params.courseId)

    const query = queryParams.toString()
    const endpoint = query ? `${API_CONFIG.ENDPOINTS.USER_PROGRESS}?${query}` : API_CONFIG.ENDPOINTS.USER_PROGRESS

    const response = await this.makeRequest<{ progress: Progress[] }>(endpoint)
    return response.progress || []
  }

  async updateProgress(data: CreateProgressRequest): Promise<Progress> {
    return this.makeRequest<Progress>(API_CONFIG.ENDPOINTS.USER_PROGRESS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // ==================== Favorites APIs ====================
  async getFavorites(): Promise<Favorite[]> {
    return this.makeRequest<Favorite[]>(API_CONFIG.ENDPOINTS.USER_FAVORITES)
  }

  async addFavorite(data: CreateFavoriteRequest): Promise<Favorite> {
    return this.makeRequest<Favorite>(API_CONFIG.ENDPOINTS.USER_FAVORITES, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async removeFavorite(id: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(API_CONFIG.ENDPOINTS.USER_FAVORITE_BY_ID(id), {
      method: "DELETE",
    })
  }

  // ==================== Comments APIs ====================
  async getComments(params?: { postId?: string; bookId?: string; courseId?: string }): Promise<Comment[]> {
    const queryParams = new URLSearchParams()
    if (params?.postId) queryParams.append("postId", params.postId)
    if (params?.bookId) queryParams.append("bookId", params.bookId)
    if (params?.courseId) queryParams.append("courseId", params.courseId)

    const query = queryParams.toString()
    const endpoint = query ? `${API_CONFIG.ENDPOINTS.USER_COMMENTS}?${query}` : API_CONFIG.ENDPOINTS.USER_COMMENTS

    return this.makeRequest<Comment[]>(endpoint)
  }

  async getCommentById(id: string): Promise<Comment> {
    return this.makeRequest<Comment>(API_CONFIG.ENDPOINTS.USER_COMMENT_BY_ID(id))
  }

  async createComment(data: CreateCommentRequest): Promise<Comment> {
    return this.makeRequest<Comment>(API_CONFIG.ENDPOINTS.USER_COMMENTS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateComment(id: string, data: UpdateCommentRequest): Promise<Comment> {
    return this.makeRequest<Comment>(API_CONFIG.ENDPOINTS.USER_COMMENT_BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteComment(id: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(API_CONFIG.ENDPOINTS.USER_COMMENT_BY_ID(id), {
      method: "DELETE",
    })
  }

  // ==================== Notes APIs ====================
  async getNotes(params?: { postId?: string; bookId?: string; courseId?: string }): Promise<Note[]> {
    const queryParams = new URLSearchParams()
    if (params?.postId) queryParams.append("postId", params.postId)
    if (params?.bookId) queryParams.append("bookId", params.bookId)
    if (params?.courseId) queryParams.append("courseId", params.courseId)

    const query = queryParams.toString()
    const endpoint = query ? `${API_CONFIG.ENDPOINTS.USER_NOTES}?${query}` : API_CONFIG.ENDPOINTS.USER_NOTES

    return this.makeRequest<Note[]>(endpoint)
  }

  async getNoteById(id: string): Promise<Note> {
    return this.makeRequest<Note>(API_CONFIG.ENDPOINTS.USER_NOTE_BY_ID(id))
  }

  async createNote(data: CreateNoteRequest): Promise<Note> {
    return this.makeRequest<Note>(API_CONFIG.ENDPOINTS.USER_NOTES, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateNote(id: string, data: UpdateNoteRequest): Promise<Note> {
    return this.makeRequest<Note>(API_CONFIG.ENDPOINTS.USER_NOTE_BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteNote(id: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(API_CONFIG.ENDPOINTS.USER_NOTE_BY_ID(id), {
      method: "DELETE",
    })
  }

  // ==================== Purchases APIs ====================
  async getPurchases(): Promise<Purchase[]> {
    return this.makeRequest<Purchase[]>(API_CONFIG.ENDPOINTS.USER_PURCHASES)
  }

  async createPurchase(data: CreatePurchaseRequest): Promise<Purchase> {
    return this.makeRequest<Purchase>(API_CONFIG.ENDPOINTS.USER_PURCHASES, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async verifyPurchase(transactionId: string): Promise<{ valid: boolean; purchase?: Purchase }> {
    return this.makeRequest<{ valid: boolean; purchase?: Purchase }>(
      `${API_CONFIG.ENDPOINTS.USER_PURCHASES}/verify/${transactionId}`,
    )
  }
}

export const apiService = new ApiService()
