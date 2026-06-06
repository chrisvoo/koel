import PlaybackStateManager from '../services/PlaybackStateManager.mjs';

function getUserId(handlerInput) {
  return handlerInput.requestEnvelope.session?.user?.userId
    || handlerInput.requestEnvelope.context?.System?.user?.userId;
}

const PlaybackStartedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStarted';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const PlaybackFinishedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackFinished';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const PlaybackStoppedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStopped';
  },
  async handle(handlerInput) {
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    state.offsetInMilliseconds = handlerInput.requestEnvelope.request.offsetInMilliseconds || 0;
    await stateManager.saveState(state);

    return handlerInput.responseBuilder.getResponse();
  },
};

const PlaybackNearlyFinishedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackNearlyFinished';
  },
  async handle(handlerInput) {
    const userId = getUserId(handlerInput);
    const stateManager = new PlaybackStateManager(userId);
    const state = await stateManager.getState();

    const { queue, currentIndex, loop } = state;
    let nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      if (loop) {
        nextIndex = 0;
      } else {
        return handlerInput.responseBuilder.getResponse();
      }
    }

    const nextTrack = queue[nextIndex];
    const currentToken = handlerInput.requestEnvelope.request.token;

    state.currentIndex = nextIndex;
    state.offsetInMilliseconds = 0;
    await stateManager.saveState(state);

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('ENQUEUE', nextTrack.url, nextTrack.token, 0, currentToken, {
        title: nextTrack.title,
        subtitle: nextTrack.artist,
        art: nextTrack.albumCover ? {
          sources: [{ url: nextTrack.albumCover }],
        } : undefined,
      })
      .getResponse();
  },
};

const PlaybackFailedHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackFailed';
  },
  handle(handlerInput) {
    console.error('Playback failed:', JSON.stringify(handlerInput.requestEnvelope.request.error));
    return handlerInput.responseBuilder.getResponse();
  },
};

export {
  PlaybackStartedHandler,
  PlaybackFinishedHandler,
  PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler,
  PlaybackFailedHandler,
};
