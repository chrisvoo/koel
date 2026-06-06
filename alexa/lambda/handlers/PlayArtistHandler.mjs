import KoelApiClient from '../services/KoelApiClient.mjs';
import { startPlayback, requireAccountLink, findBestMatch } from './helpers.mjs';

const PlayArtistHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayArtistIntent';
  },

  async handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;
    if (!accessToken) {
      return requireAccountLink(handlerInput);
    }

    const artistName = handlerInput.requestEnvelope.request.intent.slots?.artistName?.value;
    if (!artistName) {
      return handlerInput.responseBuilder
        .speak(t('UNHANDLED'))
        .reprompt(t('WELCOME_REPROMPT'))
        .getResponse();
    }

    const api = new KoelApiClient(accessToken);
    await api.fetchAudioToken();

    const excerpt = await api.excerptSearch(artistName);
    const artists = excerpt.artists || [];
    const artist = findBestMatch(artists, artistName);

    if (artist) {
      const songs = await api.getSongsByArtist(artist.id);
      if (songs.length) {
        const speechText = t('NOW_PLAYING_ARTIST').replace('%s', artist.name);
        return startPlayback(handlerInput, api, songs, speechText, true);
      }
    }

    const songs = excerpt.songs || [];
    if (songs.length) {
      const speechText = t('ARTIST_NOT_FOUND_SONG_FALLBACK').replace('%s', artistName);
      return startPlayback(handlerInput, api, songs, speechText);
    }

    return handlerInput.responseBuilder
      .speak(t('ARTIST_NOT_FOUND').replace('%s', artistName))
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export default PlayArtistHandler;
