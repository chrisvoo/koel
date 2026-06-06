const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Unhandled error:', error.message, error.stack);

    const { t } = handlerInput;
    return handlerInput.responseBuilder
      .speak(t('ERROR'))
      .reprompt(t('WELCOME_REPROMPT'))
      .getResponse();
  },
};

export default ErrorHandler;
