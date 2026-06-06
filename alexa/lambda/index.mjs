import Alexa from 'ask-sdk-core';
import i18next from 'i18next';
import config from './config.mjs';

import LaunchHandler from './handlers/LaunchHandler.mjs';
import PlaySongHandler from './handlers/PlaySongHandler.mjs';
import PlayArtistHandler from './handlers/PlayArtistHandler.mjs';
import PlayAlbumHandler from './handlers/PlayAlbumHandler.mjs';
import PlayGenreHandler from './handlers/PlayGenreHandler.mjs';
import PlayPlaylistHandler from './handlers/PlayPlaylistHandler.mjs';
import { PlayFavoritesHandler, PlayRandomHandler } from './handlers/FavoritesHandler.mjs';
import {
  PauseHandler, ResumeHandler, NextHandler, PreviousHandler,
  ShuffleOnHandler, ShuffleOffHandler, LoopOnHandler, LoopOffHandler,
  StartOverHandler, RepeatHandler,
} from './handlers/BuiltInIntentHandlers.mjs';
import {
  PlaybackStartedHandler, PlaybackFinishedHandler, PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler, PlaybackFailedHandler,
} from './handlers/PlaybackHandlers.mjs';
import { HelpHandler, NowPlayingHandler, SessionEndedHandler, FallbackHandler } from './handlers/HelpHandler.mjs';
import ErrorHandler from './handlers/ErrorHandler.mjs';

import enUS from './i18n/en-US.json' with { type: 'json' };
import itIT from './i18n/it-IT.json' with { type: 'json' };

const resources = {
  'en-US': enUS,
  'en': enUS,
  'it-IT': itIT,
  'it': itIT,
};

const LocalizationInterceptor = {
  async process(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale || config.fallbackLocale;

    await i18next.init({
      lng: locale,
      fallbackLng: config.fallbackLocale,
      resources,
      returnObjects: true,
    });

    handlerInput.t = (key, ...args) => {
      let translation = i18next.t(key);
      for (const arg of args) {
        translation = translation.replace('%s', arg);
      }
      return translation;
    };
  },
};

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchHandler,
    PlaySongHandler,
    PlayArtistHandler,
    PlayAlbumHandler,
    PlayGenreHandler,
    PlayPlaylistHandler,
    PlayFavoritesHandler,
    PlayRandomHandler,
    NowPlayingHandler,
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
    HelpHandler,
    FallbackHandler,
    SessionEndedHandler,
    PlaybackStartedHandler,
    PlaybackFinishedHandler,
    PlaybackStoppedHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackFailedHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LocalizationInterceptor)
  .lambda();
