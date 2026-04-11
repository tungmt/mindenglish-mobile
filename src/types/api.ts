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
  accessMode?: "SEQUENCE" | "PARALLEL";
  avatar?: string;
  coverImage?: string;
  price?: number;
  isFree?: boolean;
  currency?: string;
  iapProductId?: string;
  isPurchased?: boolean;
  isPublished: boolean;
  courseBooks?: CourseBook[];
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  author?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  bookType: "AUDIO" | "ARTICLE";
  accessMode?: "SEQUENCE" | "PARALLEL";
  avatar?: string;
  coverImage?: string;
  price?: number;
  isFree?: boolean;
  currency?: string;
  iapProductId?: string;
  isPurchased?: boolean;
  isPublished: boolean;
  bookPosts?: BookPost[];
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  description?: string;
  postType: "AUDIO" | "ARTICLE";
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  content?: string;
  audioUrl?: string;
  transcript?: string;
  duration?: number;
  avatar?: string;
  isFree?: boolean;
  isPurchased?: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseBook {
  id: string;
  courseId: string;
  bookId: string;
  order: number;
  book?: Book;
  course?: Course;
}

export interface BookPost {
  id: string;
  bookId: string;
  postId: string;
  order: number;
  post?: Post;
  book?: Book;
}

export interface Progress {
  id: string;
  userId: string;
  courseId?: string;
  bookId?: string;
  postId?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  currentTime?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  post?: Post;
  book?: Book;
  course?: Course;
}

export interface Favorite {
  id: string;
  userId: string;
  courseId?: string;
  bookId?: string;
  postId?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  postId?: string;
  bookId?: string;
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
  postId?: string;
  bookId?: string;
  courseId?: string;
  content: string;
  timestamp?: number;
  createdAt: string;
  updatedAt: string;
  post?: Post;
  book?: Book;
  course?: Course;
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

export interface BooksResponse {
  books: Book[];
  pagination: Pagination;
}

export interface PostsResponse {
  posts: Post[];
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
  postId?: string;
  bookId?: string;
  courseId?: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress?: number;
  currentTime?: number;
}

export interface CreateFavoriteRequest {
  postId?: string;
  bookId?: string;
  courseId?: string;
}

export interface CreateCommentRequest {
  postId?: string;
  bookId?: string;
  courseId?: string;
  parentCommentId?: string;
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CreateNoteRequest {
  postId?: string;
  bookId?: string;
  courseId?: string;
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
  courseId?: string;
  bookId?: string;
  postId?: string;
  price: number;
  currency: string;
  transactionId: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  source: "STRIPE" | "APPLE_IAP" | "GOOGLE_IAP";
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequest {
  courseId?: string;
  bookId?: string;
  postId?: string;
  transactionId: string;
  receiptData?: string;
}
