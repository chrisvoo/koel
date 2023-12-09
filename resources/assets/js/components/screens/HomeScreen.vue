<template>
  <section id="homeWrapper">
    <ScreenHeader layout="collapsed">
      Total songs: {{ systemStats.totalSongs }}
      Total size: {{ humanFileSize(systemStats.totalBytes) }}
    </ScreenHeader>

    <div v-koel-overflow-fade class="main-scroll-wrap" @scroll="scrolling">
      <ScreenEmptyState v-if="libraryEmpty">
        <template #icon>
          <icon :icon="faVolumeOff" />
        </template>
        No songs found.
        <span class="secondary d-block">
          {{ isAdmin ? 'Have you set up your library yet?' : 'Contact your administrator to set up your library.' }}
        </span>
      </ScreenEmptyState>

      <template v-else>
        <div class="two-cols">
          <MostPlayedSongs data-testid="most-played-songs" :loading="loading" />
          <RecentlyPlayedSongs data-testid="recently-played-songs" :loading="loading" />
        </div>

        <div class="two-cols">
          <RecentlyAddedAlbums data-testid="recently-added-albums" :loading="loading" />
          <RecentlyAddedSongs data-testid="recently-added-songs" :loading="loading" />
        </div>

        <MostPlayedArtists data-testid="most-played-artists" :loading="loading" />
        <MostPlayedAlbums data-testid="most-played-albums" :loading="loading" />

        <ToTopButton />
      </template>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { faVolumeOff } from '@fortawesome/free-solid-svg-icons'
import { sample } from 'lodash'
import { computed, ref } from 'vue'
import { eventBus, logger, noop } from '@/utils'
import { commonStore, overviewStore, userStore, systemStore } from '@/stores'
import { useAuthorization, useDialogBox, useInfiniteScroll, useRouter } from '@/composables'

import MostPlayedSongs from '@/components/screens/home/MostPlayedSongs.vue'
import RecentlyPlayedSongs from '@/components/screens/home/RecentlyPlayedSongs.vue'
import RecentlyAddedAlbums from '@/components/screens/home/RecentlyAddedAlbums.vue'
import RecentlyAddedSongs from '@/components/screens/home/RecentlyAddedSongs.vue'
import MostPlayedArtists from '@/components/screens/home/MostPlayedArtists.vue'
import MostPlayedAlbums from '@/components/screens/home/MostPlayedAlbums.vue'
import ScreenHeader from '@/components/ui/ScreenHeader.vue'
import ScreenEmptyState from '@/components/ui/ScreenEmptyState.vue'

const { ToTopButton, scrolling } = useInfiniteScroll(() => noop())
const { isAdmin } = useAuthorization()
const { showErrorDialog } = useDialogBox()

const systemStats = computed(() => systemStore.state)
const libraryEmpty = computed(() => commonStore.state.song_length === 0)

const loading = ref(false)
let initialized = false

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
function humanFileSize(bytes, si=false, dp=1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}

eventBus.on('SONGS_DELETED', () => {
  overviewStore.refresh()
  systemStore.refresh()
})
  .on('SONGS_UPDATED', () => overviewStore.refresh())

useRouter().onScreenActivated('Home', async () => {
  if (!initialized) {
    loading.value = true
    try {
      await overviewStore.init()
      await systemStore.init()
      initialized = true
    } catch (e) {
      showErrorDialog('Failed to load home screen data. Please try again.', 'Error')
      logger.error(e)
    } finally {
      loading.value = false
    }
  }
})
</script>

<style lang="scss">
#homeWrapper {
  .two-cols {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: .7em 1em;
  }

  .recent {
    h1 button {
      float: right;
      padding: 6px 10px;
      margin-top: -3px;
    }
  }

  ol {
    display: grid;
    grid-gap: .7em 1em;
    align-content: start;
  }

  .main-scroll-wrap {
    section:not(:last-of-type) {
      margin-bottom: 48px;
    }

    h1 {
      font-size: 1.4rem;
      margin: 0 0 1.8rem;
      font-weight: var(--font-weight-thin);
    }
  }

  li {
    overflow: hidden;
    padding: 1px; // make space for focus outline
  }

  @media only screen and (max-width: 768px) {
    .two-cols {
      grid-template-columns: 1fr;
    }
  }
}
</style>
