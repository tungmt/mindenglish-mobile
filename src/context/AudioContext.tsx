"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Audio } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { apiService } from "../services/api"

interface AudioTrack {
  id: string
  title: string
  url: string
  duration: number
  courseId: string
  transcript?: string
  notes?: string
  isCompleted?: boolean
  isMarkedForRepeat?: boolean
  isFavorite?: boolean
  isDownloaded?: boolean
  downloadProgress?: number
}

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

interface AudioContextType {
  currentTrack: AudioTrack | null
  isPlaying: boolean
  position: number
  duration: number
  playbackRate: number
  isLoading: boolean
  comments: Comment[]
  playTrack: (track: AudioTrack) => Promise<void>
  pauseTrack: () => Promise<void>
  resumeTrack: () => Promise<void>
  stopTrack: () => Promise<void>
  seekTo: (position: number) => Promise<void>
  setPlaybackRate: (rate: number) => Promise<void>
  markAsCompleted: (trackId: string) => Promise<void>
  markAsRepeat: (trackId: string) => Promise<void>
  toggleFavorite: (trackId: string) => Promise<void>
  downloadTrack: (trackId: string) => Promise<void>
  addComment: (trackId: string, content: string) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
  loadComments: (trackId: string) => Promise<void>
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRateState] = useState(1.0)
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    // Configure audio settings
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    })
    
    loadSavedPlaybackRate()
    
    return sound
      ? () => {
          sound.unloadAsync()
        }
      : undefined
  }, [sound])

  const loadSavedPlaybackRate = async () => {
    try {
      const savedRate = await AsyncStorage.getItem("playbackRate")
      if (savedRate) {
        setPlaybackRateState(Number.parseFloat(savedRate))
      }
    } catch (error) {
      console.error("Error loading playback rate:", error)
    }
  }

  const playTrack = async (track: AudioTrack) => {
    try {
      setIsLoading(true)

      if (sound) {
        await sound.unloadAsync()
      }

      // Use downloaded file if available, otherwise stream
      const audioUri = track.isDownloaded ? `file://${track.url}` : track.url

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, rate: playbackRate },
      )

      setSound(newSound)
      setCurrentTrack(track)
      setIsPlaying(true)

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0)
          setDuration(status.durationMillis || 0)
          setIsPlaying(status.isPlaying)

          // Auto-mark as completed when 90% finished
          if (status.durationMillis && status.positionMillis) {
            const progress = status.positionMillis / status.durationMillis
            if (progress >= 0.9 && !track.isCompleted) {
              markAsCompleted(track.id)
            }
          }
        }
      })

      // Save current track and update play count
      await AsyncStorage.setItem("currentTrack", JSON.stringify(track))
      await apiService.updateProgress({ postId: track.id, status: 'IN_PROGRESS', progress: 0, currentTime: 0 })

      // Load comments for this track
      await loadComments(track.id)
    } catch (error) {
      console.error("Error playing track:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const pauseTrack = async () => {
    if (sound) {
      await sound.pauseAsync()
      setIsPlaying(false)

      // Save progress
      if (currentTrack) {
        const progress = duration > 0 ? position / duration : 0
        await apiService.updateProgress({
          postId: currentTrack.id,
          status: 'IN_PROGRESS',
          progress: progress,
          currentTime: position,
        })
      }
    }
  }

  const resumeTrack = async () => {
    if (sound) {
      await sound.playAsync()
      setIsPlaying(true)
    }
  }

  const stopTrack = async () => {
    try {
      if (sound) {
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
      }
      setCurrentTrack(null)
      setIsPlaying(false)
      setPosition(0)
      setDuration(0)
      await AsyncStorage.removeItem("currentTrack")
    } catch (error) {
      console.error("Error stopping track:", error)
    }
  }

  const seekTo = async (newPosition: number) => {
    if (sound) {
      await sound.setPositionAsync(newPosition)
      setPosition(newPosition)

      // Save progress
      if (currentTrack) {
        const progress = duration > 0 ? newPosition / duration : 0
        await apiService.updateProgress({
          postId: currentTrack.id,
          status: 'IN_PROGRESS',
          progress: progress,
          currentTime: newPosition,
        })
      }
    }
  }

  const setPlaybackRate = async (rate: number) => {
    if (sound) {
      await sound.setRateAsync(rate, true)
      setPlaybackRateState(rate)
      await AsyncStorage.setItem("playbackRate", rate.toString())
    }
  }

  const markAsCompleted = async (trackId: string) => {
    try {
      await apiService.updateProgress({ postId: trackId, status: 'COMPLETED', progress: 100 })

      // Update local state
      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack({ ...currentTrack, isCompleted: true })
      }

      // Update AsyncStorage
      const completedTracks = await AsyncStorage.getItem("completedTracks")
      const completed = completedTracks ? JSON.parse(completedTracks) : []
      if (!completed.includes(trackId)) {
        completed.push(trackId)
        await AsyncStorage.setItem("completedTracks", JSON.stringify(completed))
      }
    } catch (error) {
      console.error("Error marking track as completed:", error)
    }
  }

  const markAsRepeat = async (trackId: string) => {
    try {
      // API call to mark for repeat - using notes as a workaround
      // await apiService.createNote({ postId: trackId, content: 'Marked for repeat' })

      // Update local state
      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack({ ...currentTrack, isMarkedForRepeat: !currentTrack.isMarkedForRepeat })
      }

      // Update AsyncStorage
      const repeatTracks = await AsyncStorage.getItem("repeatTracks")
      const repeats = repeatTracks ? JSON.parse(repeatTracks) : []
      const index = repeats.indexOf(trackId)

      if (index > -1) {
        repeats.splice(index, 1)
      } else {
        repeats.push(trackId)
      }

      await AsyncStorage.setItem("repeatTracks", JSON.stringify(repeats))
    } catch (error) {
      console.error("Error marking track for repeat:", error)
    }
  }

  const toggleFavorite = async (trackId: string) => {
    try {
      // Check if already favorited, then either add or remove
      if (currentTrack?.isFavorite) {
        // Need to get favorite ID first - for now just toggle locally
        // await apiService.removeFavorite(favoriteId)
      } else {
        await apiService.addFavorite({ postId: trackId })
      }

      // Update local state
      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack({ ...currentTrack, isFavorite: !currentTrack.isFavorite })
      }

      // Update AsyncStorage
      const favoriteTracks = await AsyncStorage.getItem("favoriteTracks")
      const favorites = favoriteTracks ? JSON.parse(favoriteTracks) : []
      const index = favorites.indexOf(trackId)

      if (index > -1) {
        favorites.splice(index, 1)
      } else {
        favorites.push(trackId)
      }

      await AsyncStorage.setItem("favoriteTracks", JSON.stringify(favorites))
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const downloadTrack = async (trackId: string) => {
    try {
      // Start download
      if (currentTrack && currentTrack.id === trackId) {
        setCurrentTrack({ ...currentTrack, downloadProgress: 0 })
      }

      // Simulate download progress (replace with actual download logic)
      const downloadInterval = setInterval(() => {
        if (currentTrack && currentTrack.id === trackId) {
          const currentProgress = currentTrack.downloadProgress || 0
          if (currentProgress < 100) {
            setCurrentTrack({ ...currentTrack, downloadProgress: currentProgress + 10 })
          } else {
            setCurrentTrack({ ...currentTrack, isDownloaded: true, downloadProgress: undefined })
            clearInterval(downloadInterval)
          }
        }
      }, 200)

      // API call to get download URL and save file
      // Note: Download may need custom implementation
      // await apiService.getPostById(trackId)
    } catch (error) {
      console.error("Error downloading track:", error)
    }
  }

  const loadComments = async (trackId: string) => {
    try {
      const commentsData = await apiService.getComments({ postId: trackId })
      // Transform API comments to match local Comment interface
      const transformedComments = commentsData.map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        userName: comment.user?.name || 'Unknown User',
        userAvatar: comment.user?.avatar,
        content: comment.content,
        timestamp: new Date(comment.createdAt).getTime(),
        likes: 0, // Not yet implemented in API
        isLiked: false, // Not yet implemented in API
        replies: comment.replies?.map((reply) => ({
          id: reply.id,
          userId: reply.userId,
          userName: reply.user?.name || 'Unknown User',
          userAvatar: reply.user?.avatar,
          content: reply.content,
          timestamp: new Date(reply.createdAt).getTime(),
          likes: 0,
          isLiked: false,
        })),
      }))
      setComments(transformedComments)
    } catch (error) {
      console.error("Error loading comments:", error)
      // Mock comments for development
      setComments([
        {
          id: "1",
          userId: "user1",
          userName: "Nguyễn Thị Hoa",
          userAvatar: "/placeholder.svg?height=40&width=40&text=H",
          content: "Bài học này rất hay! Giọng đọc rất rõ ràng và dễ hiểu.",
          timestamp: Date.now() - 3600000, // 1 hour ago
          likes: 5,
          isLiked: false,
        },
        {
          id: "2",
          userId: "user2",
          userName: "Trần Văn Nam",
          userAvatar: "/placeholder.svg?height=40&width=40&text=N",
          content: "Mình đã nghe lại nhiều lần. Cảm ơn cô giáo!",
          timestamp: Date.now() - 7200000, // 2 hours ago
          likes: 3,
          isLiked: true,
        },
      ])
    }
  }

  const addComment = async (trackId: string, content: string) => {
    try {
      const newComment = await apiService.createComment({ postId: trackId, content })
      // Transform API comment to match local Comment interface
      const transformedComment: Comment = {
        id: newComment.id,
        userId: newComment.userId,
        userName: newComment.user?.name || 'Unknown User',
        userAvatar: newComment.user?.avatar,
        content: newComment.content,
        timestamp: new Date(newComment.createdAt).getTime(),
        likes: 0,
        isLiked: false,
      }
      setComments((prev) => [transformedComment, ...prev])
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const likeComment = async (commentId: string) => {
    try {
      // Note: Like functionality not in current API
      // await apiService.updateComment(commentId, { content: '...' })
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              }
            : comment,
        ),
      )
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration,
        playbackRate,
        isLoading,
        comments,
        playTrack,
        pauseTrack,
        resumeTrack,
        stopTrack,
        seekTo,
        setPlaybackRate,
        markAsCompleted,
        markAsRepeat,
        toggleFavorite,
        downloadTrack,
        addComment,
        likeComment,
        loadComments,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
