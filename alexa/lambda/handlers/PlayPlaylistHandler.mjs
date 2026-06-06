import KoelApiClient from '../services/KoelApiClient.mjs';
import { startPlayback, requireAccountLink, findBestMatch } from './helpers.mjs';

const PlayPlaylistHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayPlaylistIntent';
  },

  async handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;
    if (!accessToken) {
      return requireAccountLink(handlerInput);
    }

    const playlistName = handlerInput.requestEnvelope.request.intent.slots?.playlistName?.value;
    if (!playlistName) {
      return handlerInput.responseBuilder
        .speak(t('UNHANDLED'))
        .reprompt(t('WELCOME_REPROMPT'))
        .getResponse();
    }

    const api = new KoelApiClient(accessToken);
    await api.fetchAudioToken();

    const playlists = await api.getPlaylists();
    const playlist = findBestMatch(playlists, playlistName);

    if (playlist) {
      const songs = await api.getPlaylistSongs(playlist.id);
      if (songs.length) {
        const speechText = t('NOW_PLAYING_PLAYLIST').replace('%s', playlist.name);
        return startPlayback(handlerInput, api, songs, speechText);
      }
    }

    return handlerInput.responseBuilder
      .speak(t('PLAYLIST_NOT_FOUND').replace('%s', playlistName))
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export default PlayPlaylistHandler;
