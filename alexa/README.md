# Koel Alexa Skill

AWS Lambda-based Alexa Custom Skill for voice-controlled playback from a Koel instance.

## Structure

```
alexa/
├── lambda/                 # Lambda function source
│   ├── index.mjs           # Entry point
│   ├── config.mjs          # Environment-based configuration
│   ├── handlers/           # Intent and playback handlers
│   ├── services/           # Koel API client, DynamoDB state manager
│   ├── i18n/               # Locale files (en-US, it-IT)
│   └── __tests__/          # Unit tests
├── skill-package/          # Alexa skill definition
│   ├── skill.json          # Skill manifest
│   └── interactionModels/  # Locale-specific interaction models
├── deploy.sh               # Deployment helper script
└── README.md
```

## Quick Start

```bash
# Install dependencies
cd lambda && npm install

# Run tests
npm test

# Package for deployment
cd .. && ./deploy.sh package

# Deploy (requires AWS CLI configured)
export KOEL_BASE_URL=https://your-koel-instance.com
export LAMBDA_ROLE_ARN=arn:aws:iam::123456789012:role/koel-alexa-role
./deploy.sh --profile personal create
```

See the full setup guide at [docs/alexa-integration.md](../docs/alexa-integration.md).
