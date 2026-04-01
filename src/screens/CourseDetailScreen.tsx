"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, FlatList, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "../services/api"
import { useAudio } from "../context/AudioContext"
import { strings } from "../constants/strings"

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: string
  duration: number
  lessonsCount: number
  level: string
  category: string
  price: number
  isEnrolled: boolean
  rating: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  duration: number
  isCompleted: boolean
  isLocked: boolean
  order: number
  audioUrl: string
  script?: string
}

export default function CourseDetailScreen({ navigation, route }: any) {
  const { courseId } = route.params
  const { playTrack } = useAudio()
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
      const lessons = courseData.modules?.flatMap((module: any) => 
        module.lessons?.map((lesson: any) => {
          // Get progress info if available
          const progressInfo = lesson.progress?.[0]
          const isCompleted = progressInfo?.status === 'COMPLETED'
          const isFavorited = lesson.favorites?.length > 0
          
          return {
            id: lesson.id,
            title: lesson.title,
            duration: (lesson.duration || 0) * 1000, // Convert seconds to milliseconds
            isCompleted: isCompleted,
            isLocked: !courseData.isPublished, // Lock if course not published
            order: lesson.order,
            audioUrl: lesson.audioUrl || "",
            script: lesson.script,
            isFavorited: isFavorited,
          }
        }) || []
      ) || []
      
      // Calculate total duration from all lessons
      const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0)
      
      setCourse({
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || "Chưa có mô tả",
        thumbnail: courseData.coverImage || courseData.avatar || "/placeholder.svg",
        instructor: "Cô Thúy", // TODO: Add instructor field to course model
        duration: totalDuration,
        lessonsCount: lessons.length,
        level: courseData.level || "Beginner",
        category: "English Course",
        price: 0, // TODO: Add price field to course model
        isEnrolled: courseData.isFavorited || false,
        rating: 4.8, // TODO: Add rating system
        lessons: lessons,
      })
    } catch (error) {
      console.error("Error loading course detail:", error)
      Alert.alert(strings.error, "Không thể tải thông tin khóa học. Vui lòng thử lại.")
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
      await apiService.addFavorite({ itemId: course.id, itemType: "COURSE" })
      {
        setCourse({ ...course, isEnrolled: true })
        Alert.alert(strings.success, "Đăng ký khóa học thành công!")
      }
    } catch (error) {
      Alert.alert(strings.error, "Đăng ký thất bại. Vui lòng thử lại.")
    } finally {
      setEnrolling(false)
    }
  }

  const handlePlayLesson = async (lesson: Lesson) => {
    if (lesson.isLocked) {
      Alert.alert("Bài học bị khóa", "Vui lòng đăng ký khóa học để mở khóa bài học này.")
      return
    }

    const audioTrack = {
      id: lesson.id,
      title: lesson.title,
      url: lesson.audioUrl,
      duration: lesson.duration,
      courseId: course!.id,
      script: lesson.script,
      isCompleted: lesson.isCompleted,
    }

    await playTrack(audioTrack)
    navigation.navigate("AudioPlayer", { trackId: lesson.id })
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    return `${minutes} phút`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const renderLesson = ({ item: lesson }: { item: Lesson }) => (
    <TouchableOpacity
      style={[styles.lessonItem, lesson.isLocked && styles.lessonLocked]}
      onPress={() => handlePlayLesson(lesson)}
      disabled={lesson.isLocked}
    >
      <View style={styles.lessonLeft}>
        <View style={[styles.lessonNumber, lesson.isCompleted && styles.lessonCompleted]}>
          {lesson.isCompleted ? (
            <Ionicons name="checkmark" size={16} color="white" />
          ) : lesson.isLocked ? (
            <Ionicons name="lock-closed" size={16} color="#ccc" />
          ) : (
            <Text style={styles.lessonNumberText}>{lesson.order}</Text>
          )}
        </View>
        <View style={styles.lessonInfo}>
          <Text style={[styles.lessonTitle, lesson.isLocked && styles.lessonTitleLocked]}>{lesson.title}</Text>
          <Text style={styles.lessonDuration}>{formatDuration(lesson.duration)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.lessonPlayButton}>
        <Ionicons
          name={lesson.isLocked ? "lock-closed" : "play"}
          size={20}
          color={lesson.isLocked ? "#ccc" : "#007AFF"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{strings.loading}</Text>
      </View>
    )
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy khóa học</Text>
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
        <Text style={styles.headerTitle}>Chi tiết khóa học</Text>
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
            <Text style={styles.courseInstructor}>bởi {course.instructor}</Text>

            <View style={styles.courseStats}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.statText}>{formatDuration(course.duration)}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={16} color="#666" />
                <Text style={styles.statText}>{course.lessonsCount} bài học</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>{course.rating}</Text>
              </View>
            </View>

            <View style={styles.courseMeta}>
              <Text style={styles.courseLevel}>{course.level}</Text>
              <Text style={styles.courseCategory}>{course.category}</Text>
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
                  <Text style={styles.enrollButtonText}>{enrolling ? "Đang đăng ký..." : "Đăng ký ngay"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>Danh sách bài học</Text>
          <FlatList
            data={course.lessons}
            renderItem={renderLesson}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
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
