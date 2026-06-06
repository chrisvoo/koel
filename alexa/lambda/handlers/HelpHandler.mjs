import PlaybackStateManager from '../services/PlaybackStateManager.mjs';

function getUserId(handlerInput) {
  return handlerInput.requestEnvelope.session?.user?.userId
    || handlerInput.requestEnvelope.context?.System?.user?.userId;
}

const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const { t } = handlerInput;
    return handlerInput.responseBuilder
      .speak(t('HELP'))
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

const NowPlayingHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'NowPlayingIntent';
  },
  async handle(handlerInput) {
    const { t } = handlerInput;
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    if (!state.queue.length || state.currentIndex >= state.queue.length) {
      return handlerInput.responseBuilder
        .speak(t('NO_CURRENT_TRACK'))
        .getResponse();
    }

    const track = state.queue[state.currentIndex];
    return handlerInput.responseBuilder
      .speak(t('CURRENT_TRACK').replace('%s', track.title).replace('%s', track.artist))
      .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    const { reason } = handlerInput.requestEnvelope.request;
    if (reason === 'ERROR') {
      console.error('Session ended with error:', JSON.stringify(handlerInput.requestEnvelope.request.error));
    }
    return handlerInput.responseBuilder.getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const { t } = handlerInput;
    return handlerInput.responseBuilder
      .speak(t('UNHANDLED'))
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export { HelpHandler, NowPlayingHandler, SessionEndedHandler, FallbackHandler };
