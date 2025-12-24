# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Pages application that maps the "effective coverage" of a MeshCore mesh network for the Tri-Cities region. The system:

- Collects location ping samples from client radios via wardrive sessions
- Receives MQTT messages from observer nodes to determine if pings were received
- Consolidates samples into coverage tiles using geohash encoding
- Visualizes coverage on an interactive Leaflet map

The project is **not** a general-purpose repeater coverage map. It specifically shows where sent messages will be widely received across the whole mesh network.

## Build and Development Commands

### Local Development
```bash
npm run dev           # Start Wrangler dev server
npm start             # Alias for npm run dev
```

### Deployment
```bash
npm run deploy        # Deploy to Cloudflare Pages via Wrangler
```

### Testing
```bash
npm test              # Run Vitest tests with Cloudflare Workers pool
```

### Regenerate Bundled Shared Code
When modifying `content/shared_npm.js`, regenerate the bundle:
```bash
npx esbuild content/shared_npm.js --bundle --format=esm --outfile=content/shared.js
```

## Architecture

### Deployment Infrastructure
- **Web App & API**: Hosted on Cloudflare Pages with KV Workers (serverless functions)
- **MQTT Client**: Runs on a local Linux VM as systemd services
- **MQTT Broker**: Custom MQTT broker setup (not using external services like letsme.sh)
- **Consolidation Script**: Triggered hourly from the Linux VM, calls the `/consolidate` endpoint

### Data Flow
1. **Client** → Sends ping with location to both the mesh and the service (`/put-sample`)
2. **MQTT Observer** → Receives ping from mesh, extracts location and first-hop repeater
3. **MQTT Client** (support/mqtt/) → Updates sample with repeater info via service API
4. **Consolidation** → Batch script runs hourly to merge samples into coverage tiles (`/consolidate`)
5. **Web App** → Displays coverage (green = heard, red = lost) and samples on map

### Key Terminology
- **Sample/Ping**: An 8-digit geohash (~5m accuracy) representing a location ping sent by clients
- **Coverage/Tile**: A 6-digit geohash tile aggregating multiple samples for map efficiency
- **Repeater**: A mesh repeater/node that can relay messages
- **Geohash**: Location encoding scheme where coverage key = sample key minus last 2 digits

### Cloudflare KV Namespaces (wrangler.jsonc)
- `SAMPLES`: Active samples (recent pings not yet consolidated)
- `COVERAGE`: Consolidated coverage tiles with aggregated statistics
- `REPEATERS`: Repeater/node information (position, elevation, name, etc.)
- `ARCHIVE`: Archived samples after consolidation

### Core Functions (functions/)
- `put-sample.js`: Receives pings from clients, stores in SAMPLES KV
- `consolidate.js`: Merges old samples into COVERAGE tiles, archives samples
- `get-nodes.js`: Returns combined coverage, samples, and repeater data for map rendering
- `get-coverage.js`, `get-samples.js`, `get-repeaters.js`: Individual data retrieval endpoints
- `put-repeater.js`: Updates repeater information
- `clean-up.js`: Housekeeping tasks
- `slurp.js`: Pulls service data locally for testing (requires host update)

### Frontend Structure
- `index.html`: Main map page
- `content/code.js`: Leaflet map rendering, event handlers, data visualization
- `content/shared_npm.js`: Shared utilities (geohash, distance, validation, time functions)
- `content/shared.js`: Bundled version of shared_npm.js (generated, don't edit directly)
- `content/mc/`: MeshCore protocol library for radio communication
  - `index.js`: Exports Connection classes, Packet, Advert, Constants, etc.
  - `connection/`: Various connection types (WebBLE, Serial, TCP, WebSerial, NodeJS)
  - `packet.js`, `advert.js`: Protocol message handling
  - `cayenne_lpp.js`: Cayenne Low Power Payload encoding

### MQTT Support Scripts (support/mqtt/)
Python scripts that run as systemd services on a Linux VM:
- `wardrive-mqtt.py`: Subscribes to MQTT feed, processes mesh packets, updates samples via API
- `wardrive-maint.py`: Maintenance tasks called periodically via timer
- `config.json`: Configuration for MQTT host, service host, center position, watched observers

## Region Configuration

The app is configured for a specific geographic region. To customize for your region, update these values in `content/shared_npm.js`:

```javascript
export const centerPos = [46.23642498634349, -119.1949224098118]; // [lat, lon]
export const maxDistanceMiles = 40;
```

After modifying, regenerate `content/shared.js` using the esbuild command above.

The MQTT config (`support/mqtt/config.json`) also requires region settings:
- `center_pos`: Center of your map
- `valid_dist`: Radius in miles for the region
- `watched_observers`: Repeater names of official observer nodes

## Important Notes

- Samples use 8-digit geohash for ~5m accuracy
- Coverage tiles use 6-digit geohash (first 6 chars of sample hash)
- Sample consolidation happens for samples older than 0.5 days (configurable)
- Only the 15 newest samples per coverage tile are retained
- The `path` field in samples contains the list of repeater IDs that heard the ping
- Time is stored as truncated timestamps (1-minute accuracy) to reduce storage
- KV writes to the same key are limited to one per second (handled with retry logic)
- the upsteam repo is https://github.com/kallanreed/mesh-map
- the public URL is tc-mesh-map.n7afk.net, also available at tc-mesh-map.pages.dev