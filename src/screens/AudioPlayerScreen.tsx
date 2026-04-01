"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"
import { useAudio } from "../context/AudioContext"
import { strings } from "../constants/strings"

const { width, height } = Dimensions.get("window")

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: number
  likes: number
  isLiked: boolean
  replies?: Comment[]
}

export default function AudioPlayerScreen({ navigation, route }: any) {
  const { trackId } = route.params || {}
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    playbackRate,
    isLoading,
    comments,
    pauseTrack,
    resumeTrack,
    seekTo,
    setPlaybackRate,
    markAsCompleted,
    markAsRepeat,
    toggleFavorite,
    downloadTrack,
    addComment,
    likeComment,
  } = useAudio()

  const [activeTab, setActiveTab] = useState<"transcript" | "notes" | "comments">("transcript")
  const [showSpeedModal, setShowSpeedModal] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [showCommentInput, setShowCommentInput] = useState(false)

  const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

  useEffect(() => {
    if (!currentTrack && trackId) {
      // Load track if not already loaded
      navigation.goBack()
    }
  }, [currentTrack, trackId])

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const weeks = Math.floor(diff / 604800000)

    if (minutes < 1) return strings.timeAgo.justNow
    if (minutes < 60) return strings.timeAgo.minuteAgo.replace("{count}", minutes.toString())
    if (hours < 24) return strings.timeAgo.hourAgo.replace("{count}", hours.toString())
    if (days < 7) return strings.timeAgo.dayAgo.replace("{count}", days.toString())
    return strings.timeAgo.weekAgo.replace("{count}", weeks.toString())
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      resumeTrack()
    }
  }

  const handleSeek = (value: number) => {
    seekTo(value)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed)
    setShowSpeedModal(false)
  }

  const handleMarkCompleted = () => {
    if (currentTrack) {
      markAsCompleted(currentTrack.id)
      Alert.alert(strings.success, "Đã đánh dấu bài học hoàn thành!")
    }
  }

  const handleMarkRepeat = () => {
    if (currentTrack) {
      markAsRepeat(currentTrack.id)
      const message = currentTrack.isMarkedForRepeat ? "Đã bỏ đánh dấu lặp lại" : "Đã đánh dấu để lặp lại"
      Alert.alert(strings.success, message)
    }
  }

  const handleToggleFavorite = () => {
    if (currentTrack) {
      toggleFavorite(currentTrack.id)
    }
  }

  const handleDownload = () => {
    if (currentTrack) {
      downloadTrack(currentTrack.id)
    }
  }

  const handleAddComment = async () => {
    if (commentText.trim() && currentTrack) {
      await addComment(currentTrack.id, commentText.trim())
      setCommentText("")
      setShowCommentInput(false)
    }
  }

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.commentItem}>
      <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{comment.userName}</Text>
          <Text style={styles.commentTime}>{getTimeAgo(comment.timestamp)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction} onPress={() => likeComment(comment.id)}>
            <Ionicons
              name={comment.isLiked ? "heart" : "heart-outline"}
              size={16}
              color={comment.isLiked ? "#FF3B30" : "#666"}
            />
            <Text style={styles.commentActionText}>{comment.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.commentActionText}>{strings.reply}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy bài học</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Audio Info */}
      <View style={styles.audioInfo}>
        <Image
          source={{ uri: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(currentTrack.title)}` }}
          style={styles.audioImage}
        />
        <Text style={styles.audioTitle}>{currentTrack.title}</Text>
        <Text style={styles.audioSubtitle}>MindEnglish</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.progressSlider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onValueChange={handleSeek}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E0E0E0"
          thumbStyle={styles.sliderThumb}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => seekTo(Math.max(0, position - 15000))}>
          <Ionicons name="play-back" size={24} color="#333" />
          <Text style={styles.controlLabel}>-15s</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} disabled={isLoading}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => seekTo(Math.min(duration, position + 15000))}>
          <Ionicons name="play-forward" size={24} color="#333" />
          <Text style={styles.controlLabel}>+15s</Text>
        </TouchableOpacity>
      </View>

      {/* Speed and Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowSpeedModal(true)}>
          <Text style={styles.speedText}>{playbackRate}x</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
          <Ionicons
            name={currentTrack.isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={currentTrack.isFavorite ? "#FF3B30" : "#666"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
          {currentTrack.downloadProgress !== undefined ? (
            <View style={styles.downloadProgress}>
              <Text style={styles.downloadText}>{currentTrack.downloadProgress}%</Text>
            </View>
          ) : (
            <Ionicons
              name={currentTrack.isDownloaded ? "download" : "download-outline"}
              size={24}
              color={currentTrack.isDownloaded ? "#34C759" : "#666"}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleMarkRepeat}>
          <Ionicons
            name={currentTrack.isMarkedForRepeat ? "repeat" : "repeat-outline"}
            size={24}
            color={currentTrack.isMarkedForRepeat ? "#007AFF" : "#666"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleMarkCompleted}>
          <Ionicons
            name={currentTrack.isCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
            size={24}
            color={currentTrack.isCompleted ? "#34C759" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transcript" && styles.activeTab]}
          onPress={() => setActiveTab("transcript")}
        >
          <Text style={[styles.tabText, activeTab === "transcript" && styles.activeTabText]}>{strings.transcript}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "notes" && styles.activeTab]}
          onPress={() => setActiveTab("notes")}
        >
          <Text style={[styles.tabText, activeTab === "notes" && styles.activeTabText]}>{strings.notes}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "comments" && styles.activeTab]}
          onPress={() => setActiveTab("comments")}
        >
          <Text style={[styles.tabText, activeTab === "comments" && styles.activeTabText]}>
            {strings.commentsTitle.replace("{count}", comments.length.toString())}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent}>
        {activeTab === "transcript" && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptText}>
              {currentTrack.transcript ||
                "Transcript sẽ được hiển thị ở đây. Bạn có thể theo dõi nội dung bài học một cách chi tiết và chính xác."}
            </Text>
          </View>
        )}

        {activeTab === "notes" && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>
              {currentTrack.notes ||
                "Ghi chú của bạn sẽ được lưu ở đây. Hãy ghi lại những điểm quan trọng trong bài học!"}
            </Text>
          </View>
        )}

        {activeTab === "comments" && (
          <View style={styles.commentsContainer}>
            {comments.length > 0 ? (
              comments.map(renderComment)
            ) : (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>{strings.noComments}</Text>
                <Text style={styles.noCommentsSubtext}>{strings.beFirstToComment}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Comment Input */}
      {activeTab === "comments" && (
        <View style={styles.commentInputContainer}>
          {showCommentInput ? (
            <View style={styles.commentInputExpanded}>
              <TextInput
                style={styles.commentInput}
                placeholder={strings.writeComment}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <View style={styles.commentInputActions}>
                <TouchableOpacity onPress={() => setShowCommentInput(false)}>
                  <Text style={styles.commentCancel}>{strings.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                  <Text style={[styles.commentPost, !commentText.trim() && styles.commentPostDisabled]}>
                    {strings.post}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.commentInputButton} onPress={() => setShowCommentInput(true)}>
              <Text style={styles.commentInputPlaceholder}>{strings.addComment}</Text>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Speed Modal */}
      <Modal visible={showSpeedModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.speedModal}>
            <Text style={styles.speedModalTitle}>{strings.playbackSpeed}</Text>
            {playbackSpeeds.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.speedOption, playbackRate === speed && styles.speedOptionActive]}
                onPress={() => handleSpeedChange(speed)}
              >
                <Text style={[styles.speedOptionText, playbackRate === speed && styles.speedOptionTextActive]}>
                  {speed}x
                </Text>
                {playbackRate === speed && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.speedModalClose} onPress={() => setShowSpeedModal(false)}>
              <Text style={styles.speedModalCloseText}>{strings.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 20,
  },
  audioInfo: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  audioImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  audioSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  progressContainer: {
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  progressSlider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#007AFF",
    width: 20,
    height: 20,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  controlButton: {
    alignItems: "center",
    marginHorizontal: 30,
  },
  controlLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  speedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  downloadProgress: {
    alignItems: "center",
    justifyContent: "center",
  },
  downloadText: {
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
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
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transcriptContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  notesContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  commentsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  commentActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  noComments: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: "#999",
  },
  commentInputContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  commentInputButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  commentInputPlaceholder: {
    fontSize: 14,
    color: "#666",
  },
  commentInputExpanded: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
  },
  commentInput: {
    fontSize: 14,
    color: "#333",
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  commentInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  commentCancel: {
    fontSize: 14,
    color: "#666",
    marginRight: 15,
  },
  commentPost: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  commentPostDisabled: {
    color: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  speedModal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  speedModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  speedOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  speedOptionActive: {
    backgroundColor: "#f0f8ff",
  },
  speedOptionText: {
    fontSize: 16,
    color: "#333",
  },
  speedOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  speedModalClose: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  speedModalCloseText: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
  },
})
