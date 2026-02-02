# USBArmyKnife Web Interface

A modern web interface for managing and interacting with USBArmyKnife devices. This is a client-only application designed to be hosted on GitHub Pages.

## Features

- **Device Management Dashboard** - Monitor device status, capabilities, and system information
- **File Management** - Upload, download, and delete files on the device SD card
- **Script Execution** - Run DuckyScript files with helpful command reference
- **Display Control** - Show images and text on the device TFT display
- **LED Control** - Control RGB LED colors
- **Agent Management** - Execute commands via installed agent
- **Real-time Logs** - View device logs and error messages
- **Swagger API Documentation** - Complete API reference at `/docs`
- **Configurable Device URL** - Set and save your device IP address

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

```bash
pnpm install
```

### Development

1. **Configure proxy for CORS (recommended):**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your device URL:

   ```
   VITE_USE_PROXY=true
   VITE_PROXY_TARGET=http://192.168.1.27:8080
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

The app will be available at `http://localhost:5173`

### CORS Configuration

The device API doesn't support CORS, which causes errors when developing locally. We provide two solutions:

#### Option 1: Use Development Proxy (Recommended)

Set up a proxy in development to avoid CORS issues:

1. Copy `.env.example` to `.env`
2. Set `VITE_USE_PROXY=true`
3. Set `VITE_PROXY_TARGET` to your device URL (e.g., `http://http://192.168.1.27:8080`)
4. Restart the dev server

With proxy enabled, all API calls are routed through the Vite dev server:

```
Browser -> http://localhost:5173/api-proxy/data.json
         -> Vite Proxy
         -> http://http://192.168.1.27:8080/data.json
```

#### Option 2: Direct Connection (CORS Errors Expected)

If you don't enable the proxy, the app makes direct calls to the device URL. You'll see CORS errors in the console, but the requests may still work. The device responds successfully even though the browser blocks the response.

To ignore CORS during development, you can:

- Use a CORS browser extension
- Use the proxy (Option 1)
- Access the app from the device's own web interface

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable            | Default                           | Description                               |
| ------------------- | --------------------------------- | ----------------------------------------- |
| `VITE_USE_PROXY`    | `false`                           | Enable proxy in development to avoid CORS |
| `VITE_PROXY_PREFIX` | `/api-proxy`                      | URL prefix for proxy routes               |
| `VITE_PROXY_TARGET` | `http://http://192.168.1.27:8080` | Device URL to proxy to                    |

### Build for Production

```bash
pnpm build
```

### GitHub Pages Deployment

1. Build the project: `pnpm build`
2. Push the `dist` folder contents to the `gh-pages` branch
3. Enable GitHub Pages in repository settings pointing to `gh-pages` branch

Or use GitHub Actions for automatic deployment (see `.github/workflows/deploy.yml`)

## Usage

1. **Configure Device URL**: Click the settings icon in the top right and enter your device URL (default: `http://4.3.2.1:8080`)
2. **View Device Status**: The dashboard shows real-time device information
3. **Manage Files**: Upload, download, or delete files from the device SD card
4. **Run Scripts**: Execute DuckyScript files or individual commands
5. **Control Display**: Show images or text on the device screen
6. **View API Docs**: Navigate to `/docs` for complete API documentation

## Device Connection

The device can be accessed in two modes:

- **AP Mode**: Device creates its own WiFi network (default: `http://4.3.2.1:8080`)
- **Station Mode**: Device connects to your WiFi network (configure IP in settings)

### Troubleshooting Connection Issues

**CORS Errors in Development:**

- Enable the proxy by setting `VITE_USE_PROXY=true` in `.env`
- Make sure `VITE_PROXY_TARGET` matches your device URL
- Restart the dev server after changing `.env`

**Connection Test Fails:**

- Verify the device is powered on and connected to your network
- Check that the device URL is correct in Settings
- Try accessing the device URL directly in your browser
- Ensure no firewall is blocking the connection

**Proxy Not Working:**

- Check that `.env` file exists in the project root
- Verify `VITE_USE_PROXY=true` (not `"true"` with quotes)
- Restart the dev server - env changes require a restart
- Check console for proxy logs: `[Proxy] GET /data.json -> ...`

## API Reference

Full API documentation is available at `/docs` when running the application, or see `swagger.yaml` for the OpenAPI specification.

## Technologies

- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- Swagger UI

## License

See LICENSE file for details.

## Resources

- [USBArmyKnife Repository](https://github.com/i-am-shodan/USBArmyKnife)
- [USBArmyKnife Wiki](https://github.com/i-am-shodan/USBArmyKnife/wiki)
