import { reactive } from 'vue'
import { differenceBy, merge, unionBy } from 'lodash'
import { cache } from '@/services/cache'
import { http } from '@/services/http'
import { arrayify } from '@/utils/helpers'
import { logger } from '@/utils/logger'
import { songStore } from '@/stores/songStore'

const UNKNOWN_ALBUM_NAME = 'Unknown Album'

interface AlbumUpdateData {
  name: string
  year: number | null
}

interface AlbumListPaginateParams extends Record<string, any> {
  sort: AlbumListSortField
  order: SortOrder
  page: number
}

export const albumStore = {
  vault: new Map<Album['id'], Album>(),

  state: reactive({
    albums: [] as Album[],
  }),

  byId (id: Album['id']) {
    return this.vault.get(id)
  },

  removeByIds (ids: Album['id'][]) {
    this.state.albums = differenceBy(this.state.albums, ids.map(id => this.byId(id)), 'id')
    ids.forEach(id => {
      this.vault.delete(id)
      cache.remove(['album', id])
    })
  },

  isUnknown: (album: Album | Album['name']) => {
    if (typeof album === 'string') {
      return album === UNKNOWN_ALBUM_NAME
    }

    return album.name === UNKNOWN_ALBUM_NAME
  },

  syncWithVault (albums: MaybeArray<Album>) {
    return arrayify(albums).map(album => {
      let local = this.vault.get(album.id)
      local = reactive(local ? merge(local, album) : album)
      this.vault.set(album.id, local)

      return local
    })
  },

  /**
   * Upload a cover for an album.
   *
   * @param {Album} album The album object
   * @param {string} cover The content data string of the cover
   */
  async uploadCover (album: Album, cover: string) {
    album.cover = (await http.put<{ cover_url: string }>(`albums/${album.id}/cover`, { cover })).cover_url
    songStore.byAlbum(album).forEach(song => song.album_cover = album.cover)

    // sync to vault
    this.byId(album.id)!.cover = album.cover

    return album.cover
  },

  async update (album: Album, data: AlbumUpdateData) {
    const updated = await http.put<Album>(`albums/${album.id}`, data)
    this.state.albums = unionBy(this.state.albums, this.syncWithVault(updated), 'id')

    songStore.updateAlbumName(album, updated.name)
  },

  /**
   * Fetch the (blurry) thumbnail-sized version of an album's cover.
   */
  fetchThumbnail: async (id: Album['id']) => {
    return (await http.get<{ thumbnailUrl: string }>(`albums/${id}/thumbnail`)).thumbnailUrl
  },

  async resolve (id: Album['id']) {
    let album = this.byId(id)

    if (!album) {
      try {
        album = this.syncWithVault(
          await cache.remember<Album>(['album', id], async () => await http.get<Album>(`albums/${id}`)),
        )[0]
      } catch (error: unknown) {
        logger.error(error)
      }
    }

    return album
  },

  async paginate (params: AlbumListPaginateParams) {
    const resource = await http.get<PaginatorResource<Album>>(`albums?${new URLSearchParams(params).toString()}`)
    this.state.albums = unionBy(this.state.albums, this.syncWithVault(resource.data), 'id')

    return resource.links.next ? ++resource.meta.current_page : null
  },

  async fetchForArtist (artist: Artist | Artist['id']) {
    const id = typeof artist === 'string' ? artist : artist.id

    return this.syncWithVault(
      await cache.remember<Album[]>(['artist-albums', id], async () => await http.get<Album[]>(`artists/${id}/albums`)),
    )
  },

  reset () {
    this.vault.clear()
    this.state.albums = []
  },
}
