# ats-mini-webui

A web interface for the ATS Mini system.

## Development Modes

The project uses standard development mode using Vite's dev server. It is possible to start the application in two different modes:

### `npm run dev`
This mode expects a live ATS Mini to be running and accessible for API calls. The proxy address is configured in the `vite.config.js` file in the `FORWARD_API_HOST` variable and defaults to `http://10.1.1.1`.

### `npm run dev-mock`
This mode simulates API responses without needing an active ATS Mini. The served responses and mock logic are defined in the `mock-api` plugin in `vite.config.js`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Choose your development mode:
   ```bash
   # Standard mode (requires backend)
   npm run dev

   # Mock mode (no backend required)
   npm run dev-mock
   ```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

## Other Scripts

- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint to check code quality
