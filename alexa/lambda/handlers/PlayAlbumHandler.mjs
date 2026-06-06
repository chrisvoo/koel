import KoelApiClient from '../services/KoelApiClient.mjs';
import { startPlayback, requireAccountLink, findBestMatch, fuzzyMatch } from './helpers.mjs';

const PlayAlbumHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayAlbumIntent';
  },

  async handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;
    if (!accessToken) {
      return requireAccountLink(handlerInput);
    }

    const albumName = handlerInput.requestEnvelope.request.intent.slots?.albumName?.value;
    const artistName = handlerInput.requestEnvelope.request.intent.slots?.artistName?.value;

    if (!albumName) {
      return handlerInput.responseBuilder
        .speak(t('UNHANDLED'))
        .reprompt(t('WELCOME_REPROMPT'))
        .getResponse();
    }

    const api = new KoelApiClient(accessToken);
    await api.fetchAudioToken();

    const excerpt = await api.excerptSearch(albumName);
    let albums = excerpt.albums || [];

    if (artistName && albums.length) {
      const filtered = albums.filter((a) => fuzzyMatch(a.artist_name, artistName));
      if (filtered.length) {
        albums = filtered;
      }
    }

    const album = findBestMatch(albums, albumName);

    if (album) {
      const songs = await api.getSongsByAlbum(album.id);
      if (songs.length) {
        const speechText = t('NOW_PLAYING_ALBUM')
          .replace('%s', album.name)
          .replace('%s', album.artist_name);
        return startPlayback(handlerInput, api, songs, speechText);
      }
    }

    const notFoundText = artistName
      ? t('ALBUM_BY_ARTIST_NOT_FOUND').replace('%s', albumName).replace('%s', artistName)
      : t('ALBUM_NOT_FOUND').replace('%s', albumName);

    return handlerInput.responseBuilder
      .speak(notFoundText)
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export default PlayAlbumHandler;
