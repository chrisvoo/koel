---
description: Step-by-step guide to integrate Koel with Amazon Alexa for voice-controlled music playback.
---

# Alexa Integration

Koel can be controlled via Amazon Alexa, allowing you to play music from your personal library using voice commands
on any Alexa-enabled device (Echo, Echo Dot, etc.).

:::info Prerequisites
- A running Koel instance accessible over **HTTPS** (port 443, valid SSL certificate)
- An [Amazon Developer account](https://developer.amazon.com/)
- An [AWS account](https://aws.amazon.com/) (for Lambda and DynamoDB)
- Node.js 20+ and npm (for building the Lambda)
- AWS CLI v2 installed and configured
:::

## Architecture Overview

The integration uses an Alexa Custom Skill backed by an AWS Lambda function:

1. **You** speak a command to your Alexa device
2. **Alexa** resolves your intent and sends it to the **Lambda function**
3. The **Lambda** authenticates with your **Koel instance** via Sanctum tokens (obtained through Account Linking)
4. The Lambda searches your library, builds a playback queue, and returns AudioPlayer directives
5. **Alexa** streams audio directly from your Koel instance

## Step 1: Enable Alexa Support in Koel

Add these variables to your `.env` file:

```
ALEXA_ENABLED=true
ALEXA_SKILL_ID=        # Fill in after creating the skill (Step 2)
```

## Step 2: Create the Alexa Skill

1. Go to the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Click **Create Skill**
3. Choose:
   - **Skill name**: Koel Music Player
   - **Primary locale**: English (US) — or your preferred locale
   - **Skill type**: Custom
   - **Hosting**: Provision your own (we'll use AWS Lambda)
4. After creation, note the **Skill ID** (starts with `amzn1.ask.skill.`) and set it in your `.env`:
   ```
   ALEXA_SKILL_ID=amzn1.ask.skill.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### Import the Interaction Model

1. In the Alexa console, go to **Build** > **JSON Editor**
2. Upload or paste the contents of `alexa/skill-package/interactionModels/custom/en-US.json`
3. Click **Save** and **Build Model**

To add Italian (or another locale):
1. Go to **Language Settings** and add `Italian (IT)`
2. Switch to the Italian locale and upload `alexa/skill-package/interactionModels/custom/it-IT.json`
3. Build the model for each locale

### Configure the AudioPlayer Interface

1. Go to **Build** > **Interfaces**
2. Enable **Audio Player**
3. Save

## Step 3: Set Up AWS Resources

### Create an IAM Role

Create a role for the Lambda with these policies:
- `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
- DynamoDB access to the `KoelAlexaPlaybackState` table

```bash
# If you have multiple AWS profiles, specify yours
export AWS_PROFILE=personal

# Create the role (save the ARN from the output)
aws iam create-role \
  --role-name koel-alexa-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name koel-alexa-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create and attach DynamoDB policy
aws iam put-role-policy \
  --role-name koel-alexa-role \
  --policy-name KoelAlexaDynamoDB \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/KoelAlexaPlaybackState"
    }]
  }'
```

### Create the DynamoDB Table

```bash
cd alexa
./deploy.sh --profile personal create-table
```

### Deploy the Lambda Function

```bash
# Set required environment variables
export KOEL_BASE_URL=https://your-koel-instance.com
export LAMBDA_ROLE_ARN=arn:aws:iam::123456789012:role/koel-alexa-role

# Package and create the Lambda
./deploy.sh --profile personal package
./deploy.sh --profile personal create
```

After creation, add an **Alexa Skills Kit** trigger to the Lambda in the AWS console:
1. Go to the Lambda function configuration in the AWS console
2. Click **Add trigger** > **Alexa Skills Kit**: this allow the Alexa Skills service to invoke this Lambda function when a user speaks to this specific skill.
3. Enter your Skill ID
4. Save

### Set the Lambda Endpoint in Alexa

1. In the Alexa Developer Console, go to **Build** > **Endpoint**
2. Select **AWS Lambda ARN**
3. Paste your Lambda's ARN into the **Default Region** field
4. Save and build

What happens at runtime when it's in place:
- You say "Alexa, ask koel to play Painkiller"
- Amazon's Alexa service processes the voice, resolves the intent, and sends a signed JSON request to your Lambda's endpoint
- The Alexa Skills Kit trigger is what grants Alexa the permission to call your Lambda
Lambda executes the handler and returns a response with AudioPlayer directives
- Alexa streams the audio

## Step 4: Configure Account Linking

Account Linking connects your Alexa account to your Koel user account.

1. In the Alexa Developer Console, go to **Build** > **Account Linking**
2. Enable **Do you allow users to create an account or link to an existing account?**
3. Configure:
   - **Authorization Grant Type**: Authorization Code Grant
   - **Authorization URI**: `https://your-koel-instance.com/alexa/authorize`
   - **Access Token URI**: `https://your-koel-instance.com/alexa/token`
   - **Client ID**: `koel-alexa` (any value; Koel doesn't validate it)
   - **Client Secret**: `koel-alexa-secret` (any value; Koel doesn't validate it)
4. Save

### Link Your Account

1. Open the **Alexa app** on your phone
2. Go to **More** > **Skills & Games** > **Your Skills** > **Dev**
3. Find **Koel Music Player** and tap **Enable**
4. You'll be redirected to your Koel instance's login page — sign in with your Koel credentials

## Step 5: Test

Say: **"Alexa, open koel"** — you should hear the welcome message.

Try these commands:
- "Alexa, ask koel to play Painkiller"
- "Alexa, ask koel to play songs by Judas Priest"
- "Alexa, ask koel to play the album Screaming for Vengeance"
- "Alexa, ask koel to play heavy metal"
- "Alexa, ask koel to play my rock playlist"
- "Alexa, ask koel to play my favorites"
- "Alexa, ask koel to surprise me"

During playback:
- "Alexa, pause" / "Alexa, resume"
- "Alexa, next" / "Alexa, previous"
- "Alexa, shuffle on" / "Alexa, shuffle off"
- "Alexa, what's playing?"

## Updating the Lambda

After making changes to the Lambda code:

```bash
cd alexa
./deploy.sh --profile personal package
./deploy.sh --profile personal update
```

## Voice Commands Reference

| Command | Example |
|---|---|
| Play a song | "play Painkiller", "play Painkiller by Judas Priest" |
| Play an artist | "play songs by Judas Priest" |
| Play an album | "play the album Screaming for Vengeance" |
| Play a genre | "play heavy metal", "play some jazz" |
| Play a playlist | "play my rock playlist" |
| Play favorites | "play my favorites" |
| Random mix | "surprise me", "play something random" |
| Now playing | "what's playing?", "what song is this?" |
| Pause / Resume | "pause", "resume" |
| Next / Previous | "next", "previous" |
| Shuffle | "shuffle on", "shuffle off" |
| Loop | "loop on", "loop off" |
| Restart | "start over" |
| Repeat | "repeat" |

## Localization

The skill supports multiple locales. Currently included: **English (US)** and **Italian (IT)**.

To add a new locale:

1. Create a new interaction model JSON file in `alexa/skill-package/interactionModels/custom/` (e.g., `fr-FR.json`)
2. Create a new translations file in `alexa/lambda/i18n/` (e.g., `fr-FR.json`)
3. Register the new locale in `alexa/lambda/index.mjs` in the `resources` object
4. Add the locale in the Alexa Developer Console and upload the interaction model
5. Rebuild and redeploy the Lambda

## AWS Cost Estimate

For typical personal use (a few dozen invocations per day):

| Service | Estimated Monthly Cost |
|---|---|
| Lambda | Free tier (1M requests/month free) |
| DynamoDB | Free tier (25 GB storage, 25 read/write units free) |
| CloudWatch Logs | Free tier (5 GB/month free) |
| **Total** | **$0.00** for typical use |

## Publishing vs. Development Mode

By default, your skill runs in **Development mode** — only you (and beta testers you invite) can use it.

For personal use, development mode is sufficient. You don't need to publish to the Alexa Skills Store.

If you want to publish:
1. Fill in the privacy policy and terms of use URLs in `skill.json`
2. Complete the **Distribution** and **Certification** sections in the Alexa Developer Console
3. Submit for certification review
