# GDW Mirror 0.2.3

Comparte la pantalla entre equipos macOS y Windows con una sola aplicación dual, conectada por la red local.

## Novedades en 0.2.3

- **Una sola aplicación para ambos roles:** desde la barra de estado o bandeja puedes compartir la pantalla local o abrir el visor remoto.
- En Windows, el visor remoto se abre cuando se solicita y permite compartir la pantalla de ese equipo.
- **Reconexión automática** ante desconexiones temporales, con aviso cuando se agotan los intentos.
- **Códecs de video:** prioridad a AV1 y HEVC cuando ambos equipos los admiten, manteniendo alternativas compatibles.
- Aplicación disponible para macOS Apple Silicon/Intel y Windows x64.

## Versión firmada para Windows

También puedes instalar **[GDW Mirror View desde Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX)**. La versión de la Store está firmada y se actualiza desde Microsoft. El `.exe` portable de esta release es una descarga independiente y no está firmado.

## Descargas

| Archivo | Plataforma |
| --- | --- |
| `GDW-Mirror-0.2.3-arm64.zip` / `.dmg` | macOS Apple Silicon |
| `GDW-Mirror-0.2.3-x64.zip` / `.dmg` | macOS Intel |
| `GDW-Mirror-0.2.3-x64-portable.exe` | Windows x64, portable |

## Firma y seguridad

La aplicación de macOS se firma con Developer ID y se notariza con Apple. El DMG lleva el ticket de notarización adjunto; el ZIP contiene la app notarizada. Windows no está firmado con un certificado de firma de código, por lo que SmartScreen puede mostrar un aviso. Permite conexiones en redes privadas para el descubrimiento local.

## English

For the signed Windows version, install **GDW Mirror View** from [Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX). The Store version is signed and updated by Microsoft. The portable `.exe` in this release is a separate, unsigned download.

GDW Mirror is one dual-role app for macOS and Windows. From the menu bar or system tray, share the local screen or open the remote viewer over the local network.

- **One app for both roles:** the Windows viewer opens on demand and can also share that computer's screen.
- **Automatic reconnection** after temporary disconnects, with a notice when retries are exhausted.
- **Video codecs:** AV1 and HEVC are preferred when supported by both devices, with compatible fallbacks.
- Available for macOS Apple Silicon/Intel and Windows x64.

| File | Platform |
| --- | --- |
| `GDW-Mirror-0.2.3-arm64.zip` / `.dmg` | macOS Apple Silicon |
| `GDW-Mirror-0.2.3-x64.zip` / `.dmg` | macOS Intel |
| `GDW-Mirror-0.2.3-x64-portable.exe` | Windows x64 portable |

For the signed Windows version, install **[GDW Mirror View from Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX)**. The Store version is signed and updated by Microsoft. The portable `.exe` in this release is a separate, unsigned download.

The macOS app is signed with Developer ID and notarized by Apple. The DMG has the notarization ticket stapled; the ZIP contains the notarized app. Windows is not signed with a code-signing certificate, so SmartScreen may show a warning. Allow the app through private-network firewall prompts so local device discovery can work.
