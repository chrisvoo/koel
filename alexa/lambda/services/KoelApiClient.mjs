import config from '../config.mjs';

export default class KoelApiClient {
  constructor(accessToken) {
    this.baseUrl = config.koelBaseUrl;
    this.accessToken = accessToken;
    this.audioToken = null;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}/api/${path.replace(/^\//, '')}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
        'X-Api-Version': 'v7',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Koel API error: ${response.status} ${response.statusText} for ${path}`);
    }

    return response.json();
  }

  async fetchAudioToken() {
    if (this.audioToken) {
      return this.audioToken;
    }

    const data = await this.request('alexa/audio-token');
    this.audioToken = data.audio_token;
    return this.audioToken;
  }

  getStreamUrl(songId) {
    return `${this.baseUrl}/play/${songId}?t=${this.audioToken}`;
  }

  async searchSongs(query) {
    const data = await this.request(`search/songs?q=${encodeURIComponent(query)}`);
    return data.data || data;
  }

  async excerptSearch(query) {
    const data = await this.request(`search?q=${encodeURIComponent(query)}`);
    return data.data || data;
  }

  async getGenres() {
    const data = await this.request('genres');
    return data.data || data;
  }

  async getSongsByGenre(genrePublicId, { random = true, limit } = {}) {
    const params = new URLSearchParams();
    if (random) {
      params.set('random', 'true');
    }
    if (limit) {
      params.set('limit', String(limit));
    }

    const path = genrePublicId
      ? `genres/${encodeURIComponent(genrePublicId)}/songs/queue`
      : 'genres/songs/queue';

    const data = await this.request(`${path}?${params}`);
    return data.data || data;
  }

  async getSongsByArtist(artistId) {
    const data = await this.request(`artists/${artistId}/songs`);
    return data.data || data;
  }

  async getSongsByAlbum(albumId) {
    const data = await this.request(`albums/${albumId}/songs`);
    return data.data || data;
  }

  async getPlaylists() {
    const data = await this.request('playlists');
    return data.data || data;
  }

  async getPlaylistSongs(playlistId) {
    const data = await this.request(`playlists/${playlistId}/songs`);
    return data.data || data;
  }

  async getFavorites() {
    const data = await this.request('songs/favorites');
    return data.data || data;
  }

  async getRandomSongs(limit) {
    const data = await this.request(`queue/fetch?order=rand&limit=${limit}`);
    return data.data || data;
  }
}
