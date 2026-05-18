# Raputa Frontend

Raputa frontend is a Vue 3 application for dysphagia screening and aspiration detection workflows. It talks to the Spring Boot backend through `/api` and `/ws`; model services are called by the backend, not by the browser directly.

## Stack

- Vue 3 + TypeScript + Vite
- Element Plus
- ECharts
- Axios
- SockJS/STOMP for real-time updates
- html2pdf.js for report export

## Start

```bash
npm install
npm run dev
```

Default development URL:

```text
http://localhost:5173
```

The Vite dev proxy forwards:

- `/api` to `http://localhost:8080`
- `/ws` to `http://localhost:8080`

Start the backend before logging in. If the backend is not running, Vite may print proxy `ECONNREFUSED` messages for `/api/user/me`; that means the browser asked for the current login session but nothing was listening on port `8080`.

## Build

```bash
npm run build
```

The build runs TypeScript checks first and then creates `dist/`. Heavy dependencies are split into vendor chunks so report export, charts, Element Plus, and real-time messaging do not all land in one bundle.

## Main Views

- `Login.vue` and `Register.vue`: account entry pages.
- `Patient.vue`: patient records, appointments, and patient check history.
- `Monitor.vue`: real-time and file-mode detection. It supports dysphagia screening and aspiration detection, automatic and manual swallow segmentation, device selection, report export, screening-to-patient archiving, and post-detection chart zooming.
- `Model.vue`: model runtime monitoring. It checks the dysphagia and aspiration model APIs and shows loaded, available, and reachable model states.
- `Data.vue`: patient data files, report downloads, and session file browsing.
- `Stats.vue`: daily patient counts, result distribution, department proportions, and device usage statistics.
- `Device.vue`: device asset and session management. Device identity, IP, and online state are maintained by backend discovery; editable fields are device name, storage/deployment location, and remarks.
- `System.vue`: administrator account management, including user creation, role/department/hospital updates, password reset, and guarded deletion. Current or online accounts cannot be deleted from the UI.

## Development Notes

- Keep browser authentication based on the backend session cookie. Do not reintroduce `localStorage` login state.
- Device release requests are delivered through backend session state and WebSocket messages.
- File-mode detection expects the current standard three-file input: IMU, airflow, and audio.
- In real-time mode, device selection depends on backend discovery and device session locks. A device can be occupied by only one active browser session.
- Reports are generated in the browser and then uploaded through the backend when needed.
- Chart highlight regions are stored in frontend state and should survive stop/release/report actions. During live detection, chart zooming is disabled; after detection stops, zooming is available for review.
