# GDW Mirror

**Mirror screens between macOS and Windows over your local network.** Share either computer's screen and view it on the other at native resolution.

> **Mirror** is the keyword here: this is not remote control or remote desktop. The screen image travels between computers; neither computer controls the other's mouse or keyboard.

No remote control, no gamepads, no drivers, no installed services, no cloud, no accounts.

- **One dual-role app** for macOS and Windows: either computer can share its screen for the other to view, one direction at a time. It runs from the menu bar/system tray and includes the remote viewer.

> **Este documento también está disponible en español:** [README.md](README.md)

---

## Table of contents

- [Origin of the project](#origin-of-the-project)
- [What problem it solves](#what-problem-it-solves)
- [Why not Sunshine / Moonlight](#why-not-sunshine--moonlight)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Option A: download from GitHub Releases](#option-a-download-from-github-releases)
  - [Option B: clone the repository](#option-b-clone-the-repository)
  - [Option C: build from source](#option-c-build-from-source)
- [Usage](#usage)
  - [On macOS](#1-on-macos)
  - [On Windows](#2-on-windows)
  - [For Meet / Zoom / OBS](#3-for-meet--zoom--obs)
- [Image quality](#image-quality)
  - [What is prioritized](#what-is-prioritized)
  - [About fps and ProMotion](#about-fps-and-promotion)
  - [Native vs. scaled resolution](#native-vs-scaled-resolution)
- [Audio](#audio)
- [How they connect](#how-they-connect)
- [Troubleshooting](#troubleshooting)
- [Building](#building)
- [Development](#development)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)
- [Security](#security)
- [Distribution and signing](#distribution-and-signing)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)
- [Search terms](#search-terms)

---

---

## Origin of the project

This project started with a specific need: **sharing a Mac's screen on a Windows PC** during a conference or class while preserving native resolution. It has since evolved into a dual-role app: either computer can now share its screen for the other to view, including Windows to Mac.

The existing alternatives weren't a good fit for that original use case. It shaped the project, but the current app is no longer limited to that direction:

- **Sharing from the Mac's browser** degrades the image and ties the presentation to the machine with the
  good screen. If the Mac is on a stand or connected to a projector, you can't also drive the call from it.
- **Desktop streaming suites** (Sunshine/Moonlight) are built for gaming: they install permanent services,
  virtual gamepad drivers, and capture components you then have to maintain, which can affect system
  stability. For presenting slides it's excessive machinery.
- **Remote desktop tools** (VNC, AnyDesk, TeamViewer) add keyboard and mouse control — not wanted here — and
  usually compress text aggressively.

The solution is scoped to a single path —**capture → encode → transport → display**— available in either direction, one transmission at a time.

It was developed **with AI assistance**, starting from that need rather than a generic product idea: every
technical decision (native resolution, fps adapted to the panel, system audio, zero installation) was made
for that specific use case.

## What problem it solves

You're a presenter in a video call. You have:

- a **Mac** with the good screen, the material, and the slides;
- a **Windows PC** with the camera, microphone, big monitor, and the Meet/Zoom client.

You can present the Mac screen on Windows, or the Windows screen on macOS, with enough quality for text to be readable. The transmission direction doesn't depend on which computer starts the app, and only one connection can be active at a time. The receiving computer shows it in a window you can capture with OBS or share directly in the meeting.

It does **not** do remote control. It doesn't move the other computer's mouse or keyboard. It installs no services or drivers.

## Why not Sunshine / Moonlight

Sunshine works well, but it's designed for gaming:

| | Sunshine / Moonlight | GDW Mirror |
| --- | --- | --- |
| Installation | Permanent service + virtual drivers | A portable `.exe` and an `.app` |
| Gamepad control | Yes, virtual drivers | No |
| Configuration | Several settings screens | A 6-block panel |
| Discovery | Manual (IP + PIN) | Automatic via UDP broadcast |
| Quality focus | Minimum latency | Maximum resolution |
| Audio | Extra configuration | A single toggle |

If you want to game, use Sunshine. If you want to present, use this.

## Features

- **Real native resolution.** Captures the physical framebuffer: a 4K screen sends 3840×2160, not
  upscaled 1080p.
- **FPS adapted to the panel.** Reads the screen's real refresh rate and doesn't ask for more than the
  hardware delivers.
- **System audio** behind a single toggle, without installing virtual audio drivers.
- **Automatic discovery** on the local network. No typing IPs.
- **Optional connection code** — off by default, one click to enable.
- **One app for both roles.** Share your screen or receive the other computer's; one direction at a time.
- **Zero cloud.** Nothing leaves your local network.
- **Display and sent-resolution selection** from the panel.
- **Native macOS menu bar** with no floating windows.
- **Frameless Windows window** that auto-resizes to the signal's aspect ratio.

## Requirements

| | Minimum | Tested on |
| --- | --- | --- |
| macOS | 13 (Ventura) | macOS 26.7, Apple Silicon |
| Windows | 10 x64 | Windows 11 x64 |
| Network | Same LAN | Ethernet and WiFi 6 |

- **Apple Silicon and Intel**: `arm64` (Apple Silicon) and `x64` (Intel) binaries are published.
- **Windows**: x64 only. No ARM64 build.
- Both machines must see each other on the local network (no client isolation).

## Installation

### Option A: download from GitHub Releases

Go to [**Releases**](../../releases) to download the macOS binaries and, if you prefer the portable
version, the Windows `.exe`:

| File | For |
| --- | --- |
| `GDW-Mirror-<version>-arm64.zip` / `.dmg` | Mac (Apple Silicon) |
| `GDW-Mirror-<version>-x64.zip` / `.dmg` | Mac (Intel) |
| `GDW-Mirror-<version>-x64-portable.exe` | Windows x64 portable |

> **Security notice.** The macOS app is signed with Developer ID and notarized by Apple; the `.dmg` also
> has its notarization ticket stapled. It should not require the steps for opening an unidentified app found
> in older guides. The Windows portable executable is not signed with a Windows certificate,
> so SmartScreen may show a warning.

#### macOS

1. Open the `.dmg` or unzip the `.zip` matching your Mac (`arm64` for Apple Silicon, `x64` for Intel). You get **GDW Mirror.app**.
2. Drag the app to **Applications** (recommended, not required).
3. Open **GDW Mirror.app**. Because it is signed with Developer ID and notarized, macOS should accept it
   without bypassing Gatekeeper or manually removing quarantine. If a warning appears, do not bypass it;
   confirm the download came from the official release.

4. The app starts in the menu bar without a main window. Open the panel from its icon to share this screen or open the remote viewer.
5. The first time you share, macOS will ask for **Screen Recording**:
   *System Settings → Privacy & Security → Screen Recording* → enable **GDW Mirror**. The system will
   ask to **restart the app**; quit it from the panel (*Quit GDW Mirror*) and reopen it.

#### Windows

Download `GDW-Mirror-<version>-x64-portable.exe` from GitHub Releases. It does not need installation.

1. Copy the portable `.exe` wherever you like and run it.
2. If **"Windows protected your PC"** appears: click **More info** → **Run anyway**.
3. Allow the app on private networks when prompted so local device discovery can work.

### Option B: clone the repository

If you prefer the source and building it yourself:

```bash
git clone https://github.com/josecruzchavez/gdw-mirror.git
cd gdw-mirror
npm install
```

The binaries are not in the repository (see [Distribution and signing](#distribution-and-signing)); they
are built with the commands under [Building](#building).

**Advantage:** locally built files **carry no quarantine** and open without any warning.

### Option C: build from source

See [Building](#building).

## Usage

The same app can share a screen or view another device's screen. On macOS, open it from the menu bar; on Windows, use the system tray icon. Select **Share screen** or **View remote screen**. The viewer opens in a separate window and cannot be opened while sharing is active.

### 1. On macOS

1. Open **GDW Mirror**. It starts in the menu bar without a main window.
2. Click the icon → a **block panel** opens. Choose **Share screen** to send the Mac screen, or **View remote screen** to receive a Windows stream.
3. When sharing, the icon turns red and shows the active resolution.
4. If you need the connection details, open the **Connection** block → **Connection details…**

The panel is a custom popover, **not a native menu**: choosing an option **keeps it open**, so you can
change several things in a row without reopening it. Each block stays expanded until you close it. It closes
when you click outside, with `Esc`, or by clicking the icon again.

| Block | What it controls |
| --- | --- |
| **Screen to share** | Which monitor to share. Never two at once. |
| **Quality profile** | Sharp (30 fps, 60 Mbps) · Smooth (60 fps, 80 Mbps) · High (90 fps, 100 Mbps) · Eco (30 fps, 12 Mbps) |
| **Sent resolution** | Native · Scaled to half · Scaled to 1080p |
| **System audio** | Include audio or not. Can be toggled live. |
| **Connection** | Require a 6-digit code (off by default) and see details. |
| **About** | Author, description, and links. |

In the footer: *Open at login*, *Screen recording permissions…* and *Quit GDW Mirror*.

### 2. On Windows

1. Open **GDW Mirror** from the Start menu or run the portable `.exe`.
2. From the tray, choose **Share screen** to send Windows' screen, or **View remote screen** to receive another computer's screen.
3. In the viewer, select the sharing computer under **Remote computers**. If it doesn't appear, enter its IP manually (shown in the sharing computer's *Connection* block).
4. Press **Connect**. If the sharing computer has *Require code* enabled, type the 6-digit code; otherwise it connects directly.
5. The window **auto-resizes** to the aspect ratio of the received signal.
6. Above the image: resolution, fps, bitrate, and latency. Buttons **Always on top**, **Fullscreen**, and
   **Disconnect**.

The window has no native title bar. The controls (minimize, maximize, close) are custom buttons, small and
semi-transparent: they dim when the window loses focus and return to full opacity on focus. They hide in
fullscreen.

**Shortcuts:** `F` toggles fullscreen · `Esc` exits it.

### 3. For Meet / Zoom / OBS

The best quality comes from **routing the image through OBS** instead of sharing the window directly:

1. On the computer receiving the image, open **OBS**.
2. Source → **Window Capture** → choose the *GDW Mirror* window.
3. Right-click the source → **Transform → Fit to screen**.
4. **Start Virtual Camera**.
5. In Meet/Zoom choose **OBS Virtual Camera** as the camera.

This delivers clean 1080p60, without the double recompression of window sharing, and lets you use scenes,
transitions, and recording.

If you prefer simplicity, **sharing the GDW Mirror window directly also works**. Meet and Zoom
recompress to ~1080p anyway, so OBS's gain is scene control, not resolution.

**Audio:** during the call use the **Windows microphone**. The system audio arriving through the mirror
only contains what the Mac plays, not your voice.

## Image quality

### What is prioritized

Resolution. The video track is marked `contentHint = "detail"` and the encoder uses
`degradationPreference = "maintain-resolution"`: if the network tightens, **fps drop before resolution**.
There is no rescaling in the path; what the screen produces is what's sent (unless you explicitly choose a
scaled *Sent resolution*).

### About fps and ProMotion

`getDisplayMedia` does **not** use the panel's refresh rate: with no constraints it delivers 30 fps. The
ceiling was requested explicitly and measured on a MacBook Pro with a 120 Hz panel:

| Configuration | Real captured fps |
| --- | --- |
| no constraints | 29.4 |
| `ideal: 60` | 57.2 |
| `ideal: 90` | 82–83 |
| `ideal: 120` | 109.7 (capture) |
| `maxFramerate: 120` on the sender | **0 frames — the encoder emits nothing** |
| `maxFramerate: 119` on the sender | **0 frames** |
| `maxFramerate: 90` on the sender | 82–83 ✅ |
| `maxFramerate: 60` on the sender | 57 ✅ |

Three conclusions:

1. **There is a hard limit near 120** between `maxFramerate` and the macOS encoder: above ~90 the encoder
   produces no frames. That's why the highest profile is **90 fps**.
2. **ProMotion is adaptive.** Capture is *change-driven*: if the screen is still, no new frames are
   produced. The panel's fps is a ceiling, not a guaranteed rate.
3. **The effective fps is clipped to the panel's physical rate.** If you ask for 90 fps and the screen is
   60 Hz, the host lowers the ceiling to 60 instead of producing nothing.

### Native vs. scaled resolution

`getDisplayMedia` delivers the **physical framebuffer**, not the logical size. A 4K screen configured to
"look like 1920×1080" (200% scale) reports `bounds = 1920×1080` with `scaleFactor = 2`, and the capture
comes out at **3840×2160**. The *Screen to share* block shows it: `Screen 2 · 3840×2160 · view 1920×1080`.

That's what *Sent resolution* is for:

| Mode | Sent with a 4K screen | When to use it |
| --- | --- | --- |
| Native | 3840×2160 | Reading very small text, showing fine detail |
| Scaled to half | 1920×1080 | Normal conference use: half the bandwidth |
| Scaled to 1080p | 1920×1080 (or less) | When the network is poor |

Scaling is done by the GPU via `scaleResolutionDownBy` in the encoder: **it costs no extra CPU** and the
capture stays native. Scaling to 1080p also lowers the bitrate ceiling, because it's computed on the
resolution actually sent.

Bitrate auto-adjusts to the sent area: above 2.5 megapixels the ceiling rises proportionally, capped at
250 Mbps to avoid saturating the local network.

> **Technical note:** `getSettings()` on the capture track in macOS **is not reliable**. It reports the
> physical resolution of another screen, not the one being captured. Measured: capturing the internal
> screen (3024×1964) it reported 3840×2160. That's why the host takes the chosen screen's dimensions from
> the main process (`screen.getAllDisplays()`) and passes them to the engine; it doesn't read them from the
> track.

## Audio

System audio is captured via Chromium's `loopback` mode. It requires no BlackHole, Soundflower, or any
virtual audio driver.

### The Mac's volume does not affect what's sent

Measured with a 440 Hz tone and a spectrum analyzer on the captured track:

| Mac volume | Captured peak (dBFS) |
| --- | --- |
| 100% | −9.0 |
| 73% | −9.0 |
| 50% | −9.0 |
| 20% | −9.0 |
| 0% | −9.0 |

**The tap is before the output attenuator**: audio is captured at full level even when the Mac is silent.
At the other end it sounds the same with the Mac's volume at 0% or 100%. Volume is controlled on Windows.

Additionally, `autoGainControl`, `noiseSuppression`, and `echoCancellation` are disabled — Chromium applies
them by default (they're designed for microphones). With AGC on, the level became unpredictable: in the
measurement, 100% could sound lower than 73%.

**Limitation:** if an app uses protected audio (DRM content, for example), it may not be captured.

## How they connect

```
GDW Mirror (Mac)                           GDW Mirror (Windows)
  menu bar                                  window
  ScreenCaptureKit / getDisplayMedia  ──▶   WebRTC (receives)
  VideoToolbox (negotiated codec)             hardware decoding
        │                                          ▲
        └──── local HTTP :47820 (SDP) ─────────────┘
              UDP :47821 (discovery)
```

- **Discovery**: UDP broadcast on port `47821`. The receiver sends `MIRROR_DISCOVER`, the host replies with
  name, IP, port, and whether it requires a code. If broadcast is blocked, type the IP by hand.
- **Signaling**: HTTP on `0.0.0.0:47820`, local network only. Routes `GET /hello`, `POST /offer`,
  `POST /answer`, `POST /bye`. The 6-digit code is **optional**: off by default. If *Require code* is
  enabled, every request must carry it, and 8 failures from the same IP block for 30 seconds.
- **Media**: direct WebRTC P2P, no STUN or TURN. Chromium's mDNS candidates are disabled
  (`WebRtcHideLocalIpsWithMdns`), because Windows without Bonjour can't resolve `.local` and the connection
  would fail.
- **Codecs**: the host prefers AV1 → HEVC/H.265 → H.264 → VP9 → VP8, subject to its capabilities. WebRTC
  negotiates only codecs supported by both devices; if the receiver cannot use AV1 or HEVC, a compatible
  fallback is negotiated.
- **Reconnection**: after a temporary disconnect, the receiver waits 3 seconds and retries up to 6 times,
  with 1.5-second intervals. If it cannot reconnect, it shows a message so you can reconnect manually.

Nothing leaves the internet. No intermediary servers. No telemetry.

## Troubleshooting

### The other computer doesn't appear in the list

1. Confirm both computers are on the **same network** and the remote computer is sharing.
2. Check both firewalls and allow incoming connections for *GDW Mirror*.
3. Type the **IP by hand** in the remote viewer. It is shown in the sharing computer's *Connection* block.
4. If your router has **client isolation / AP isolation**, disable it. The machines can't see each other.

### macOS blocks the app on open

Expected on browser downloads. See [Installation](#option-a-download-from-github-releases):

```bash
xattr -dr com.apple.quarantine "/Applications/GDW Mirror.app"
```

### "GDW Mirror can't record the screen"

The permission isn't granted, or the app wasn't restarted after granting it:

1. *System Settings → Privacy & Security → Screen Recording*.
2. Enable **GDW Mirror**.
3. **Quit** the app from the panel and reopen it. Without restarting, the permission doesn't apply.

> Note: when the bundle ID changes between versions, macOS treats the app as new and **asks for the
> permission again**. It's once per major version.

### Windows shows "Windows protected your PC"

Expected on browser downloads: **More info** → **Run anyway**. To avoid it permanently you need a code
signing certificate. See [Distribution and signing](#distribution-and-signing).

### Low fps

Capture is **change-driven**: if the screen is still (a static slide), no new frames are generated and the
counter drops. Move the mouse or play a video to verify.

If it stays low with movement:

1. Check the **latency chip** in the Windows window and the **bitrate**.
2. If the profile is *High* (90 fps) and your external screen is 60 Hz, the host clips it to 60. That's
   correct.
3. Try **Scaled to 1080p** instead of *Native*: it halves the bandwidth and multiplies available fps.
4. On WiFi 2.4 GHz the bitrate is severely limited. Use 5 GHz or Ethernet. If there are drops, lower to the
   *Eco* profile.

### Video drifts into accumulated lag

Usually the network, not the encoder. Check the bitrate: if it's well below the profile ceiling, there's
packet loss. Try Ethernet on both ends, or lower the profile.

### The Windows window doesn't resize

Auto-resize happens on receiving the first frame with valid metadata. If you maximized or entered
fullscreen first, your choice is respected and it won't resize.

### Connects but stays on "No signal"

1. Check the Mac is still sharing (the menu bar icon must be red).
2. Check the Windows firewall: it must allow the app on **private networks**.
3. If you use a VPN, it may be capturing local traffic. Disable it or exclude the subnet.

### The connection drops after a while

High profiles with weak WiFi. Lower to *Eco* and check. It may also be the Mac sleeping: the app blocks
*display sleep* while sharing, but not *system sleep*.

## Building

```bash
npm ci

# macOS (Apple Silicon by default; builds ZIP and DMG)
npm run dist:mac

# macOS Intel
npm run dist:mac -- --x64

# Windows x64 (portable)
npm run dist:win

# Windows Microsoft Store package (.appx / MSIX)
npm run dist:win:store
```

The portable executable is written under `dist/dual/`; the Microsoft Store package is written under
`dist/store/`. To run the app from source, use `npm run dev`.

### Building on another operating system

- The Windows portable executable can be built from macOS.
- The Microsoft Store MSIX package is built on Windows using GitHub Actions.
- macOS packages can only be built on macOS.

### Automatic publishing (GitHub Actions)

The repository includes a workflow in [`.github/workflows/release.yml`](.github/workflows/release.yml) that
builds both platforms and publishes the release.

**It triggers in two ways:**

```bash
# 1. On pushing a tag
git tag v0.2.3
git push origin v0.2.3

# 2. Manually, specifying the tag
gh workflow run release.yml -f tag=v0.2.3
```

**What it does:**

| Job | Runner | Action |
| --- | --- | --- |
| `meta` | ubuntu | Reads the version from `package.json` and derives the tag |
| `build-mac` | macos-14 | Builds and notarizes the dual-role app for Apple Silicon and Intel; verifies its signature |
| `build-win` | windows-latest | Builds the portable Windows executable for x64 |
| `publish` | ubuntu | Computes SHA-256 and creates or updates the release with `gh` |

To build a portable executable manually, use **Actions → Build Windows portable**. To create the package
for Partner Center, use **Actions → Build MSIX for Microsoft Store**, download the `GDW_Mirror-MSIX`
artifact, and upload its `.appx` file. The Store signs the package during publication.

The `publish` job is idempotent: if the release already exists, it **replaces** the files (`--clobber`)
instead of failing. Notes come from [`builder/RELEASE-NOTES.md`](builder/RELEASE-NOTES.md) — **update it
before each release**.

> **Technical note:** the build commands use `--publish never`. Without it, electron-builder detects the CI
> environment and tries to publish on its own, failing with
> `GitHub Personal Access Token is not set`. Publishing is done by the final job with `gh`.

#### Configure macOS signing and notarization in GitHub Actions

The workflow requires these **Actions secrets** in *Settings → Secrets and variables → Actions*. Never
commit them to the repository or share them in chat:

| Secret | Contents |
| --- | --- |
| `MACOS_CSC_LINK` | Base64 single-line encoding of the `.p12` containing your **Developer ID Application certificate and private key**. |
| `MACOS_CSC_KEY_PASSWORD` | Password protecting the `.p12` file. |
| `APPLE_API_KEY_BASE64` | Base64 single-line encoding of the App Store Connect `.p8` key. |
| `APPLE_API_KEY_ID` | App Store Connect API Key ID. |
| `APPLE_API_ISSUER` | App Store Connect API Issuer ID. |

In Keychain Access, check that your Developer ID certificate has its **private key** nested beneath it.
Select the certificate and private key, then use **File → Export Items** to create a password-protected `.p12`.
If the key is missing or macOS will not export it, CI cannot sign with this certificate; recover the original
keychain or create a new certificate with its private key.

Also create a **Team API Key** with the Developer role in App Store Connect and download the `.p8` file
(Apple only allows one download). Encode both files locally; do not put them in the repository:

```bash
base64 -i "/secure/path/DeveloperID.p12" | tr -d '\\n'
base64 -i "/secure/path/AuthKey_KEYID.p8" | tr -d '\\n'
```

Paste each result directly into its matching GitHub secret. The workflow imports the `.p12` into a temporary
keychain, signs and notarizes macOS builds, staples the DMGs, and removes the temporary `.p8` at the end of
the job. `GDWMirrorNotary` is a profile in your local keychain; it is **not** used or transferred to GitHub.

**To run the workflow for the current version**, remember to bump `version` in `package.json` first; the tag
must match (`version: 0.2.3` → tag `v0.2.3`).

## Development

```bash
npm run dev          # dual-role app with visible engine window and devtools
```

### Environment variables

Useful for automated tests and debugging:

| Variable | Effect |
| --- | --- |
| `MIRROR_HTTP_PORT` | Signaling port (default 47820) |
| `MIRROR_DISC_PORT` | Discovery port (default 47821) |
| `MIRROR_AUTOSTART=1` | The host starts sharing on its own |
| `MIRROR_TEST_CODE` | Fixes the connection code |
| `MIRROR_REQUIRE_CODE=1` | Starts requiring a code |
| `MIRROR_AUDIO=1` | Starts with system audio |
| `MIRROR_PROFILE` | Initial profile: `sharp`, `smooth`, `high` or `eco` |
| `MIRROR_SCALE` | Sent resolution: `native`, `half` or `hd` |
| `MIRROR_DISPLAY` | id of the screen to share |
| `MIRROR_FPS` | Overrides the `high` profile's fps |
| `MIRROR_BITRATE` | Overrides the `high` profile's bitrate |
| `MIRROR_LOG_STATS=1` | Prints encoder stats to console |
| `MIRROR_AUTOCONNECT=host:port:code` | The receiver connects on its own |
| `MIRROR_CUSTOM_FRAME=1` | Forces the custom frame on macOS (for testing) |

### Quick smoke test

```bash
# in one terminal
MIRROR_AUTOSTART=1 npm start

# in another
curl -s http://127.0.0.1:47820/hello
```

Expected response:

```json
{"app":"gdwmirror","version":"0.2.3","name":"...","sharing":true,"requireCode":false}
```

## Project structure

```
src/
  main.js            starts the default role in the dual app
  entry-dual.js      packaged dual-role app entrypoint
  host-main.js       system tray, panel, HTTP signaling, share/view actions
  host.html/.js      capture and WebRTC engine (renderer)
  preload-host.js    engine IPC bridge
  menu.html/.js      menu bar popover with expandable blocks
  preload-menu.js    popover IPC bridge
  pairing.html       "Connection details" window (on demand)
  preload-panel.js   that window's IPC bridge
  viewer-main.js     remote viewer window, discovery, network IPC
  viewer.html/.js    connection and playback UI
  preload-viewer.js  viewer IPC bridge
  icons.js           tray and app icons
  assets/            Windows system tray graphics
  fit.js             window fit-to-aspect-ratio math
  net.js             HTTP client and network utilities
builder/
  dual.yml           macOS and Windows dual-app packaging config
  RELEASE-NOTES.md   release notes (used by the workflow)
build/
  icon.png           app icon
  entitlements.mac.plist  Hardened Runtime and notarization entitlements
.github/
  workflows/release.yml   automatic build and publishing
```

## Known limitations

- **Single receiver.** The current version serves one connection at a time.
- **fps above 90 don't work.** The macOS encoder stops emitting frames with `maxFramerate` near 120. The
  ceiling is 90.
- **Protected audio (DRM)** may not be captured.
- **Limited automatic reconnection.** After a connection drops, the app waits 3 seconds, then retries up to six
  times at 1.5-second intervals. If it cannot recover, it shows a message and you must reconnect manually.
- **No window selection.** Full screen only (not a single app).
- **macOS arm64 + x64 and Windows x64** in the published binaries. No Windows ARM64.
- **Receiving on the same Mac** drops to ~60 fps because decoding competes with encoding. On a separate
  machine it doesn't happen.

## Security

- **Everything is local.** Signaling is HTTP on the LAN and media is direct WebRTC P2P. No intermediary
  servers or telemetry.
- **The connection code is off by default**, because the use case is a trusted home or office network.
  **With the code off, any machine on your local network can connect to your screen.** If you share a
  network with strangers, enable it from the *Connection* block.
- **With the code enabled**, every signaling request requires it, and 8 failures from the same IP block for
  30 seconds.
- **Media is not encrypted** in the current version: WebRTC uses DTLS-SRTP, which encrypts transport, but
  there's no receiver authentication beyond the code.
- The app **asks for no accessibility, input control, or automation permissions**, only screen recording.
  This is consistent with its design: it doesn't control the Mac.

## Distribution and signing

Binaries are published in **GitHub Releases**, not the repository:

- GitHub rejects files over **100 MB** in the repo tree. App packages can exceed this limit.
- Putting binaries that size in git would make cloning extremely slow.
- Releases accept up to 2 GB per file and give version history.

### Signing

| Platform | Status | Consequence |
| --- | --- | --- |
| macOS | **Signed and notarized** | Signed with Developer ID; the ticket is stapled to the app and DMG. The ZIP contains the notarized app. |
| Windows — portable app | **Unsigned** | SmartScreen may show a warning when the downloaded file is run. |
| Windows — Microsoft Store | **Signed by Microsoft Store** | The Store signs the package during publication. |

Verified on Apple Silicon macOS: `codesign --verify --deep --strict`, `xcrun stapler validate`, and Gatekeeper (`spctl --assess`) accept the app; the DMG also validates with `stapler`. A ZIP cannot have a ticket stapled directly, but contains the notarized app.

Developer ID signing and macOS notarization are configured for local builds. GitHub Actions releases still need signing credentials/certificate configured for CI; Windows separately needs its own code-signing certificate.

Files obtained via `git clone`, `curl`, or `gh release download` **carry no quarantine**; browser downloads may carry it.

## Roadmap

- [x] Prefer AV1 and HEVC when the host advertises them; WebRTC negotiates only mutually supported codecs and retains H.264/VP9/VP8 as fallbacks.
- [x] Limited automatic reconnection after connection loss.
- [ ] Window selection in addition to full screen.
- [ ] Multiple simultaneous receivers.
- [x] Local macOS signing and notarization; configure signing credentials for GitHub Actions.
- [ ] Windows code signing.
- [ ] Windows ARM64 build.
- [ ] Audio gain control (attenuate what's sent).

## Author

**José Cruz Chávez**

- Personal site: [josecruzchavez.com](https://josecruzchavez.com)
- Developments and applications (GDW): [gdw.mx](https://gdw.mx)
- Buy me a coffee: [paypal.me/gestiondigitalweb](https://www.paypal.com/paypalme/gestiondigitalweb)

Developed with AI assistance.

## License

All rights reserved. See [LICENSE](LICENSE).

The code is published for consultation and personal use. Commercial redistribution and publication of
derived binaries are not authorized without permission.

## Search terms

If you got here searching for any of these, this is the project:

**In English**

`screen mirror` · `screen mirroring` · `mirror screen` · `mirror mac to windows` · `mirror windows to mac` ·
`mac screen to windows` · `windows screen to mac` · `share mac screen on windows` · `share windows screen on mac` ·
`mac to windows screen sharing` · `windows to mac screen sharing` · `mac as second screen windows` · `windows as second screen mac` · `display mirroring` · `screen casting lan` ·
`share mac screen in google meet` · `share mac screen in zoom` · `mac screen capture for obs` ·
`airplay alternative for windows` · `sunshine moonlight alternative for presentations` ·
`low latency screen mirror lan` · `webrtc screen sharing desktop`

**In Spanish**

`espejo de pantalla` · `espejo de pantalla mac a windows` · `espejo de pantalla windows a mac` ·
`compartir pantalla de mac en windows` · `compartir pantalla de windows en mac` ·
`ver pantalla de mac en pc` · `ver pantalla de windows en mac` · `mandar pantalla de mac a windows` · `mandar pantalla de windows a mac` ·
`duplicar pantalla mac en windows` · `duplicar pantalla windows en mac` · `compartir pantalla mac en meet` · `compartir pantalla mac en zoom` ·
`pantalla de mac en obs` · `espejo mac sin cables` · `transmitir pantalla mac a pc por red local` ·
`alternativa a airplay para windows`

**Technical**

`macOS ↔ Windows` · `two-way screen mirroring` · `LAN screen mirror` · `WebRTC screen capture` · `ScreenCaptureKit mirror` ·
`H.264 screen mirror` · `no drivers screen mirror` · `zero install screen mirror` ·
`Electron screen mirror app`

> This project is **not** remote control, remote desktop (RDP/VNC), game streaming
> (Moonlight/Parsec), or AirPlay. It is a **two-way screen mirror** between macOS and Windows,
> designed for presenting and collaboration.
