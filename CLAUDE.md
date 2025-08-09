# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Key Mindset

**This is a living, evolving project.** Feel free to:
- Propose architectural changes that better serve the vision
- Adapt existing code to meet new requirements  
- Challenge current patterns if they limit functionality
- Innovate with new approaches for media handling

The goal is building a **world-class media creation platform**, not maintaining the status quo.

## Development Commands

**Setup Commands**:
- `npm install` - Install dependencies
- `npm ci` - Clean install dependencies (recommended for CI/CD)

**Standard Commands**:
- `npm run dev` - Start Next.js development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**AWS Amplify Gen2 Commands**:
- `npx ampx sandbox` - Start local cloud sandbox environment
- `npx ampx sandbox delete` - Clean up sandbox resources
- `npx ampx generate graphql-client-code --out <path>` - Generate GraphQL types (rarely needed - types are auto-generated)
- `npx ampx pipeline-deploy --branch <branch> --app-id <app-id>` - Deploy to AWS
- `npx ampx info` - Display information about the current Amplify project

**Note**: 
- GraphQL types are automatically generated when you start the sandbox or deploy
- The sandbox creates a full AWS environment for development - remember to delete it when not in use
- All secret management happens in the Amplify Console, not locally

## Project Vision

Building a comprehensive **AI-powered media creation and editing platform** that empowers users with zero technical knowledge to:

- **Create** images and videos using AI generation models
- **Upload** their own media content (images and videos)
- **Edit** media through:
  - Natural language commands ("remove the background", "make it brighter")
  - Specific AI model operations (upscaling, style transfer, object removal)
  - Traditional editing operations (crop, resize, filters)
- **Manage** their creations with proper organization and history

### Design Principles

1. **User-First Design**: Zero technical knowledge required - intuitive UI/UX
2. **Flexibility Over Rigidity**: Architecture should adapt to new AI models and capabilities
3. **Provider Agnostic**: Easy to add new AI providers (OpenAI, Anthropic, Runway, etc.)
4. **Unified Media Handling**: Consistent patterns for both images and videos
5. **Cost-Conscious**: Credit system to manage expensive AI operations
6. **Scalable Architecture**: Handle growth from prototype to production

## Architecture Considerations

### Recommended Architectural Patterns

**Media Processing Pipeline**:
- Consider a unified pipeline that handles both images and videos
- Enable progressive enhancement (preview → processing → final result)
- Allow for queued operations and batch processing

**AI Provider Abstraction**:
- Design for easy integration of new providers
- Support provider-specific capabilities while maintaining common interfaces
- Consider fallback strategies when providers are unavailable

**Natural Language Processing**:
- Integrate LLMs for command interpretation ("make the sky more dramatic")
- Map natural language to specific operations and parameters
- Provide feedback loops for ambiguous commands

### Technology Stack

**Core Technologies** (current, but open to change):
- Next.js 15 - React framework
- AWS Amplify Gen2 - Backend infrastructure
- TypeScript - Type safety
- AWS Services - Cognito, S3, Lambda, AppSync

**Potential Additions**:
- Video processing libraries (FFmpeg, Video.js)
- WebRTC for real-time collaboration
- WebGL for advanced media manipulation
- Edge computing for faster media processing

### Scalability Considerations

- **Media Storage**: Consider CDN integration, compression strategies
- **Processing**: Queue systems for heavy operations, GPU-accelerated processing
- **Real-time Features**: WebSocket connections for live collaboration
- **Global Distribution**: Multi-region deployment for low latency

## Development Philosophy

### Core Principles

1. **User Experience First**: Every feature should be accessible to non-technical users
2. **Iterative Development**: Start simple, evolve toward the vision
3. **Quality Over Speed**: FAANG-level code quality with flexibility for innovation
4. **Modular Architecture**: Components should be reusable and composable

### Technical Guidelines

**Code Quality**:
- Write clean, readable code - favor clarity over cleverness
- Follow DRY principle, but don't over-abstract prematurely
- Complete features before moving on - no abandoned TODOs
- Comprehensive error handling and user feedback

**Technology Choices**:
- AWS Amplify Gen2 for backend (current choice, evaluate alternatives if needed)
- React/Next.js best practices
- TypeScript for type safety
- Centralized styling system (CSS Modules, Tailwind, or similar)

**Architecture Guidelines**:
- Design for flexibility and growth
- Separate concerns: UI, business logic, data access
- Build abstractions when patterns emerge, not preemptively
- Consider future needs: video processing, real-time features, collaboration

## Project Execution

All project planning, tasks, and implementation details are tracked in the `project-execution-plan/` folder.

