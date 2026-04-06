// API Configuration
// For iOS Simulator use: "http://localhost:3000"
// For Android Emulator use: "http://10.0.2.2:3000"
// For Physical Device use: "http://YOUR_COMPUTER_IP:3000" (e.g., "http://192.168.1.237:3000")
// For Production use: "https://your-domain.com"

// Automatically detect the appropriate base URL
const getBaseURL = () => {
  // If you're using a physical device, update this with your computer's IP address
  // You can find your IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
  const DEVELOPMENT_IP = "192.168.1.237" // Update this with your computer's local IP
  const DEVELOPMENT_PORT = "3000"
  
  // For production, set this environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL
  }
  
  // For development
  return `http://${DEVELOPMENT_IP}:${DEVELOPMENT_PORT}`
}

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  ENDPOINTS: {
    // User Auth
    USER_LOGIN: "/api/user/auth/login",
    USER_REGISTER: "/api/user/auth/register",
    SEND_VERIFICATION_CODE: "/api/auth/send-verification-code",
    RESET_PASSWORD: "/api/auth/reset-password",
    
    // User Profile
    USER_PROFILE: "/api/user/profile",
    USER_CHANGE_PASSWORD: "/api/user/profile/password",
    USER_UPLOAD_AVATAR: "/api/user/profile/avatar",
    
    // User Courses
    USER_COURSES: "/api/user/courses",
    USER_COURSE_BY_ID: (id: string) => `/api/user/courses/${id}`,
    
    // User Lessons
    USER_LESSONS: "/api/user/lessons",
    USER_LESSON_BY_ID: (id: string) => `/api/user/lessons/${id}`,
    
    // User Audiobooks
    USER_AUDIOBOOKS: "/api/user/audiobooks",
    USER_AUDIOBOOK_BY_ID: (id: string) => `/api/user/audiobooks/${id}`,
    
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
