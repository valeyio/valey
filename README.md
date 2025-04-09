# Valey

Web application for Valey - helping founders and operators escape the chaos of doing it all.

## Brand Guidelines

### Design Principles

- Modern, bold, premium brand aesthetic
- Clean SaaS design with ample white space
- Sharp layouts and bold, simple typography
- Mobile-first, responsive design
- Minimalist and premium feel

### Color Palette

- Primary: Yellow (#FAD92D)
- Secondary: Black
- Accent: Dark Gray
- No additional colors unless specified

### Development Standards

#### Tech Stack

- Next.js (React)
- TypeScript
- TailwindCSS
- Vercel for hosting

#### Code Style

- Mobile-first approach
- Modern React/Next.js patterns
- Clean, maintainable component structure
- Minimal dependencies
- TailwindCSS for styling

#### Copy Guidelines

1. Emotionally resonant, transformation-focused
2. Avoid terms like "staffing" or "VA placement"
3. Preferred terms:
   - "Embedded team"
   - "Delegation"
   - "Operational clarity"
   - "Remote performance"
4. Headlines: Short and punchy
5. Subheadlines: Supporting detail but concise
6. Voice: Human, clear, founder-focused
7. Avoid jargon and corporate language

## Development Workflow (Docker-based)

All development should be done using Docker to ensure consistency across environments.

### Prerequisites

- Docker
- Docker Compose

### Getting Started

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd valey
   ```

2. Start the Docker containers

   ```bash
   docker-compose up -d
   ```

3. View the application at http://localhost:9000

### Development Commands

- Start the containers

  ```bash
  docker-compose up -d
  ```

- View logs

  ```bash
  docker-compose logs -f
  ```

- Stop the containers

  ```bash
  docker-compose down
  ```

- Rebuild containers after dependency changes
  ```bash
  docker-compose build --no-cache
  docker-compose up -d
  ```

### Adding Dependencies

When adding new dependencies to the project, make sure to:

1. Update the package.json file
2. Rebuild the Docker container
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Important Notes

- Always develop using the Docker container, not local Node.js installations
- The Docker container has permissions set up for proper Next.js caching
- If you encounter module resolution issues, make sure to rebuild the container

## Deployment

Deployment should also use Docker for consistency between development and production environments.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Development Commands

- `npm run dev`
