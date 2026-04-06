// API Types
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  avatar?: string;
  coverImage?: string;
  price?: number;
  currency?: string;
  iapProductId?: string;
  isPurchased?: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  avatar?: string;
  coverImage?: string;
  order: number;
  courseId?: string;
  moduleId?: string;
  price?: number;
  currency?: string;
  iapProductId?: string;
  isPurchased?: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Audiobook {
  id: string;
  title: string;
  description?: string;
  author?: string;
  narrator?: string;
  avatar?: string;
  coverImage?: string;
  audioUrl?: string;
  duration?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  currentTime?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  lesson?: Lesson;
}

export interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  itemType: "COURSE" | "LESSON" | "AUDIOBOOK";
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  lessonId?: string;
  courseId?: string;
  parentCommentId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  replies?: Comment[];
  replyCount?: number;
}

export interface Note {
  id: string;
  userId: string;
  lessonId: string;
  content: string;
  timestamp?: number;
  createdAt: string;
  updatedAt: string;
  lesson?: Lesson;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Specific API Response Types
export interface CoursesResponse {
  courses: Course[];
  pagination: Pagination;
}

export interface LessonsResponse {
  lessons: Lesson[];
  pagination: Pagination;
}

export interface AudiobooksResponse {
  audiobooks: Audiobook[];
  pagination: Pagination;
}

// Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateProgressRequest {
  lessonId: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress?: number;
  currentTime?: number;
}

export interface CreateFavoriteRequest {
  itemId: string;
  itemType: "COURSE" | "LESSON" | "AUDIOBOOK";
}

export interface CreateCommentRequest {
  lessonId?: string;
  courseId?: string;
  parentCommentId?: string;
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CreateNoteRequest {
  lessonId: string;
  content: string;
  timestamp?: number;
}

export interface UpdateNoteRequest {
  content: string;
  timestamp?: number;
}

// IAP/Purchase Types
export interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  itemType: "COURSE" | "LESSON";
  price: number;
  currency: string;
  transactionId: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequest {
  itemId: string;
  itemType: "COURSE" | "LESSON";
  transactionId: string;
  receiptData?: string;
}
