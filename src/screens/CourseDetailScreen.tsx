"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, FlatList, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "../services/api"
import { useAudio } from "../context/AudioContext"
import { useTranslation } from "react-i18next"

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: string
  duration: number
  booksCount: number
  postsCount: number
  level: string
  category: string
  price: number
  accessMode: "SEQUENCE" | "PARALLEL"
  isEnrolled: boolean
  rating: number
  books: Book[]
}

interface Book {
  id: string
  title: string
  bookType: "AUDIO" | "ARTICLE"
  postsCount: number
  posts: Post[]
}

interface Post {
  id: string
  title: string
  duration: number
  postType: "AUDIO" | "ARTICLE"
  isCompleted: boolean
  isLocked: boolean
  order: number
  audioUrl?: string
  content?: string
}

export default function CourseDetailScreen({ navigation, route }: any) {
  const { courseId } = route.params
  const { playTrack } = useAudio()
  const { t } = useTranslation()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    loadCourseDetail()
  }, [courseId])

  const loadCourseDetail = async () => {
    try {
      setLoading(true)
      const courseData: any = await apiService.getCourseById(courseId)
      
      // Transform API data to match component interface
      const books = courseData.courseBooks?.map((cb: any, bookIndex: number) => {
        const book = cb.book
        const posts = book.bookPosts?.map((bp: any, postIndex: number) => {
          const post = bp.post
          // Get progress info if available
          const progressInfo = post.userProgress
          const isCompleted = progressInfo?.status === 'COMPLETED'
          
          // Determine if post is locked based on access mode
          let isLocked = false
          if (courseData.accessMode === 'SEQUENCE' && !courseData.isEnrolled) {
            // In sequential mode, lock all posts if not enrolled
            isLocked = true
          } else if (courseData.accessMode === 'SEQUENCE' && postIndex > 0) {
            // In sequential mode when enrolled, lock posts until previous is completed
            const prevPost = book.bookPosts[postIndex - 1]?.post
            const prevCompleted = prevPost?.userProgress?.status === 'COMPLETED'
            isLocked = !prevCompleted
          }
          
          return {
            id: post.id,
            title: post.title,
            duration: (post.duration || 0) * 1000, // Convert seconds to milliseconds
            postType: post.postType,
            isCompleted: isCompleted,
            isLocked: isLocked,
            order: bp.order,
            audioUrl: post.audioUrl || "",
            content: post.content || "",
          }
        }) || []
        
        return {
          id: book.id,
          title: book.title,
          bookType: book.bookType,
          postsCount: posts.length,
          posts: posts,
        }
      }) || []
      
      // Calculate total posts and duration from all books
      const totalPosts = books.reduce((sum: number, b: any) => sum + b.postsCount, 0)
      const totalDuration = books.reduce((sum: number, b: any) => 
        sum + b.posts.reduce((pSum: number, p: any) => pSum + (p.duration || 0), 0), 0
      )
      
      setCourse({
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || t('courseDetail.no_description'),
        thumbnail: courseData.coverImage || "/placeholder.svg",
        instructor: courseData.author || "MindEnglish",
        duration: totalDuration,
        booksCount: books.length,
        postsCount: totalPosts,
        level: courseData.level || "Beginner",
        category: "English Course",
        accessMode: courseData.accessMode || "SEQUENCE",
        price: courseData.price || 0,
        isEnrolled: courseData.isFavorited || false,
        rating: 4.8, // TODO: Add rating system
        books: books,
      })
    } catch (error) {
      console.error("Error loading course detail:", error)
      Alert.alert(t('common.error'), t('courseDetail.error_loading'))
      setCourse(null)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!course) return

    setEnrolling(true)
    try {
      // Add to favorites to track enrollment
      await apiService.addFavorite({ courseId: course.id })
      {
        setCourse({ ...course, isEnrolled: true })
        Alert.alert(t('common.success'), t('courseDetail.enrolled_success'))
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('courseDetail.enroll_error'))
    } finally {
      setEnrolling(false)
    }
  }

  const handlePlayPost = async (post: Post, book: Book) => {
    if (post.isLocked) {
      Alert.alert(t('courseDetail.post_locked_title'), t('courseDetail.post_locked_msg'))
      return
    }

    if (post.postType === "AUDIO" && post.audioUrl) {
      const audioTrack = {
        id: post.id,
        title: `${book.title} - ${post.title}`,
        url: post.audioUrl,
        duration: post.duration,
        courseId: course!.id,
        content: post.content,
        isCompleted: post.isCompleted,
      }

      await playTrack(audioTrack)
      navigation.navigate("AudioPlayer", { trackId: post.id })
    } else if (post.postType === "ARTICLE") {
      // Navigate to article reader
      Alert.alert(t('courseDetail.article_reading_coming_soon'))
    }
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    return t('courseDetail.minutes_unit', { count: minutes })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const renderPost = (post: Post, book: Book) => (
    <TouchableOpacity
      key={post.id}
      style={[styles.lessonItem, post.isLocked && styles.lessonLocked]}
      onPress={() => handlePlayPost(post, book)}
      disabled={post.isLocked}
    >
      <View style={styles.lessonLeft}>
        <View style={[styles.lessonNumber, post.isCompleted && styles.lessonCompleted]}>
          {post.isCompleted ? (
            <Ionicons name="checkmark" size={16} color="white" />
          ) : post.isLocked ? (
            <Ionicons name="lock-closed" size={16} color="#ccc" />
          ) : (
            <Ionicons
              name={post.postType === "AUDIO" ? "musical-notes" : "document-text"}
              size={16}
              color="#007AFF"
            />
          )}
        </View>
        <View style={styles.lessonInfo}>
          <Text style={[styles.lessonTitle, post.isLocked && styles.lessonTitleLocked]}>{post.title}</Text>
          {post.postType === "AUDIO" && (
            <Text style={styles.lessonDuration}>{formatDuration(post.duration)}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.lessonPlayButton}>
        <Ionicons
          name={post.isLocked ? "lock-closed" : post.postType === "AUDIO" ? "play" : "eye"}
          size={20}
          color={post.isLocked ? "#ccc" : "#007AFF"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  const renderBook = (book: Book) => (
    <View key={book.id} style={styles.bookSection}>
      <View style={styles.bookHeader}>
        <Ionicons
          name={book.bookType === "AUDIO" ? "musical-notes" : "document-text"}
          size={20}
          color="#007AFF"
        />
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookPostsCount}>({book.postsCount})</Text>
      </View>
      {book.posts.map((post) => renderPost(post, book))}
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    )
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text>{t('courseDetail.not_found')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('courseDetail.title')}</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Course Info */}
        <View style={styles.courseInfo}>
          <Image source={{ uri: course.thumbnail }} style={styles.courseImage} />
          <View style={styles.courseDetails}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseInstructor}>{t('common.by', { name: course.instructor })}</Text>

            <View style={styles.courseStats}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.statText}>{formatDuration(course.duration)}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={16} color="#666" />
                <Text style={styles.statText}>{t('courseDetail.books_count', { count: course.booksCount })}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="list-outline" size={16} color="#666" />
                <Text style={styles.statText}>{t('courseDetail.posts_count', { count: course.postsCount })}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>{course.rating}</Text>
              </View>
            </View>

            <View style={styles.courseMeta}>
              <Text style={styles.courseLevel}>{course.level}</Text>
              <Text style={styles.courseCategory}>{course.category}</Text>
              <View style={styles.courseAccessMode}>
                <Ionicons
                  name={course.accessMode === "SEQUENCE" ? "arrow-forward" : "apps"}
                  size={12}
                  color="#7b1fa2"
                />
                <Text style={styles.courseAccessModeText}>
                  {course.accessMode === "SEQUENCE" ? t('courseDetail.sequential') : t('courseDetail.parallel')}
                </Text>
              </View>
            </View>

            <Text style={styles.courseDescription}>{course.description}</Text>

            {!course.isEnrolled && (
              <View style={styles.priceContainer}>
                <Text style={styles.coursePrice}>{formatPrice(course.price)}</Text>
                <TouchableOpacity
                  style={[styles.enrollButton, enrolling && styles.enrollButtonDisabled]}
                  onPress={handleEnroll}
                  disabled={enrolling}
                >
                  <Text style={styles.enrollButtonText}>{enrolling ? t('courseDetail.enrolling') : t('courseDetail.enroll')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Books and Posts List */}
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>{t('courseDetail.content_list')}</Text>
          {course.books.map(renderBook)}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  courseInfo: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseImage: {
    width: "100%",
    height: 200,
  },
  courseDetails: {
    padding: 20,
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  courseInstructor: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 15,
  },
  courseStats: {
    flexDirection: "row",
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  courseMeta: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  courseLevel: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 10,
  },
  courseCategory: {
    backgroundColor: "#f3e5f5",
    color: "#7b1fa2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 10,
  },
  courseAccessMode: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  courseAccessModeText: {
    color: "#e65100",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  courseDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coursePrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  enrollButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enrollButtonDisabled: {
    opacity: 0.6,
  },
  enrollButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  lessonsSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  bookSection: {
    marginBottom: 20,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  bookPostsCount: {
    fontSize: 14,
    color: "#666",
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lessonLocked: {
    opacity: 0.5,
  },
  lessonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lessonCompleted: {
    backgroundColor: "#34C759",
  },
  lessonNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  lessonTitleLocked: {
    color: "#ccc",
  },
  lessonDuration: {
    fontSize: 14,
    color: "#666",
  },
  lessonPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
})
