import KoelApiClient from '../services/KoelApiClient.mjs';
import PlaybackStateManager from '../services/PlaybackStateManager.mjs';
import config from '../config.mjs';
import { startPlayback, requireAccountLink, fuzzyMatch } from './helpers.mjs';

const PlaySongHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlaySongIntent';
  },

  async handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;
    if (!accessToken) {
      return requireAccountLink(handlerInput);
    }

    const songName = handlerInput.requestEnvelope.request.intent.slots?.songName?.value;
    const artistName = handlerInput.requestEnvelope.request.intent.slots?.artistName?.value;

    if (!songName) {
      return handlerInput.responseBuilder
        .speak(t('UNHANDLED'))
        .reprompt(t('WELCOME_REPROMPT'))
        .getResponse();
    }

    const api = new KoelApiClient(accessToken);
    await api.fetchAudioToken();

    let songs = await api.searchSongs(songName);

    if (artistName && songs.length) {
      const filtered = songs.filter(
        (s) => fuzzyMatch(s.artist_name, artistName),
      );
      if (filtered.length) {
        songs = filtered;
      }
    }

    if (songs.length) {
      const speechText = artistName
        ? t('NOW_PLAYING').replace('%s', songs[0].title).replace('%s', songs[0].artist_name)
        : t('NOW_PLAYING').replace('%s', songs[0].title).replace('%s', songs[0].artist_name);
      return startPlayback(handlerInput, api, songs, speechText);
    }

    const excerpt = await api.excerptSearch(songName);

    const albums = excerpt.albums || [];
    if (albums.length) {
      const targetAlbum = artistName
        ? albums.find((a) => fuzzyMatch(a.artist_name, artistName))
        : albums[0];

      if (targetAlbum) {
        const albumSongs = await api.getSongsByAlbum(targetAlbum.id);
        if (albumSongs.length) {
          const speechText = t('SONG_NOT_FOUND_ALBUM_FALLBACK')
            .replace('%s', songName)
            .replace('%s', targetAlbum.name)
            .replace('%s', targetAlbum.artist_name);
          return startPlayback(handlerInput, api, albumSongs, speechText);
        }
      }
    }

    const artists = excerpt.artists || [];
    if (artists.length) {
      const targetArtist = artists[0];
      const artistSongs = await api.getSongsByArtist(targetArtist.id);
      if (artistSongs.length) {
        const speechText = t('SONG_NOT_FOUND_ARTIST_FALLBACK')
          .replace('%s', songName)
          .replace('%s', targetArtist.name);
        return startPlayback(handlerInput, api, artistSongs, speechText);
      }
    }

    const notFoundText = artistName
      ? t('SONG_BY_ARTIST_NOT_FOUND').replace('%s', songName).replace('%s', artistName)
      : t('SONG_NOT_FOUND').replace('%s', songName);

    return handlerInput.responseBuilder
      .speak(notFoundText)
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export default PlaySongHandler;
