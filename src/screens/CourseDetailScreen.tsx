"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, FlatList, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "../services/api"
import { useAudio } from "../context/AudioContext"
import { useTranslation } from "react-i18next"
import { HTMLContent } from "../components/HTMLContent"
import { PurchaseModal } from "../components/PurchaseModal"
import { revenueCatService } from "../services/revenueCat"
import { Platform } from "react-native"

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  author: string
  duration: number
  booksCount: number
  postsCount: number
  level: string
  category: string
  price: number
  isFree: boolean
  currency: string
  iapProductIdAndroid?: string
  iapProductIdIos?: string
  accessMode: "SEQUENCE" | "PARALLEL"
  isEnrolled: boolean
  isPurchased: boolean
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
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [checkingPurchase, setCheckingPurchase] = useState(false)
  const { playPlaylist } = useAudio()
  const { t } = useTranslation()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null)
  const [localizedPrice, setLocalizedPrice] = useState<string | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  useEffect(() => {
    loadCourseDetail()
  }, [courseId])

  const loadCourseDetail = async () => {
    try {
      setLoading(true)
      const courseData: any = await apiService.getCourseById(courseId)
      
      // Check if user has purchased this course (if it's paid)
      let isPurchased = true // Default to true for free courses
      if (!courseData.isFree && courseData.price > 0) {
        const purchaseCheck = await apiService.checkCoursePurchase(courseId)
        isPurchased = purchaseCheck.purchased
      }
      
      // Transform API data to match component interface
      const books = courseData.courseBooks?.map((cb: any, bookIndex: number) => {
        const book = cb.book
        const posts = book.bookPosts?.map((bp: any, postIndex: number) => {
          const post = bp.post
          // Get progress info if available
          const progressInfo = post.userProgress
          const isCompleted = progressInfo?.status === 'COMPLETED'
          
          // Determine if post is locked based on access mode and purchase status
          let isLocked = false
          if (!isPurchased) {
            // If not purchased, lock all content
            isLocked = true
          } else if (courseData.accessMode === 'SEQUENCE' && postIndex > 0) {
            // In sequential mode when purchased, lock posts until previous is completed
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
        author: courseData.author || "MindEnglish",
        duration: totalDuration,
        booksCount: books.length,
        postsCount: totalPosts,
        level: courseData.level || "Beginner",
        category: "English Course",
        accessMode: courseData.accessMode || "SEQUENCE",
        price: courseData.price || 0,
        isFree: courseData.isFree ?? true,
        currency: courseData.currency || "VND",
        iapProductIdAndroid: courseData.iapProductIdAndroid,
        iapProductIdIos: courseData.iapProductIdIos,
        isEnrolled: courseData.isFavorited || false,
        isPurchased: isPurchased,
        rating: 4.8, // TODO: Add rating system
        books: books,
      })
      
      // Expand first book by default
      if (books.length > 0) {
        setExpandedBookId(books[0].id)
      }

      // Fetch localized price from RevenueCat if course is paid
      if (!courseData.isFree && courseData.price > 0) {
        const productId = Platform.OS === 'ios' 
          ? courseData.iapProductIdIos 
          : courseData.iapProductIdAndroid
        
        if (productId) {
          try {
            console.log({productId})
            const productInfo = await revenueCatService.getProductInfo(productId)
            console.log({productInfo})
            if (productInfo) {
              setLocalizedPrice(productInfo.priceString)
              console.log('📱 Localized price from RevenueCat:', productInfo.priceString)
            }
          } catch (error) {
            console.log('Error fetching product info from RevenueCat:', error)
          }
        }
      }
    } catch (error) {
      console.log("Error loading course detail:", error)
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

  const handlePurchase = async () => {
    if (!course) return

    const productId = Platform.OS === 'ios' 
      ? course.iapProductIdIos 
      : course.iapProductIdAndroid

    if (!productId) {
      Alert.alert(
        t('purchase.error'),
        t('purchase.product_not_configured')
      )
      return
    }

    setCheckingPurchase(true)
    setShowPurchaseModal(false)

    try {
      // Purchase via RevenueCat
      const success = await revenueCatService.purchaseCourse(course.id, productId)
      
      if (success) {
        Alert.alert(
          t('purchase.success_title'),
          t('purchase.success_message'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Reload course data to update purchase status
                loadCourseDetail()
              }
            }
          ]
        )
      }
    } catch (error: any) {
      console.log('Purchase error:', error)
      Alert.alert(
        t('purchase.error'),
        error.message || t('purchase.failed')
      )
    } finally {
      setCheckingPurchase(false)
    }
  }

  const handlePlayPost = async (post: Post, book: Book) => {
    if (!course) return

    // Check if course requires purchase
    if (!course.isFree && !course.isPurchased) {
      setShowPurchaseModal(true)
      return
    }

    if (post.isLocked) {
      Alert.alert(
        t('bookDetail.post_locked'),
        t('bookDetail.complete_previous')
      )
      return
    }

    if (post.postType === "AUDIO" && post.audioUrl) {
      // Get all audio posts from the book to create a playlist
      const audioPosts = book!.posts.filter(p => p.postType === "AUDIO" && p.audioUrl)
      
      // Find the index of the current post in the audio posts
      const currentIndex = audioPosts.findIndex(p => p.id === post.id)

      
      
      // Transform posts to audio tracks
      const audioTracks = audioPosts.map(p => ({
        id: p.id,
        title: `${book!.title} - ${p.title}`,
        url: p.audioUrl!,
        duration: p.duration,
        courseId: book!.id,
        isCompleted: p.isCompleted
      }))

      console.log({audioPosts, audioTracks})

      // Play as playlist
      await playPlaylist(audioTracks, currentIndex)
      navigation.navigate("AudioPlayer", { trackId: post.id })
    } else if (post.postType === "ARTICLE") {
      // Navigate to article reading screen
      navigation.navigate("ArticleReader", { 
        postId: post.id,
        bookId: book!.id
      })
    }
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    return t('courseDetail.minutes_unit', { count: minutes })
  }

  const formatPrice = (price: number, currency: string = "VND") => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price / 100) // Assuming cents for non-VND currencies
  }

  const toggleBookExpansion = (bookId: string) => {
    // If clicking the same book, collapse it. Otherwise, expand the new one
    setExpandedBookId(expandedBookId === bookId ? null : bookId)
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

  const renderBook = (book: Book) => {
    const isExpanded = expandedBookId === book.id
    
    return (
      <View key={book.id} style={styles.bookSection}>
        <TouchableOpacity 
          style={[styles.bookHeader, isExpanded && styles.bookHeaderExpanded]}
          onPress={() => toggleBookExpansion(book.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={'book'}
            size={20}
            color="#007AFF"
          />
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookPostsCount}>({book.postsCount})</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
            style={styles.expandIcon}
          />
        </TouchableOpacity>
        {isExpanded && book.posts.map((post) => renderPost(post, book))}
      </View>
    )
  }

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

  const descriptionStyle = isDescriptionExpanded ? styles.descriptionWrapper : styles.descriptionCollapsed

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
            <Text style={styles.courseInstructor}>{t('common.by', { name: course.author })}</Text>

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
            </View>

            <View style={styles.descriptionContainer}>
              <View style={descriptionStyle}>
                <HTMLContent 
                  content={course.description}
                  fontSize={16}
                />
              </View>
              <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <Text style={styles.showMoreText}>
                  {isDescriptionExpanded ? t('courseDetail.show_less') : t('courseDetail.show_more')}
                </Text>
                <Ionicons 
                  name={isDescriptionExpanded ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#007AFF" 
                />
              </TouchableOpacity>
            </View>

            {!course.isFree && !course.isPurchased ? (
              <View style={styles.priceContainer}>
                <View style={styles.priceInfo}>
                  <Text style={styles.priceLabel}>{t('courseDetail.price')}</Text>
                  <Text style={styles.coursePrice}>
                    {localizedPrice || formatPrice(course.price, course.currency)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.purchaseButton, checkingPurchase && styles.purchaseButtonDisabled]}
                  onPress={() => setShowPurchaseModal(true)}
                  disabled={checkingPurchase}
                >
                  <Ionicons name="lock-closed" size={16} color="white" style={styles.buttonIcon} />
                  <Text style={styles.purchaseButtonText}>
                    {checkingPurchase ? t('purchase.processing') : t('purchase.unlock_course')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : course.isFree && !course.isEnrolled ? (
              <View style={styles.priceContainer}>
                <TouchableOpacity
                  style={[styles.enrollButton, enrolling && styles.enrollButtonDisabled]}
                  onPress={handleEnroll}
                  disabled={enrolling}
                >
                  <Text style={styles.enrollButtonText}>
                    {enrolling ? t('courseDetail.enrolling') : t('courseDetail.enroll_free')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : course.isPurchased ? (
              <View style={styles.purchasedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.purchasedText}>{t('purchase.purchased')}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Books and Posts List */}
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>{t('courseDetail.content_list')}</Text>
          {course.books.map(renderBook)}
        </View>
      </ScrollView>

      {/* Purchase Modal */}
      {course && (
        <PurchaseModal
          visible={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          title={course.title}
          price={course.price}
          currency={course.currency}
          localizedPrice={localizedPrice}
          iapProductIdAndroid={course.iapProductIdAndroid}
          iapProductIdIos={course.iapProductIdIos}
          onPurchaseSuccess={handlePurchase}
        />
      )}
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
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionWrapper: {
    overflow: 'hidden',
  },
  descriptionCollapsed: {
    overflow: 'hidden',
    maxHeight: 120, // Approximately 5 lines with line height of 24
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  priceContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 10,
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: "#666",
  },
  coursePrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  purchaseButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  purchasedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  purchasedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  enrollButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
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
    marginBottom: 0,
  },
  bookHeaderExpanded: {
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
    marginRight: 8,
  },
  expandIcon: {
    marginLeft: 'auto',
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
