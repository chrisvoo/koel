import { describe, it, expect } from '@jest/globals';
import LaunchHandler from '../handlers/LaunchHandler.mjs';

function createHandlerInput({ accessToken = 'token', locale = 'en-US' } = {}) {
  const outputs = {};

  return {
    requestEnvelope: {
      request: { type: 'LaunchRequest', locale },
      session: {
        user: accessToken ? { accessToken } : {},
      },
    },
    t: (key) => key,
    responseBuilder: {
      speak(text) { outputs.speak = text; return this; },
      reprompt(text) { outputs.reprompt = text; return this; },
      withLinkAccountCard() { outputs.linkAccount = true; return this; },
      getResponse() { return outputs; },
    },
  };
}

describe('LaunchHandler', () => {
  it('can handle LaunchRequest', () => {
    const input = createHandlerInput();
    expect(LaunchHandler.canHandle(input)).toBe(true);
  });

  it('cannot handle IntentRequest', () => {
    const input = createHandlerInput();
    input.requestEnvelope.request.type = 'IntentRequest';
    expect(LaunchHandler.canHandle(input)).toBe(false);
  });

  it('returns welcome message when access token is present', () => {
    const input = createHandlerInput({ accessToken: 'my-token' });
    const response = LaunchHandler.handle(input);

    expect(response.speak).toBe('WELCOME');
    expect(response.reprompt).toBe('WELCOME_REPROMPT');
    expect(response.linkAccount).toBeUndefined();
  });

  it('prompts for account linking when no access token', () => {
    const input = createHandlerInput({ accessToken: null });
    const response = LaunchHandler.handle(input);

    expect(response.speak).toBe('ACCOUNT_LINK_REQUIRED');
    expect(response.linkAccount).toBe(true);
  });
});
