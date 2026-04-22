"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import TrackPlayer, { State, Event, Track, usePlaybackState, useProgress } from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { apiService } from "../services/api"
import { setupPlayer } from "../services/trackPlayerService"

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
  playlist: AudioTrack[]
  currentIndex: number
  playTrack: (track: AudioTrack) => Promise<void>
  playPlaylist: (tracks: AudioTrack[], startIndex?: number) => Promise<void>
  playNext: () => Promise<void>
  playPrevious: () => Promise<void>
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
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [playbackRate, setPlaybackRateState] = useState(1.0)
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [playlist, setPlaylist] = useState<AudioTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // Use refs to avoid closure issues in playback callbacks
  const playlistRef = useRef<AudioTrack[]>([])
  const currentIndexRef = useRef(-1)
  const isInitialized = useRef(false)

  // Setup TrackPlayer on mount
  useEffect(() => {
    const initPlayer = async () => {
      if (isInitialized.current) return
      
      try {
        await setupPlayer()
        isInitialized.current = true
        await loadSavedPlaybackRate()
        
        // Set up event listeners
        const playbackStateListener = TrackPlayer.addEventListener(Event.PlaybackState, async (state) => {
          const playerState = state.state
          setIsPlaying(playerState === State.Playing)
        })

        const trackChangedListener = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (data) => {
          if (data.track != null) {
            const queue = await TrackPlayer.getQueue()
            const trackIndex = queue.findIndex((t) => t.id === data.track?.id)
            if (trackIndex !== -1) {
              setCurrentIndex(trackIndex)
              currentIndexRef.current = trackIndex
              
              // Update currentTrack from playlist
              const currentPlaylist = playlistRef.current
              if (currentPlaylist.length > 0 && trackIndex < currentPlaylist.length) {
                const track = currentPlaylist[trackIndex]
                setCurrentTrack(track)
                console.log(`🎵 Track changed to: ${track.title} [${trackIndex + 1}/${currentPlaylist.length}]`)
                
                // Load comments for new track
                await loadComments(track.id)
                
                // Update progress tracking
                await AsyncStorage.setItem("currentTrack", JSON.stringify(track))
                await apiService.updateProgress({ postId: track.id, status: 'IN_PROGRESS', progress: 0, currentTime: 0 })
              }
            }
          }
        })

        const progressListener = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (progress) => {
          setPosition(progress.position * 1000) // Convert to ms
          setDuration(progress.duration * 1000) // Convert to ms
          
          // Auto-mark as completed when 90% finished
          const currentQueue = await TrackPlayer.getQueue()
          const currentTrackIndex = await TrackPlayer.getActiveTrackIndex()
          if (currentTrackIndex !== undefined && currentQueue[currentTrackIndex]) {
            const track = currentQueue[currentTrackIndex]
            const progressPercent = progress.duration > 0 ? progress.position / progress.duration : 0
            if (progressPercent >= 0.9 && track.id) {
              markAsCompleted(track.id)
            }
          }
        })

        const queueEndedListener = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
          console.log("📻 Playlist finished - all tracks completed")
          // Queue has ended, no more tracks to play
        })

        console.log('✅ TrackPlayer initialized for background playback')
      } catch (error) {
        console.error('❌ Error initializing TrackPlayer:', error)
      }
    }
    
    initPlayer()
    
    return () => {
      TrackPlayer.reset()
    }
  }, [])
  
  // Sync refs with state
  useEffect(() => {
    playlistRef.current = playlist
  }, [playlist])
  
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const loadSavedPlaybackRate = async () => {
    try {
      const savedRate = await AsyncStorage.getItem("playbackRate")
      if (savedRate) {
        setPlaybackRateState(Number.parseFloat(savedRate))
      }
    } catch (error) {
      console.log("Error loading playback rate:", error)
    }
  }

  const playPlaylist = async (tracks: AudioTrack[], startIndex: number = 0) => {
    if (tracks.length === 0) {
      console.log('⚠️ Cannot play empty playlist')
      return
    }

    try {
      setIsLoading(true)
      console.log(`🎵 Playing playlist with ${tracks.length} tracks, starting at index ${startIndex}`)
      console.log('📋 Playlist tracks:', tracks.map((t, i) => `${i}: ${t.title}`).join(', '))
      
      // Store playlist in state and ref
      setPlaylist(tracks)
      playlistRef.current = tracks
      setCurrentIndex(startIndex)
      currentIndexRef.current = startIndex
      
      // Reset player and add all tracks to queue
      await TrackPlayer.reset()
      
      const trackDataList: Track[] = tracks.map((track) => ({
        id: track.id,
        url: track.isDownloaded ? `file://${track.url}` : track.url,
        title: track.title,
        artist: 'MindEnglish',
        duration: track.duration / 1000, // Convert ms to seconds
      }))
      
      await TrackPlayer.add(trackDataList)
      await TrackPlayer.setRate(playbackRate)
      
      // Skip to start index and play
      if (startIndex > 0) {
        await TrackPlayer.skip(startIndex)
      }
      await TrackPlayer.play()
      
      // Set current track
      const currentTrack = tracks[startIndex]
      setCurrentTrack(currentTrack)
      console.log(`▶️ Starting track ${startIndex + 1}/${tracks.length}: ${currentTrack.title}`)
      
      // Save current track and update progress
      await AsyncStorage.setItem("currentTrack", JSON.stringify(currentTrack))
      await apiService.updateProgress({ postId: currentTrack.id, status: 'IN_PROGRESS', progress: 0, currentTime: 0 })
      
      // Load comments for this track
      await loadComments(currentTrack.id)
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error playing playlist:", error)
      setIsLoading(false)
      throw error
    }
  }

  const playNext = async () => {
    const currentPlaylist = playlistRef.current
    const currentIdx = currentIndexRef.current
    
    console.log(`⏭️ playNext called - current index: ${currentIdx}, playlist length: ${currentPlaylist.length}`)
    
    if (currentPlaylist.length === 0) {
      console.log("⚠️ No playlist loaded")
      return
    }
    
    if (currentIdx >= currentPlaylist.length - 1) {
      console.log("⚠️ Already at last track")
      return
    }

    try {
      await TrackPlayer.skipToNext()
      // State will be updated by the track changed listener
    } catch (error) {
      console.error("Error skipping to next track:", error)
    }
  }

  const playPrevious = async () => {
    const currentPlaylist = playlistRef.current
    const currentIdx = currentIndexRef.current
    
    console.log(`⏮️ playPrevious called - current index: ${currentIdx}, playlist length: ${currentPlaylist.length}`)
    
    if (currentPlaylist.length === 0) {
      console.log("⚠️ No playlist loaded")
      return
    }
    
    if (currentIdx <= 0) {
      console.log("⚠️ Already at first track")
      return
    }

    try {
      await TrackPlayer.skipToPrevious()
      // State will be updated by the track changed listener
    } catch (error) {
      console.error("Error skipping to previous track:", error)
    }
  }

  const playTrack = async (track: AudioTrack) => {
    try {
      setIsLoading(true)

      // Reset player and add single track
      await TrackPlayer.reset()
      
      // Clear playlist state when playing single track
      setPlaylist([])
      playlistRef.current = []
      setCurrentIndex(-1)
      currentIndexRef.current = -1

      // Use downloaded file if available, otherwise stream
      const audioUri = track.isDownloaded ? `file://${track.url}` : track.url

      const trackData: Track = {
        id: track.id,
        url: audioUri,
        title: track.title,
        artist: 'MindEnglish',
        duration: track.duration / 1000, // Convert ms to seconds
      }

      await TrackPlayer.add(trackData)
      await TrackPlayer.setRate(playbackRate)
      await TrackPlayer.play()

      setCurrentTrack(track)
      console.log(`🎵 Now Playing: ${track.title} [Single Track]`)

      // Save current track and update play count
      await AsyncStorage.setItem("currentTrack", JSON.stringify(track))
      await apiService.updateProgress({ postId: track.id, status: 'IN_PROGRESS', progress: 0, currentTime: 0 })

      // Load comments for this track
      await loadComments(track.id)
    } catch (error) {
      console.error("Error playing track:", error)
      if (error instanceof Error) {
        console.error("Error details:", error.message)
      }
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const pauseTrack = async () => {
    await TrackPlayer.pause()

    // Save progress
    if (currentTrack) {
      const currentPosition = await TrackPlayer.getPosition()
      const currentDuration = await TrackPlayer.getDuration()
      const progress = currentDuration > 0 ? currentPosition / currentDuration : 0
      await apiService.updateProgress({
        postId: currentTrack.id,
        status: 'IN_PROGRESS',
        progress: progress,
        currentTime: currentPosition * 1000, // Convert to ms
      })
    }
  }

  const resumeTrack = async () => {
    await TrackPlayer.play()
  }

  const stopTrack = async () => {
    try {
      await TrackPlayer.reset()
      setCurrentTrack(null)
      setPosition(0)
      setDuration(0)
      await AsyncStorage.removeItem("currentTrack")
    } catch (error) {
      console.log("Error stopping track:", error)
    }
  }

  const seekTo = async (newPosition: number) => {
    // Convert ms to seconds
    await TrackPlayer.seekTo(newPosition / 1000)
    setPosition(newPosition)

    // Save progress
    if (currentTrack) {
      const currentDuration = await TrackPlayer.getDuration()
      const progress = currentDuration > 0 ? (newPosition / 1000) / currentDuration : 0
      await apiService.updateProgress({
        postId: currentTrack.id,
        status: 'IN_PROGRESS',
        progress: progress,
        currentTime: newPosition,
      })
    }
  }

  const setPlaybackRate = async (rate: number) => {
    await TrackPlayer.setRate(rate)
    setPlaybackRateState(rate)
    await AsyncStorage.setItem("playbackRate", rate.toString())
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
      console.log("Error marking track as completed:", error)
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
      console.log("Error marking track for repeat:", error)
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
      console.log("Error toggling favorite:", error)
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
      console.log("Error downloading track:", error)
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
      console.log("Error loading comments:", error)
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
      console.log("Error adding comment:", error)
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
      console.log("Error liking comment:", error)
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
        playlist,
        currentIndex,
        playTrack,
        playPlaylist,
        playNext,
        playPrevious,
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
