"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import images from "../constants/images"

const { width } = Dimensions.get("window")

interface Book {
  id: string
  title: string
  author: string
  thumbnail: string
  postsCount: number
  totalDuration: number
  level: string
  bookType: "AUDIO" | "ARTICLE"
  isDownloaded: boolean
  progress: number
}

interface Course {
  id: string
  title: string
  author: string
  thumbnail: string
  booksCount: number
  totalDuration: number
  level: string
  isEnrolled: boolean
  progress: number
}

export default function LibraryScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"books" | "courses">("books")
  const [searchQuery, setSearchQuery] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLibraryData()
  }, [])

  const getFilteredData = () => {
    if (!searchQuery.trim()) {
      return activeTab === "books" ? books : courses
    }

    const query = searchQuery.toLowerCase()
    if (activeTab === "books") {
      return books.filter((book) =>
        book.title.toLowerCase().includes(query)
      )
    } else {
      return courses.filter((course) =>
        course.title.toLowerCase().includes(query)
      )
    }
  }

  const loadLibraryData = async () => {
    try {
      setLoading(true)
      // Import the API service
      const { apiService } = await import("../services/api")
      
      // Load books and courses from API
      const [booksResponse, coursesResponse] = await Promise.all([
        apiService.getBooks({ page: 1, limit: 50 }),
        apiService.getCourses({ page: 1, limit: 50 }),
      ])

      console.log({ booksResponse, coursesResponse })

      // Transform books data
      const booksData = (booksResponse.books || []).map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author || "Unknown Author",
        thumbnail: book.coverImage || book.avatar || images.appIcon,
        postsCount: book._count?.bookPosts || 0,
        totalDuration: 0, // TODO: Calculate from posts
        level: book.level || "BEGINNER",
        bookType: book.bookType || "AUDIO",
        isDownloaded: false, // TODO: Track downloads locally
        progress: 0, // TODO: Calculate from user progress
      }))
      
      setBooks(booksData)

      // Transform courses data
      const coursesData = (coursesResponse.courses || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        author: course.author ?? '', // TODO: Add author field to course model
        thumbnail: course.coverImage || images.appIcon,
        booksCount: course._count?.courseBooks || 0,
        totalDuration: 0, // TODO: Calculate from posts
        level: course.level || "BEGINNER",
        isEnrolled: course.isPublished, // TODO: Track user enrollment
        progress: 0, // TODO: Calculate from user progress
      }))
      
      setCourses(coursesData)
    } catch (error) {
      console.error("Error loading library data:", error)
      // Initialize with empty data on error
      setBooks([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const renderBook = ({ item: book }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate("BookDetail", { bookId: book.id })}
    >
      <Image source={{ uri: book.thumbnail ?? images.appIcon }} style={styles.bookCover} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.bookAuthor}>{t('common.by', { name: book.author })}</Text>

        <View style={styles.bookMeta}>
          <View style={styles.bookMetaItem}>
            <Ionicons name="book-outline" size={14} color="#666" />
            <Text style={styles.bookMetaText}>{book.postsCount} posts</Text>
          </View>
          <View style={styles.bookMetaItem}>
            <Ionicons name={book.bookType === "AUDIO" ? "volume-high-outline" : "document-text-outline"} size={14} color="#666" />
            <Text style={styles.bookMetaText}>{book.bookType === "AUDIO" ? "Audio" : "Article"}</Text>
          </View>
        </View>

        <View style={styles.bookLevel}>
          <Text style={styles.bookLevelText}>{book.level}</Text>
        </View>

        {book.progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${book.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{book.progress}%</Text>
          </View>
        )}

        <View style={styles.bookActions}>
          {book.isDownloaded && (
            <View style={styles.downloadedBadge}>
              <Ionicons name="download" size={12} color="#34C759" />
              <Text style={styles.downloadedText}>{t('library.downloaded')}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderCourse = ({ item: course }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate("CourseDetail", { courseId: course.id })}
    >
      <Image source={{ uri: course.thumbnail ?? images.appIcon }} style={styles.courseImage} />

      {course.isEnrolled && (
        <View style={styles.enrolledBadge}>
          <Text style={styles.enrolledText}>{t('library.enrolled')}</Text>
        </View>
      )}

      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.courseInstructor}>{t('common.by', { name: course.author })}</Text>

        <View style={styles.courseMeta}>
          <View style={styles.courseMetaItem}>
            <Ionicons name="book-outline" size={14} color="#666" />
            <Text style={styles.courseMetaText}>{course.booksCount} books</Text>
          </View>
          <View style={styles.courseMetaItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.courseMetaText}>{formatDuration(course.totalDuration)}</Text>
          </View>
        </View>

        <View style={styles.courseLevel}>
          <Text style={styles.courseLevelText}>{course.level}</Text>
        </View>

        {course.progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{course.progress}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('library.title')}</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('library.search_placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "books" && styles.activeTab]}
          onPress={() => setActiveTab("books")}
        >
          <Text style={[styles.tabText, activeTab === "books" && styles.activeTabText]}>{t('library.tab_books')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "courses" && styles.activeTab]}
          onPress={() => setActiveTab("courses")}
        >
          <Text style={[styles.tabText, activeTab === "courses" && styles.activeTabText]}>{t('library.tab_courses')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={getFilteredData() as any}
        onRefresh={loadLibraryData}
        refreshing={loading}
        renderItem={activeTab === "books" ? renderBook : (renderCourse as any)}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentList}
        columnWrapperStyle={styles.row}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
  },
  contentList: {
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: "space-between",
  },
  bookCard: {
    width: (width - 50) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: "#007AFF",
    marginBottom: 8,
  },
  bookMeta: {
    marginBottom: 8,
  },
  bookMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  bookMetaText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  bookLevel: {
    alignSelf: "flex-start",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookLevelText: {
    fontSize: 10,
    color: "#1976d2",
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: "#e0e0e0",
    borderRadius: 1.5,
    marginRight: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
  },
  bookActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  downloadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  downloadedText: {
    fontSize: 10,
    color: "#34C759",
    marginLeft: 2,
    fontWeight: "600",
  },
  courseCard: {
    width: (width - 50) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  enrolledBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#34C759",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  enrolledText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  courseInfo: {
    padding: 12,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 12,
    color: "#007AFF",
    marginBottom: 8,
  },
  courseMeta: {
    marginBottom: 8,
  },
  courseMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  courseMetaText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  courseLevel: {
    alignSelf: "flex-start",
    backgroundColor: "#f3e5f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  courseLevelText: {
    fontSize: 10,
    color: "#7b1fa2",
    fontWeight: "600",
  },
  featuredSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 20,
  },
  featuredLessonCard: {
    width: 160,
    backgroundColor: "white",
    borderRadius: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredLessonImage: {
    width: "100%",
    height: 90,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  featuredLessonInfo: {
    padding: 10,
  },
  featuredLessonTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  featuredLessonCourse: {
    fontSize: 11,
    color: "#007AFF",
    marginBottom: 6,
  },
  featuredLessonMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  featuredLessonDuration: {
    fontSize: 10,
    color: "#666",
    marginLeft: 4,
  },
})
