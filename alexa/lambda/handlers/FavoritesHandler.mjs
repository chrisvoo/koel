import KoelApiClient from '../services/KoelApiClient.mjs';
import { startPlayback, requireAccountLink } from './helpers.mjs';

const PlayFavoritesHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayFavoritesIntent';
  },

  async handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;
    if (!accessToken) {
      return requireAccountLink(handlerInput);
    }

    const api = new KoelApiClient(accessToken);
    await api.fetchAudioToken();

    const songs = await api.getFavorites();
    if (!songs.length) {
      return handlerInput.responseBuilder
        .speak(t('NO_FAVORITES'))
        .reprompt(t('WELCOME_REPROMPT'))
        .getResponse();
    }

    return startPlayback(handlerInput, api, songs, t('NOW_PLAYING_FAVORITES'), true);
  },
};

const PlayRandomHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayRandomIntent';
  },

  async handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;
    if (!accessToken) {
      return requireAccountLink(handlerInput);
    }

    const api = new KoelApiClient(accessToken);
    await api.fetchAudioToken();

    const { default: config } = await import('../config.mjs');
    const songs = await api.getRandomSongs(config.queueSize);

    if (!songs.length) {
      return handlerInput.responseBuilder
        .speak(t('QUEUE_EMPTY'))
        .reprompt(t('WELCOME_REPROMPT'))
        .getResponse();
    }

    return startPlayback(handlerInput, api, songs, t('NOW_PLAYING_RANDOM'));
  },
};

export { PlayFavoritesHandler, PlayRandomHandler };
