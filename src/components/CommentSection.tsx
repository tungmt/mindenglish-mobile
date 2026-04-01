import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { apiService } from "../services/api"
import type { Comment } from "../types/api"

interface CommentSectionProps {
  lessonId?: string
  courseId?: string
}

export default function CommentSection({ lessonId, courseId }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    loadComments()
  }, [lessonId, courseId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const params = lessonId ? { lessonId } : courseId ? { courseId } : {}
      const response = await apiService.getComments(params)
      
      // Group comments by parent/child relationship
      const commentMap = new Map<string, Comment>()
      const topLevel: Comment[] = []
      
      response.forEach((comment: Comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] })
      })
      
      response.forEach((comment: Comment) => {
        const commentWithReplies = commentMap.get(comment.id)!
        
        if (comment.parentCommentId) {
          const parent = commentMap.get(comment.parentCommentId)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(commentWithReplies)
          }
        } else {
          topLevel.push(commentWithReplies)
        }
      })
      
      setComments(topLevel)
    } catch (error) {
      console.error("Error loading comments:", error)
      Alert.alert("Error", "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment")
      return
    }

    try {
      setSubmitting(true)
      await apiService.createComment({
        lessonId,
        courseId,
        content: newComment.trim(),
      })
      
      setNewComment("")
      await loadComments()
      Alert.alert("Success", "Comment posted!")
    } catch (error: any) {
      console.error("Error posting comment:", error)
      Alert.alert("Error", error.message || "Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Please enter a reply")
      return
    }

    try {
      setSubmitting(true)
      await apiService.createComment({
        lessonId,
        courseId,
        parentCommentId,
        content: replyText.trim(),
      })
      
      setReplyText("")
      setReplyingTo(null)
      await loadComments()
      Alert.alert("Success", "Reply posted!")
    } catch (error: any) {
      console.error("Error posting reply:", error)
      Alert.alert("Error", error.message || "Failed to post reply")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteComment(commentId)
            await loadComments()
            Alert.alert("Success", "Comment deleted")
          } catch (error: any) {
            console.error("Error deleting comment:", error)
            Alert.alert("Error", error.message || "Failed to delete comment")
          }
        },
      },
    ])
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = comment.userId === user?.id

    return (
      <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={styles.commentHeader}>
          {comment.user?.avatar ? (
            <Image source={{ uri: comment.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#999" />
            </View>
          )}
          <View style={styles.commentInfo}>
            <Text style={styles.commentAuthor}>{comment.user?.name || "Anonymous"}</Text>
            <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.commentContent}>{comment.content}</Text>
        
        {!isReply && (
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.replyButton}
              onPress={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Ionicons name="arrow-undo" size={16} color="#007AFF" />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
            {comment.replyCount && comment.replyCount > 0 && (
              <Text style={styles.replyCount}>
                {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
              </Text>
            )}
          </View>
        )}

        {replyingTo === comment.id && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <View style={styles.replyActions}>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitReplyButton}
                onPress={() => handleSubmitReply(comment.id)}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitReplyButtonText}>Reply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => renderComment(reply, true))}
          </View>
        )}
      </View>
    )
  }

  if (loading && comments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comments ({comments.length})</Text>
      </View>

      {/* New Comment Input */}
      <View style={styles.newCommentContainer}>
        <TextInput
          style={styles.newCommentInput}
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.submitButton, (!newComment.trim() || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to comment!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderComment(item)}
          contentContainerStyle={styles.commentsList}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  newCommentContainer: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  newCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  commentsList: {
    padding: 16,
  },
  commentContainer: {
    marginBottom: 16,
  },
  replyContainer: {
    marginLeft: 40,
    marginTop: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  commentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginLeft: 52,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 52,
    marginTop: 8,
    gap: 16,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyButtonText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  replyCount: {
    fontSize: 13,
    color: "#999",
  },
  replyInputContainer: {
    marginLeft: 52,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  replyInput: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    maxHeight: 80,
  },
  replyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    fontSize: 14,
    color: "#666",
    padding: 8,
  },
  submitReplyButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
    alignItems: "center",
  },
  submitReplyButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  repliesContainer: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 4,
  },
})
