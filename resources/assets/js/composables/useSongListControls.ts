import { useRouter } from '@/composables'

export const useSongListControls = () => {
  const { isCurrentScreen } = useRouter()

  const getSongListControlsConfig = () => {
    const config: SongListControlsConfig = {
      play: true,
      addTo: {
        queue: true
      },
      clearQueue: false,
      deletePlaylist: false,
      refresh: false,
      filter: false
    }

    config.clearQueue = isCurrentScreen('Queue')
    config.addTo.queue = !isCurrentScreen('Queue')
    config.deletePlaylist = isCurrentScreen('Playlist')
    config.refresh = isCurrentScreen('Playlist')

    config.filter = isCurrentScreen(
      'Queue',
      'Artist',
      'Album',
      'RecentlyPlayed',
      'Playlist',
      'Search.Songs'
    )

    return config
  }

  return {
    getSongListControlsConfig
  }
}
