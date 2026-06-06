import KoelApiClient from '../services/KoelApiClient.mjs';
import { startPlayback, requireAccountLink, findBestMatch } from './helpers.mjs';
import config from '../config.mjs';

const PlayGenreHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PlayGenreIntent';
  },

  async handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;
    if (!accessToken) {
      return requireAccountLink(handlerInput);
    }

    const genreName = handlerInput.requestEnvelope.request.intent.slots?.genreName?.value;
    if (!genreName) {
      return handlerInput.responseBuilder
        .speak(t('UNHANDLED'))
        .reprompt(t('WELCOME_REPROMPT'))
        .getResponse();
    }

    const api = new KoelApiClient(accessToken);
    await api.fetchAudioToken();

    const genres = await api.getGenres();
    const genre = findBestMatch(genres, genreName);

    if (genre) {
      const songs = await api.getSongsByGenre(genre.id, {
        random: true,
        limit: config.queueSize,
      });

      if (songs.length) {
        const speechText = t('NOW_PLAYING_GENRE').replace('%s', genre.name);
        return startPlayback(handlerInput, api, songs, speechText);
      }
    }

    const excerpt = await api.excerptSearch(genreName);
    const songs = excerpt.songs || [];
    if (songs.length) {
      const speechText = t('NOW_PLAYING_GENRE').replace('%s', genreName);
      return startPlayback(handlerInput, api, songs, speechText);
    }

    return handlerInput.responseBuilder
      .speak(t('GENRE_NOT_FOUND').replace('%s', genreName))
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export default PlayGenreHandler;
