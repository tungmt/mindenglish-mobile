"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useAudio } from "../context/AudioContext"
import { apiService } from "../services/api"

const { width } = Dimensions.get("window")

interface UserCourse {
  id: string
  title: string
  thumbnail: string
  progress: number
  totalLessons: number
  completedLessons: number
  lastAccessedLesson?: string
  nextLesson?: {
    id: string
    title: string
    duration: number
  }
}

interface UserStats {
  totalListeningTime: number
  todayListeningTime: number
  weeklyListeningTime: number
  completedLessons: number
  currentStreak: number
  totalCourses: number
}

const strings = {
  goodMorning: "Chào buổi sáng,",
  goodAfternoon: "Chào buổi chiều,",
  goodEvening: "Chào buổi tối,",
  continueLearning: "Tiếp tục học",
  yourProgress: "Tiến trình của bạn",
  thisWeek: "Tuần này",
  yourCourses: "Khóa học của bạn",
  tapToContinue: "Chạm để tiếp tục nghe",
  today: "Hôm nay",
  completed: "Hoàn thành",
  courses: "Khóa học",
  listeningTime: "Thời gian nghe",
  currentStreak: "Chuỗi ngày",
  lessonsCompleted: "bài học hoàn thành",
  next: "Tiếp theo:",
  browseMore: "Xem thêm",
  HocVien: "Học viên",
}

export default function LearnScreen({ navigation }: any) {
  const { user } = useAuth()
  const { currentTrack, playTrack } = useAudio()
  const [userCourses, setUserCourses] = useState<UserCourse[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalListeningTime: 0,
    todayListeningTime: 0,
    weeklyListeningTime: 0,
    completedLessons: 0,
    currentStreak: 0,
    totalCourses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLearningData()
  }, [])

  const loadLearningData = async () => {
    try {
      setLoading(true)
      const [coursesResponse, progressData] = await Promise.all([
        apiService.getCourses({ page: 1, limit: 10 }),
        apiService.getUserProgress(),
      ])

      // Transform courses data with progress
      const coursesWithProgress = (coursesResponse.courses || []).map((course: any) => {
        // Get all modules for this course
        const courseModules = course.modules || []
        const allLessons = courseModules.flatMap((m: any) => m.lessons || [])
        
        // Calculate progress from all lessons in this course
        const courseLessonIds = allLessons.map((l: any) => l.id)
        const courseProgress = progressData.filter((p: any) => courseLessonIds.includes(p.lessonId))
        const totalLessons = allLessons.length
        const completedLessons = courseProgress.filter((p: any) => p.status === 'COMPLETED').length
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
        
        // Find next lesson (first lesson without completed progress)
        const nextLessonData = allLessons.find((lesson: any) => {
          const lessonProgress = courseProgress.find((p: any) => p.lessonId === lesson.id)
          return !lessonProgress || lessonProgress.status !== 'COMPLETED'
        })
        
        return {
          id: course.id,
          title: course.title,
          thumbnail: course.coverImage || course.avatar || '/placeholder.svg',
          progress: progress,
          totalLessons: totalLessons,
          completedLessons: completedLessons,
          lastAccessedLesson: undefined,
          nextLesson: nextLessonData ? {
            id: nextLessonData.id,
            title: nextLessonData.title || 'Tiếp tục học',
            duration: (nextLessonData.duration || 0) * 1000,
          } : undefined,
        }
      })

      setUserCourses(coursesWithProgress)
      
      // Calculate stats from progress data
      const completedLessons = progressData.filter((p: any) => p.status === 'COMPLETED').length
      const stats = {
        totalListeningTime: 0, // TODO: Calculate from listening history
        todayListeningTime: 0, // TODO: Calculate from today's listening
        weeklyListeningTime: 0, // TODO: Calculate from this week's listening
        completedLessons: completedLessons,
        currentStreak: 0, // TODO: Calculate streak from listening history
        totalCourses: coursesResponse.pagination.total,
      }
      setUserStats(stats)
    } catch (error) {
      console.error("Error loading learning data:", error)
      // Initialize with empty data on error
      setUserCourses([])
      setUserStats({
        totalListeningTime: 0,
        todayListeningTime: 0,
        weeklyListeningTime: 0,
        completedLessons: 0,
        currentStreak: 0,
        totalCourses: 0,
      })
    } finally {
      setLoading(false)
    }
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

  const renderCourseProgress = (course: UserCourse) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      onPress={() => navigation.navigate("CourseDetail", { courseId: course.id })}
    >
      <Image source={{ uri: course.thumbnail }} style={styles.courseImage} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseProgress}>
          {course.completedLessons}/{course.totalLessons} {strings.lessonsCompleted}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{course.progress}%</Text>
        </View>

        {course.nextLesson && (
          <TouchableOpacity style={styles.nextLessonButton}>
            <View style={styles.nextLessonInfo}>
              <Text style={styles.nextLessonTitle}>
                {strings.next} {course.nextLesson.title}
              </Text>
              <Text style={styles.nextLessonDuration}>{formatDuration(course.nextLesson.duration)}</Text>
            </View>
            <Ionicons name="play-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return strings.goodMorning
    if (hour < 18) return strings.goodAfternoon
    return strings.goodEvening
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || "Học viên"}!</Text>
        </View>
        <TouchableOpacity style={styles.streakContainer}>
          <Ionicons name="flame" size={20} color="#FF9500" />
          <Text style={styles.streakText}>{userStats.currentStreak}</Text>
        </TouchableOpacity>
      </View>

      {/* Continue Learning */}
      {currentTrack && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{strings.continueLearning}</Text>
          <TouchableOpacity style={styles.continueCard}>
            <View style={styles.continueInfo}>
              <Text style={styles.continueTitle}>{currentTrack.title}</Text>
              <Text style={styles.continueSubtitle}>{strings.tapToContinue}</Text>
            </View>
            <View style={styles.continueButton}>
              <Ionicons name="play" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Learning Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{strings.yourProgress}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{formatTime(userStats.todayListeningTime)}</Text>
            <Text style={styles.statLabel}>{strings.today}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{userStats.completedLessons}</Text>
            <Text style={styles.statLabel}>{strings.completed}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{userStats.totalCourses}</Text>
            <Text style={styles.statLabel}>{strings.courses}</Text>
          </View>
        </View>
      </View>

      {/* Weekly Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{strings.thisWeek}</Text>
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyNumber}>{formatTime(userStats.weeklyListeningTime)}</Text>
              <Text style={styles.weeklyLabel}>{strings.listeningTime}</Text>
            </View>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyNumber}>{userStats.currentStreak} days</Text>
              <Text style={styles.weeklyLabel}>{strings.currentStreak}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Your Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{strings.yourCourses}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Explore")}>
            <Text style={styles.seeAllText}>{strings.browseMore}</Text>
          </TouchableOpacity>
        </View>
        {userCourses.map(renderCourseProgress)}
      </View>
    </ScrollView>
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
  greeting: {
    fontSize: 16,
    color: "#666",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9500",
    marginLeft: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  seeAllText: {
    color: "#007AFF",
    fontSize: 16,
  },
  continueCard: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  weeklyCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weeklyStat: {
    alignItems: "center",
  },
  weeklyNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  weeklyLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  courseCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
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
  courseInfo: {
    padding: 15,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  courseProgress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  nextLessonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  nextLessonInfo: {
    flex: 1,
  },
  nextLessonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  nextLessonDuration: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
})
