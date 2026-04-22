"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native"
import { FontAwesome6, Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { useAudio } from "../context/AudioContext"
import { apiService } from "../services/api"
import images from "../constants/images"

const { width } = Dimensions.get("window")

interface LatestBook {
  id: string
  title: string
  author: string
  bookType: string
  thumbnail: string | null
  postsCount: number
}

interface TodayStats {
  listeningTime: number
  completedLessons: number
  streak: number
}

interface LatestCourse {
  id: string
  title: string
  author: string
  thumbnail: string | null
  booksCount: number
}

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { currentTrack, playTrack } = useAudio()
  const [latestBooks, setLatestBooks] = useState<LatestBook[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({
    listeningTime: 0,
    completedLessons: 0,
    streak: 0,
  })
  const [latestCourses, setLatestCourses] = useState<LatestCourse[]>([])
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    loadHomeData()
    checkForCelebration()
  }, [])

  const loadHomeData = async () => {
    try {
      // Load user progress for statistics only
      const progressData = await apiService.getUserProgress()

      // Calculate today's stats from progress
      const completedToday = (progressData || []).filter((p: any) => {
        const completedDate = new Date(p.completedAt)
        const today = new Date()
        return p.status === 'COMPLETED' &&
          completedDate.toDateString() === today.toDateString()
      }).length

      setTodayStats({
        listeningTime: 0, // TODO: Calculate from listening stats API
        completedLessons: completedToday,
        streak: 0, // TODO: Calculate streak from listening stats
      })

      // Load latest 3 books
      const booksResponse = await apiService.getBooks({ page: 1, limit: 3 })
      const latestBooksData = (booksResponse.books || []).slice(0, 3).map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author || 'MindEnglish',
        bookType: book.bookType,
        thumbnail: book.coverImage || book.avatar,
        postsCount: book._count?.bookPosts || 0,
      }))

      setLatestBooks(latestBooksData)

      // Load latest 3 courses
      const coursesResponse = await apiService.getCourses({ page: 1, limit: 3 })
      const latestCoursesData = (coursesResponse.courses || []).slice(0, 3).map((course: any) => ({
        id: course.id,
        title: course.title,
        author: course.author || 'MindEnglish',
        thumbnail: course.coverImage || course.avatar,
        booksCount: course._count?.courseBooks || 0,
      }))

      setLatestCourses(latestCoursesData)
    } catch (error: any) {
      console.log("Error loading home data:", error)
      
      // If unauthorized, token is invalid - logout user
      if (error.message === "Unauthorized") {
        console.log("Token is invalid, logging out user...")
        const { Alert } = await import('react-native')
        Alert.alert(
          t('common.error'),
          "Your session has expired. Please log in again.",
          [
            {
              text: t('common.ok'),
              onPress: async () => {
                await logout()
              }
            }
          ]
        )
      }
      
      // Initialize with empty data on error
      setLatestBooks([])
      setTodayStats({ listeningTime: 0, completedLessons: 0, streak: 0 })
      setLatestCourses([])
    }
  }

  const checkForCelebration = () => {
    // Check if user just completed a lesson
    const lastCompletedLesson = "Ngày 4"
    if (lastCompletedLesson) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = user?.name || user?.email?.split('@')[0] || 'there'

    if (hour < 12) return t('home.greeting_morning', { name })
    if (hour < 18) return t('home.greeting_afternoon', { name })
    return t('home.greeting_evening', { name })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    return `${minutes}m`
  }

  const renderLatestBook = (book: LatestBook) => (
    <TouchableOpacity 
      key={book.id} 
      style={styles.recentAudioCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
    >
      <Image source={book.thumbnail ? { uri: book.thumbnail } : images.appIcon} style={styles.recentAudioImage} />
      <View style={styles.recentAudioInfo}>
        <Text style={styles.recentAudioTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.recentAudioCourse}>{book.author}</Text>
        <View style={styles.recentAudioMeta}>
          <View style={styles.bookTypeBadge}>
            <Ionicons 
              name={book.bookType === 'AUDIO' ? 'headset' : 'document-text'} 
              size={12} 
              color="#007AFF" 
            />
            <Text style={styles.bookTypeText}>
              {book.bookType === 'AUDIO' ? t('home.audio_book') : t('home.article_book')}
            </Text>
          </View>
          <Text style={styles.recentAudioDuration}>{book.postsCount} {t('home.posts')}</Text>
        </View>
      </View>
      <View style={styles.recentAudioPlayButton}>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </View>
    </TouchableOpacity>
  )

  const renderLatestCourse = (course: LatestCourse) => (
    <TouchableOpacity 
      key={course.id} 
      style={styles.popularAudioItem}
      onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
    >
      <Image source={course.thumbnail ? { uri: course.thumbnail } : images.appIcon} style={styles.popularAudioImage} />
      <View style={styles.popularAudioInfo}>
        <Text style={styles.popularAudioTitle} numberOfLines={1}>
          {course.title}
        </Text>
        <Text style={styles.popularAudioListeners}>{course.author} • {course.booksCount} {t('home.books')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {false && showCelebration && (
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationModal}>
            <Ionicons name="trophy" size={60} color="#FFD700" />
            <Text style={styles.celebrationTitle}>{t('home.celebration_title')}</Text>
            <Text style={styles.celebrationText}>{t('home.celebration_text', { lesson: 'Ngày 4' })}</Text>
            <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebration(false)}>
              <Text style={styles.celebrationButtonText}>{t('home.celebration_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header with Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>
        {/* <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity> */}
      </View>

      {/* Continue Listening */}
      {currentTrack && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.continue_listening')}</Text>
          </View>
          <TouchableOpacity style={styles.continueCard} onPress={() => navigation.navigate("AudioPlayer")}>
            <Image
              source={{
                uri: `/placeholder.svg?height=60&width=60&text=${encodeURIComponent(currentTrack.title.slice(0, 3))}`,
              }}
              style={styles.continueImage}
            />
            <View style={styles.continueInfo}>
              <Text style={styles.continueTitle}>{currentTrack.title}</Text>
              <Text style={styles.continueSubtitle}>{t('home.tap_to_continue')}</Text>
            </View>
            <View style={styles.continueButton}>
              <Ionicons name="play" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Progress */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.today_progress')}</Text>
          <TouchableOpacity style={{ paddingHorizontal: 5 }} onPress={() => navigation.navigate("Progress")}>
            <FontAwesome6 name="arrow-right" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{formatTime(todayStats.listeningTime)}</Text>
            <Text style={styles.statLabel}>{t('home.stat_listened')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{todayStats.completedLessons}</Text>
            <Text style={styles.statLabel}>{t('home.stat_completed')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{todayStats.streak}</Text>
            <Text style={styles.statLabel}>{t('home.stat_streak')}</Text>
          </View>
        </View>
      </View>

      {/* Latest Books */}
      {latestBooks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.latest_books')}</Text>
            <TouchableOpacity style={{ paddingHorizontal: 5 }} onPress={() => navigation.navigate("Library")}>
              <FontAwesome6 name="arrow-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {latestBooks.map(renderLatestBook)}
        </View>
      )}

      {/* Latest Courses */}
      {latestCourses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.latest_courses')}</Text>
            <TouchableOpacity style={{ paddingHorizontal: 5 }} onPress={() => navigation.navigate("Explore")}>
              <FontAwesome6 name="arrow-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.popularContainer}>{latestCourses.map(renderLatestCourse)}</View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.explore')}</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("Library")}>
            <Ionicons name="library-outline" size={32} color="#007AFF" />
            <Text style={styles.quickActionTitle}>{t('home.library')}</Text>
            <Text style={styles.quickActionSubtitle}>{t('home.all_books')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("Progress")}>
            <Ionicons name="analytics-outline" size={32} color="#34C759" />
            <Text style={styles.quickActionTitle}>{t('home.progress')}</Text>
            <Text style={styles.quickActionSubtitle}>{t('home.track_learning')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  celebrationModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginHorizontal: 40,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },
  celebrationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  celebrationButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  celebrationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  notificationButton: {
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
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  section: {
    marginBottom: 30,
    gap: 8
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1
  },
  seeAllText: {
    color: "#007AFF",
    fontSize: 16,
  },
  continueCard: {
    backgroundColor: "#007AFF",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  continueImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  continueInfo: {
    flex: 1,
  },
  continueTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  continueSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  continueButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  recentAudioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentAudioImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  recentAudioInfo: {
    flex: 1,
  },
  recentAudioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  recentAudioCourse: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  recentAudioMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  bookTypeText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  recentAudioDuration: {
    fontSize: 12,
    color: "#999",
    marginRight: 10,
  },
  recentAudioProgress: {
    flex: 1,
    height: 2,
    backgroundColor: "#e0e0e0",
    borderRadius: 1,
  },
  recentAudioProgressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 1,
  },
  recentAudioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  popularContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularAudioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  popularAudioImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  popularAudioInfo: {
    flex: 1,
  },
  popularAudioTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  popularAudioListeners: {
    fontSize: 12,
    color: "#666",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
})
