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
import { apiService } from "../services/api"

const { width } = Dimensions.get("window")

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
  isEnrolled: boolean
  rating: number
}

export default function ExploreScreen({ navigation }: any) {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [loading, setLoading] = useState(true)

  const categories = ["All", "Business", "Daily Life", "Grammar", "Pronunciation", "Vocabulary"]

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [searchQuery, selectedCategory, courses])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const response = await apiService.getCourses({ page: 1, limit: 50 })
      
      // Transform API data to match component interface
      const coursesData = (response.courses || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description || "Chưa có mô tả",
        thumbnail: course.coverImage || course.avatar || "/placeholder.svg",
        instructor: "Cô Thúy", // TODO: Add instructor field to course model
        duration: 0, // TODO: Calculate from posts
        booksCount: course._count?.courseBooks || 0,
        postsCount: 0, // TODO: Calculate total posts from all books
        level: course.level || "BEGINNER",
        category: "Daily Life", // TODO: Add category field
        price: course.price || 0,
        isEnrolled: course.isFavorited || false,
        rating: 4.8, // TODO: Add rating system
      }))
      
      setCourses(coursesData)
    } catch (error) {
      console.log("Error loading courses:", error)
      // Initialize with empty array on error
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (selectedCategory !== "All") {
      filtered = filtered.filter((course) => course.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredCourses(filtered)
  }

  const handleEnrollCourse = async (courseId: string) => {
    try {
      // Add to favorites (enrollment tracking)
      await apiService.addFavorite({ courseId })
      setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, isEnrolled: true } : course)))
    } catch (error) {
      console.log("Error enrolling in course:", error)
    }
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    return `${minutes}m`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const renderCourseCard = ({ item: course }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate("CourseDetail", { courseId: course.id })}
    >
      <Image source={{ uri: course.thumbnail }} style={styles.courseImage} />

      {course.isEnrolled && (
        <View style={styles.enrolledBadge}>
          <Text style={styles.enrolledText}>Enrolled</Text>
        </View>
      )}

      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseInstructor}>by {course.instructor}</Text>
        <Text style={styles.courseDescription}>{course.description}</Text>

        <View style={styles.courseStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.statText}>{formatDuration(course.duration)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={14} color="#666" />
            <Text style={styles.statText}>{course.booksCount} books</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.statText}>{course.rating}</Text>
          </View>
        </View>

        <View style={styles.courseFooter}>
          <View>
            <Text style={styles.courseLevel}>{course.level}</Text>
            <Text style={styles.coursePrice}>{formatPrice(course.price)}</Text>
          </View>

          {course.isEnrolled ? (
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.enrollButton} onPress={() => handleEnrollCourse(course.id)}>
              <Text style={styles.enrollButtonText}>Enroll</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Courses</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Courses List */}
      <FlatList
        data={filteredCourses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.coursesList}
        refreshing={loading}
        onRefresh={loadCourses}
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
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "white",
  },
  coursesList: {
    paddingHorizontal: 20,
  },
  courseCard: {
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
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  enrolledBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#34C759",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enrolledText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  courseInfo: {
    padding: 15,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  courseStats: {
    flexDirection: "row",
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  courseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseLevel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  coursePrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  enrollButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  enrollButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  continueButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
})
