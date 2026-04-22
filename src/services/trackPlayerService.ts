import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  Track,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player'

let isSetup = false

export const setupPlayer = async () => {
  if (isSetup) {
    return
  }

  try {
    await TrackPlayer.setupPlayer({
      autoUpdateMetadata: true,
      autoHandleInterruptions: true,
    })

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
      forwardJumpInterval: 10,
      backwardJumpInterval: 10,
    })

    isSetup = true
    console.log('✅ TrackPlayer setup complete')
  } catch (error) {
    console.error('❌ Error setting up TrackPlayer:', error)
    throw error
  }
}

export const resetPlayer = () => {
  isSetup = false
}

// Service handler for background playback
export const playbackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play()
  })

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause()
  })

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext()
  })

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious()
  })

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position)
  })

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    const position = await TrackPlayer.getPosition()
    TrackPlayer.seekTo(position + (event.interval || 10))
  })

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    const position = await TrackPlayer.getPosition()
    TrackPlayer.seekTo(Math.max(0, position - (event.interval || 10)))
  })
}

export default TrackPlayer
