# Visual Neurons - AI Media Creation Platform

A comprehensive web platform for AI-powered image and video creation, editing, and management. Built with Next.js, TypeScript, and AWS Amplify Gen 2.

## 🚀 Vision

Empowering users with zero technical knowledge to create and edit professional media content using cutting-edge AI technology.

## 🎯 Current Features

- **User Authentication**: Secure sign-up and login via AWS Cognito
- **Image Operations**:
  - AI-powered generation from text prompts
  - Smart upscaling and enhancement
  - Outpainting to expand boundaries
  - Style transfer between images
  - Object removal and background editing
- **Multiple AI Providers**: Replicate, Stability AI, Google Gemini
- **Visual Comparisons**: Interactive before/after views
- **Responsive Design**: Seamless desktop and mobile experience

## 🔮 Coming Soon

- **Video Support**: Upload, generate, and edit videos with AI
- **Natural Language Editing**: "Make the sunset more dramatic"
- **Advanced Workflows**: Multi-step editing pipelines
- **Collaboration**: Team workspaces and sharing
- **API Access**: Build on top of our platform

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3, React 18, TypeScript
- **Styling**: CSS Modules with responsive design
- **Backend**: AWS Amplify Gen 2
  - Authentication: AWS Cognito
  - API: GraphQL with AWS AppSync
  - Storage: AWS S3
  - Functions: AWS Lambda
  - Database: DynamoDB
- **AI Integration**: Multiple providers via unified interface

## 📁 Project Structure

```
visualneurons-web-gen2/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   ├── form/        # Form-specific components
│   │   └── layout/      # Layout components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and external services
│   ├── lib/             # Utility functions and helpers
│   ├── types/           # TypeScript type definitions
│   └── constants/       # App-wide constants
├── pages/               # Next.js pages
├── amplify/             # AWS Amplify configuration
├── public/              # Static assets
└── styles/              # Global styles
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18.17 or higher
- npm or yarn
- AWS Account
- API keys for AI providers (Replicate, Stability AI, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/FraPochetti/visualneurons-web-gen2.git
   cd visualneurons-web-gen2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up AWS Amplify**
   ```bash
   npx ampx sandbox
   ```

4. **Configure secrets in Amplify Console**
   All API keys must be configured as secrets in the Amplify Console:
   
   a. Deploy your app first: `npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID`
   b. Go to AWS Amplify Console for your app
   c. Navigate to Hosting > Environment variables
   d. Add the following secrets with EXACT names:
      - `REPLICATE_API_TOKEN` - Your Replicate API token
      - `STABILITY_API_TOKEN` - Your Stability AI API token
      - `GCP_SERVICE_ACCOUNT_JSON` - Google Cloud service account JSON (Vertex AI recommended)
      - `GCP_API_TOKEN` - Legacy Gemini API key (temporary fallback during migration)
      - `GCP_VERTEX_LOCATION` - Optional Vertex AI region (e.g., `us-central1`)
   
   **Important**: 
   - Never store API keys locally. Amplify Gen2 uses AWS Systems Manager for secure secret storage
   - Use the EXACT environment variable names shown above - the code expects these specific names

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Amplify Gen2 Sandbox Development Workflow

### What the Sandbox is
- The Amplify Sandbox is an ephemeral AWS environment that provisions real backend resources (Cognito, AppSync, S3, Lambda, DynamoDB) for local development. It lets you validate backend changes without pushing or touching production.

### Day-to-day workflow
1. Optional reset to a clean sandbox:
   - Stop current sandbox (Ctrl+C in its terminal)
   - Delete resources:
     ```bash
     npx ampx sandbox delete
     ```
2. Start sandbox + local app:
   ```bash
   npm run dev:sandbox
   ```
   This provisions the sandbox and writes `amplify_outputs.json` pointing your app to the sandbox backend, then starts Next.js.
3. Save the sandbox outputs once (so you can switch back later without restarting the sandbox):
   ```bash
   npm run save:sandbox
   ```
4. Implement and test changes locally against real AWS resources.
5. Tear down when done to avoid costs:
   ```bash
   npx ampx sandbox delete
   ```

### Switching backends locally
- Active config file: `amplify_outputs.json` (what the app reads)
- Keep snapshots in repo root (gitignored):
  - `amplify_outputs.sandbox.json` – saved sandbox outputs
  - `amplify_outputs.prod.json` – production outputs

Commands:
```bash
# Point app at sandbox
npm run use:sandbox

# Point app at production
npm run use:prod

