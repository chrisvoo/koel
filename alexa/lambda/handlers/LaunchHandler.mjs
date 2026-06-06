const LaunchHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },

  handle(handlerInput) {
    const { t } = handlerInput;
    const accessToken = handlerInput.requestEnvelope.session?.user?.accessToken;

    if (!accessToken) {
      return handlerInput.responseBuilder
        .speak(t('ACCOUNT_LINK_REQUIRED'))
        .withLinkAccountCard()
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(t('WELCOME'))
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export default LaunchHandler;
