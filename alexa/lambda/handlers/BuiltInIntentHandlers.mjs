import PlaybackStateManager from '../services/PlaybackStateManager.mjs';

function getUserId(handlerInput) {
  return handlerInput.requestEnvelope.session?.user?.userId
    || handlerInput.requestEnvelope.context?.System?.user?.userId;
}

const PauseHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addAudioPlayerStopDirective()
      .getResponse();
  },
};

const ResumeHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent';
  },
  async handle(handlerInput) {
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    const { queue, currentIndex, offsetInMilliseconds } = state;

    if (!queue.length || currentIndex >= queue.length) {
      const { t } = handlerInput;
      return handlerInput.responseBuilder
        .speak(t('QUEUE_EMPTY'))
        .getResponse();
    }

    const track = queue[currentIndex];

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', track.url, track.token, offsetInMilliseconds, null, {
        title: track.title,
        subtitle: track.artist,
        art: track.albumCover ? {
          sources: [{ url: track.albumCover }],
        } : undefined,
      })
      .withShouldEndSession(true)
      .getResponse();
  },
};

const NextHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent';
  },
  async handle(handlerInput) {
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    const { queue, loop } = state;
    let nextIndex = state.currentIndex + 1;

    if (nextIndex >= queue.length) {
      if (loop) {
        nextIndex = 0;
      } else {
        const { t } = handlerInput;
        return handlerInput.responseBuilder
          .speak(t('QUEUE_EMPTY'))
          .getResponse();
      }
    }

    state.currentIndex = nextIndex;
    state.offsetInMilliseconds = 0;
    await stateManager.saveState(state);

    const track = queue[nextIndex];

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', track.url, track.token, 0, null, {
        title: track.title,
        subtitle: track.artist,
        art: track.albumCover ? {
          sources: [{ url: track.albumCover }],
        } : undefined,
      })
      .withShouldEndSession(true)
      .getResponse();
  },
};

const PreviousHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent';
  },
  async handle(handlerInput) {
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    const { queue, loop } = state;
    let prevIndex = state.currentIndex - 1;

    if (prevIndex < 0) {
      prevIndex = loop ? queue.length - 1 : 0;
    }

    state.currentIndex = prevIndex;
    state.offsetInMilliseconds = 0;
    await stateManager.saveState(state);

    const track = queue[prevIndex];

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', track.url, track.token, 0, null, {
        title: track.title,
        subtitle: track.artist,
        art: track.albumCover ? {
          sources: [{ url: track.albumCover }],
        } : undefined,
      })
      .withShouldEndSession(true)
      .getResponse();
  },
};

const ShuffleOnHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ShuffleOnIntent';
  },
  async handle(handlerInput) {
    const { t } = handlerInput;
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    const currentTrack = state.queue[state.currentIndex];
    const remaining = state.queue.filter((_, i) => i !== state.currentIndex);
    state.queue = [currentTrack, ...PlaybackStateManager.shuffleArray(remaining)];
    state.currentIndex = 0;
    state.shuffle = true;

    await stateManager.saveState(state);

    return handlerInput.responseBuilder
      .speak(t('SHUFFLE_ON'))
      .getResponse();
  },
};

const ShuffleOffHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ShuffleOffIntent';
  },
  async handle(handlerInput) {
    const { t } = handlerInput;
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    state.shuffle = false;
    await stateManager.saveState(state);

    return handlerInput.responseBuilder
      .speak(t('SHUFFLE_OFF'))
      .getResponse();
  },
};

const LoopOnHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.LoopOnIntent';
  },
  async handle(handlerInput) {
    const { t } = handlerInput;
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    state.loop = true;
    await stateManager.saveState(state);

    return handlerInput.responseBuilder
      .speak(t('LOOP_ON'))
      .getResponse();
  },
};

const LoopOffHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.LoopOffIntent';
  },
  async handle(handlerInput) {
    const { t } = handlerInput;
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    state.loop = false;
    await stateManager.saveState(state);

    return handlerInput.responseBuilder
      .speak(t('LOOP_OFF'))
      .getResponse();
  },
};

const StartOverHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent';
  },
  async handle(handlerInput) {
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    if (!state.queue.length) {
      const { t } = handlerInput;
      return handlerInput.responseBuilder
        .speak(t('QUEUE_EMPTY'))
        .getResponse();
    }

    state.currentIndex = 0;
    state.offsetInMilliseconds = 0;
    await stateManager.saveState(state);

    const track = state.queue[0];

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', track.url, track.token, 0, null, {
        title: track.title,
        subtitle: track.artist,
        art: track.albumCover ? {
          sources: [{ url: track.albumCover }],
        } : undefined,
      })
      .withShouldEndSession(true)
      .getResponse();
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  async handle(handlerInput) {
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    if (!state.queue.length) {
      const { t } = handlerInput;
      return handlerInput.responseBuilder
        .speak(t('QUEUE_EMPTY'))
        .getResponse();
    }

    const track = state.queue[state.currentIndex];
    state.offsetInMilliseconds = 0;
    await stateManager.saveState(state);

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', track.url, track.token, 0, null, {
        title: track.title,
        subtitle: track.artist,
        art: track.albumCover ? {
          sources: [{ url: track.albumCover }],
        } : undefined,
      })
      .withShouldEndSession(true)
      .getResponse();
  },
};

export {
  PauseHandler,
  ResumeHandler,
  NextHandler,
  PreviousHandler,
  ShuffleOnHandler,
  ShuffleOffHandler,
  LoopOnHandler,
  LoopOffHandler,
  StartOverHandler,
  RepeatHandler,
};
