import PlaybackStateManager from '../services/PlaybackStateManager.mjs';
import config from '../config.mjs';

export { fuzzyMatch, findBestMatch } from '../services/matching.mjs';

export function requireAccountLink(handlerInput) {
  const { t } = handlerInput;
  return handlerInput.responseBuilder
    .speak(t('ACCOUNT_LINK_REQUIRED'))
    .withLinkAccountCard()
    .getResponse();
}

export async function startPlayback(handlerInput, api, songs, speechText, shuffle = false) {
  const audioToken = await api.fetchAudioToken();
  let queue = PlaybackStateManager.buildQueue(songs, config.koelBaseUrl, audioToken);

  if (shuffle) {
    queue = PlaybackStateManager.shuffleArray(queue);
  }

  const userId = handlerInput.requestEnvelope.session?.user?.userId
    || handlerInput.requestEnvelope.context?.System?.user?.userId;
  const stateManager = new PlaybackStateManager(userId);

  await stateManager.saveState({
    queue,
    currentIndex: 0,
    offsetInMilliseconds: 0,
    shuffle,
    loop: false,
  });

  const current = queue[0];
  const response = handlerInput.responseBuilder;

  if (speechText) {
    response.speak(speechText);
  }

  response.addAudioPlayerPlayDirective('REPLACE_ALL', current.url, current.token, 0, null, {
    title: current.title,
    subtitle: current.artist,
    art: current.albumCover ? {
      sources: [{ url: current.albumCover }],
    } : undefined,
  });

  return response.withShouldEndSession(true).getResponse();
}