# Start app after switching (either env)
npm run dev
```

Note: When `npx ampx sandbox` runs, it may re-write `amplify_outputs.json` to sandbox values. If a sandbox is already running, prefer `npm run dev` over `dev:sandbox`.

### Scripts reference (package.json)
```json
{
  "typecheck": "tsc --noEmit",
  "test": "npm run lint",
  "dev:sandbox": "npx ampx sandbox & npm run dev",
  "use:prod": "cp -f amplify_outputs.prod.json amplify_outputs.json",
  "use:sandbox": "cp -f amplify_outputs.sandbox.json amplify_outputs.json",
  "save:sandbox": "cp -f amplify_outputs.json amplify_outputs.sandbox.json"
}
```

### Pre-push quality gate
Local Git hook runs before push:
```bash
npm run typecheck && npm test
```
`npm test` currently runs linting. Add a real test runner when ready.

### CI/CD notes
- Repo contains `amplify.yml`; Amplify Hosting uses that file at build time (it takes precedence over the console UI).
- Backend deploys optimized with differential builds (`AMPLIFY_DIFF_BACKEND=true`) to skip backend updates when unchanged.

### Secrets
Manage secrets in Amplify Console (Hosting → Environment variables). Required: `REPLICATE_API_TOKEN`, `STABILITY_API_TOKEN`, `GCP_API_TOKEN`, `LAMBDA_RESIZE_URL`.

### Troubleshooting
- Wrong backend? Overwrite `amplify_outputs.json` with `npm run use:sandbox` or `npm run use:prod`.
- Sandbox drift? Restart it:
  ```bash
  Ctrl+C   # stop
  npx ampx sandbox delete
  npm run dev:sandbox
  ```

## 📖 Usage

### Uploading Images
1. Navigate to the Upload page
2. Drag and drop or select images to upload
3. Images are automatically stored in your personal gallery

### Generating Images
1. Go to Generate Image page
2. Select an AI provider
3. Enter a descriptive prompt
4. Click "Generate Image" and wait for the result
5. Save the generated image to your gallery

### Editing Images
1. Select an image from your gallery
2. Choose an operation (upscale, outpaint, etc.)
3. Select the AI provider
4. Process the image and compare results
5. Save the edited version

### Style Transfer
1. Navigate to Style Transfer
2. Enter a prompt describing the desired style
3. Select a style reference image from your gallery
4. Generate the stylized result

## 🏗️ Architecture

### Component Architecture
- **Memoized Components**: All components use React.memo for performance
- **Accessibility First**: ARIA attributes, keyboard navigation, screen reader support
- **Responsive Design**: Mobile-first approach with CSS modules
- **Error Boundaries**: Graceful error handling throughout the app

### State Management
- Local component state with React hooks
- Custom hooks for complex operations
- AWS Amplify for backend state synchronization

### Code Quality
- TypeScript for type safety
- ESLint for code consistency
- Comprehensive error handling with logging
- Clean import paths with path aliases

## 🧪 Development

### Code Style
- Use named exports for all components
- Follow TypeScript best practices
- Implement proper error handling
- Add accessibility features to all interactive elements

### Adding New Components
1. Create component in appropriate directory (`ui/`, `form/`, `layout/`)
2. Include TypeScript interfaces
3. Add memoization with React.memo
4. Export from index.ts barrel file
5. Write accompanying CSS module

### Adding New AI Providers
1. Implement the IAIProvider interface
2. Add provider to the factory
3. Configure API endpoints and keys
4. Test all supported operations

## 🚀 Deployment

The app is configured for deployment on AWS Amplify:

1. Push your code to GitHub
2. Connect your repository to AWS Amplify Console
3. Configure build settings (already set in `amplify.yml`)
4. Deploy and monitor via Amplify Console

## 📝 Recent Updates

### Component Migration (Latest)
- Migrated all components from `/components/` to organized `/src/components/` structure
- Enhanced all components with:
  - Performance optimizations (memoization, lazy loading)
  - Accessibility features (ARIA, keyboard navigation)
  - Better TypeScript interfaces
  - Comprehensive error handling
  - Responsive design with dark mode support

### Architecture Improvements
- Implemented proper separation of concerns
- Created reusable hooks for image operations
- Added comprehensive logging system
- Improved error handling patterns

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AWS Amplify team for the excellent Gen 2 platform
- All the AI model providers for their amazing APIs
- The Next.js team for the fantastic framework
- The open-source community for inspiration and support

## 📞 Contact

Francesco Pochetti - [@FraPochetti](https://twitter.com/FraPochetti)

Project Link: [https://github.com/FraPochetti/visualneurons-web-gen2](https://github.com/FraPochetti/visualneurons-web-gen2)

---

Built with ❤️ by Francesco Pochetti
