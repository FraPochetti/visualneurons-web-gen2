# Visual Neurons AI Image Editor

This repo is a starting point for a web app where users can sign up, upload images, and edit them using AI.

## What's Inside

- **User Accounts:** Sign up and log in with email (via AWS Cognito).
- **Image Handling:** 
  - Upload your own images.
  - Generate images using AI models hosted on Replicate.
- **Editing:** Run AI-powered edits like object/background removal or upscaling. (Future plans include Amazon Bedrock integration.)
- **Billing:** The first few edits are free—after that, you’re billed per API call.
- **Tech Stack:** Built with Next.js and AWS Amplify Gen2 (auth, API, database, storage, and serverless functions).

## Getting Started

1. Clone the repo.
2. Set up AWS Amplify Gen2 and add your API keys.
3. Run the Next.js dev server and start exploring.

This repo is all about learning and experimenting, so feel free to modify and play around.