## Implementation Guidance

### Current Constraints (Temporary)

- **Rate Limiting**: Emergency measure - 10 ops/hour. Will be replaced by credit system
- **Limited Providers**: Currently only image providers. Video providers coming soon
- **Storage**: S3 for now, consider CDN and optimization strategies

### Future Considerations

**AI Provider Landscape**:

*Image Generation & Editing*:
- Current: Replicate, Stability AI, Gemini
- Potential: DALL-E 3, Midjourney API, Adobe Firefly, Ideogram

*Video Generation & Editing*:
- Runway ML - Industry leader in AI video
- Pika Labs - Competitive video generation
- Stability AI Video - Stable Video Diffusion
- Google's Imagen Video
- Meta's Make-A-Video
- [Shotstack](https://shotstack.io/) - Video editing API
- [Editframe](https://www.editframe.com/) - Developer-friendly video API
- [Capsule](https://capsule.video/) - Enterprise video editing

*Natural Language Processing*:
- OpenAI GPT-4 - Command interpretation
- Anthropic Claude - Complex editing instructions
- Open source LLMs for cost optimization

### Best Practices

1. **Abstract Early**: Create provider interfaces before adding new services
2. **Think in Pipelines**: Design for media flowing through multiple operations
3. **User Feedback**: Show visual indicators for long operations (especially video)
4. **Cost Transparency**: Always show estimated costs before operations
5. **Graceful Degradation**: Have fallbacks when services are unavailable

## Documentation References

**Essential Documentation**:
- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/) - Primary reference for all Amplify features
- [Amplify Gen 2 for Gen 1 Customers](https://docs.amplify.aws/react/start/migrate-to-gen2/) - Migration guide and feature comparison
- Project Execution Plan: See `project-execution-plan/` for implementation tracking

**Key Amplify Gen 2 Resources**:
- [Authentication](https://docs.amplify.aws/gen2/build-a-backend/auth/) - Cognito integration
- [Data (GraphQL)](https://docs.amplify.aws/gen2/build-a-backend/data/) - AppSync and DynamoDB
- [Storage](https://docs.amplify.aws/gen2/build-a-backend/storage/) - S3 file management
- [Functions](https://docs.amplify.aws/gen2/build-a-backend/functions/) - Lambda functions
- [Deployment](https://docs.amplify.aws/gen2/deploy-and-host/) - Hosting and CI/CD

## Environment Setup

**Secrets Management**: All API keys are managed as secrets in the Amplify console, NOT stored locally.

**Environment Variables Used by Code**:
```
Code uses: REPLICATE_API_TOKEN, STABILITY_API_TOKEN, GCP_API_TOKEN (legacy/fallback), GCP_SERVICE_ACCOUNT_JSON, LAMBDA_RESIZE_URL, GCP_VERTEX_LOCATION (optional)
```

Required secrets for AI providers (configure in Amplify console with EXACT names):
- `REPLICATE_API_TOKEN` - Replicate API authentication
- `STABILITY_API_TOKEN` - Stability AI authentication  
- `GCP_SERVICE_ACCOUNT_JSON` - Google Cloud service account JSON for Vertex AI (recommended path)
- `GCP_API_TOKEN` - Legacy Gemini API key (temporary fallback during migration)
- `GCP_VERTEX_LOCATION` - Optional Vertex AI region override (e.g. `us-central1`, `europe-west1`)
- `LAMBDA_RESIZE_URL` - URL for the image resize Lambda function

**How to set secrets**:
1. Go to Amplify console for your app
2. Navigate to Hosting > Environment variables
3. Add secrets with the EXACT names shown above (not `API_KEY`, use `API_TOKEN`)
4. Secrets are securely stored in AWS Systems Manager
5. Lambda functions access them at runtime via `secret()` function

**Important**: 
- Never commit secrets to the repository
- Use the EXACT environment variable names shown above
- We are migrating Google image generation to Vertex AI using a service account. `GCP_API_TOKEN` remains only as a short-term fallback and will be removed once migration is complete.

### Google Vertex AI (Recommended Authentication Path)
1. In GCP, create a Service Account with the `Vertex AI User` role.
2. Create a JSON key and download it. Treat it like a password.
3. In Amplify Console, create a secret named `GCP_SERVICE_ACCOUNT_JSON` and paste the entire JSON content.
4. Optionally set `GCP_VERTEX_LOCATION` (default chosen by backend if not set).
5. Do not store this JSON locally; manage exclusively via Amplify secrets.

See: [Amplify Gen2 Secrets Documentation](https://docs.amplify.aws/react/build-a-backend/functions/environment-variables-and-secrets/#secrets)