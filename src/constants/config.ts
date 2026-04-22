// API Configuration
// For iOS Simulator use: "http://localhost:3000"
// For Android Emulator use: "http://10.0.2.2:3000"
// For Physical Device use: "http://YOUR_COMPUTER_IP:3000" (e.g., "http://192.168.1.237:3000")
// For Production use: "https://your-domain.com"

// Automatically detect the appropriate base URL
const getBaseURL = () => {
  // return `http://localhost:3000`
  return `https://app.mindenglish.vn`
}

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  ENDPOINTS: {
    // User Auth
    USER_LOGIN: "/api/user/auth/login",
    USER_REGISTER: "/api/user/auth/register",
    SEND_VERIFICATION_CODE: "/api/auth/send-verification-code",
    RESET_PASSWORD: "/api/auth/reset-password",
    VERIFY_EMAIL: "/api/auth/verify-email",
    RESEND_VERIFICATION: "/api/auth/resend-verification",
    
    // User Profile
    USER_PROFILE: "/api/user/profile",
    USER_CHANGE_PASSWORD: "/api/user/profile/password",
    USER_UPLOAD_AVATAR: "/api/user/profile/avatar",
    
    // User Courses
    USER_COURSES: "/api/user/courses",
    USER_COURSE_BY_ID: (id: string) => `/api/user/courses/${id}`,
    
    // User Books
    USER_BOOKS: "/api/user/books",
    USER_BOOK_BY_ID: (id: string) => `/api/user/books/${id}`,
    
    // User Posts
    USER_POSTS: "/api/user/posts",
    USER_POST_BY_ID: (id: string) => `/api/user/posts/${id}`,
    
    // User Progress
    USER_PROGRESS: "/api/user/progress",
    
    // User Favorites
    USER_FAVORITES: "/api/user/favorites",
    USER_FAVORITE_BY_ID: (id: string) => `/api/user/favorites/${id}`,
    
    // User Comments
    USER_COMMENTS: "/api/user/comments",
    USER_COMMENT_BY_ID: (id: string) => `/api/user/comments/${id}`,
    
    // User Notes
    USER_NOTES: "/api/user/notes",
    USER_NOTE_BY_ID: (id: string) => `/api/user/notes/${id}`,
    
    // Purchases
    USER_PURCHASES: "/api/user/purchases",
  },
  TIMEOUT: 30000, // 30 seconds
};
