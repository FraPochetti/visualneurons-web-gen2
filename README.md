# Visual Neurons - AI Image Editor

A modern web application for AI-powered image editing and generation, built with Next.js, TypeScript, and AWS Amplify Gen 2.

## 🚀 Features

- **User Authentication**: Secure sign-up and login via AWS Cognito
- **Image Management**: Upload, store, and manage your images
- **AI-Powered Operations**:
  - Image generation from text prompts
  - Image upscaling for enhanced resolution
  - Outpainting to expand image boundaries
  - Style transfer between images
  - Interactive chat about images
- **Multiple AI Providers**: Support for Replicate, Stability AI, and more
- **Real-time Comparisons**: Before/after sliders for edited images
- **Responsive Design**: Works seamlessly on desktop and mobile devices

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

4. **Configure environment variables**
   Create a `.env.local` file with your API keys:
   ```env
   REPLICATE_API_KEY=your_replicate_key
   STABILITY_API_KEY=your_stability_key
   # Add other provider keys as needed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

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
