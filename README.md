# 360 Composer

360-Composer is a software package containing all the components needed to deploy a 360 video story line editing suite.

## Installation and usage

1. Clone or download the project.
2. `cd` into the directory.
3. Open the project by your preffered IDE.
4. Copy the `.env.sample` -> `cp .env.sample .env`.
5. Update the `.env` values.
6. Create the `assets` and `local_assets` folder in the root directory (`mkdir assets`, `mkdir local_assets`).
7. Run the project in docker `docker compose up` (requires docker to be installed and running)

- Access the web interface at: http://localhost:8080

When installing you can choose to run a production or development build.

> **_NOTE:_**  In this repository the production docker-compose is untouched.

## Assets

In order to properly upload assets, these must be of similar format as [this video](https://youtu.be/r8f4J80Z9eY). Uploading regular MP4 files does not work, since these need to be 360 video format. Thereby the following approach is recommended:

1. Download YT-DLP (command-line tool for downloading YouTube videos.), and add it to your PATH (Windows)
2. Download FFMPEG (free, open-source multimedia framework, capable of decoding, encoding, transcoding, muxing, demuxing, streaming, filtering, and playing nearly all audio and video formats.), and add it to your PATH (Windows).
3. Open a new terminal.
4. Change the directory to the `local_assets` folder.
5. Run the following command to download the video from the installation step. This outputs a `.webm` file.
```sh
yt-dlp -f 313+251 -o yt.webm 'https://www.youtube.com/watch?v=r8f4J80Z9eY'
```
6. Excecute the following command to convert it back again to `.mp4` format. Note that `yt.webm` is the same file as from step 5.
```sh
ffmpeg \
-y \
-hide_banner \
-i yt.webm \
-vf "v360=c3x2:e:cubic:in_forder='lfrdbu':in_frot='000313',scale=3840:1920,setsar=1:1" \
-pix_fmt yuv420p -c:v libx264 -preset faster -crf 21 \
-c:a copy -ss 16 -t 10 -movflags +faststart \
output.mp4
```

Source: http://paulbourke.net/panorama/youtubeformat/

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| **backend** | 5000 | Flask API server. Connects to PostgreSQL and Redis. Source is bind-mounted from `./scene-editor/backend` for live reloading. |
| **redis** | 6379 | In-memory store used as a message broker for the RQ (Redis Queue) background task worker. |
| **postgres** | 5433→5432 | PostgreSQL 15 database. Data is persisted in a named volume. Exposed on host port `5433`. |
| **nginx** | 8080 | Reverse proxy that sits in front of the backend and frontend. This is the main entry point (`http://localhost:8080`). |
| **frontend** | 3000 | React development server (Node 18). Runs `npm install && npm start` on startup. Hot-reload is enabled via polling. |

## Other
- Members of the Visualisation Lab can push updated Docker images to GitHub Container Registry using the ./docker-push.sh script
