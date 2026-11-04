# GDW Mirror 0.2.4

Comparte la pantalla entre equipos macOS y Windows con una sola aplicación dual, conectada por la red local.

## Novedades en 0.2.4

- En macOS, opción para usar temporalmente el efecto **Escala** del Dock al compartir y restaurar después el efecto original. Puede ayudar a que la animación Genie/Aladino se vea más fluida en el receptor.
- El perfil **Fluido** ahora prioriza mantener los fps cuando el encoder debe adaptarse.
- La opción del efecto del Dock está desactivada por defecto; cambiarla reinicia brevemente el Dock.

## Versión firmada para Windows

También puedes instalar **[GDW Mirror View desde Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX)**. La versión de la Store está firmada y se actualiza desde Microsoft. El `.exe` portable de esta release es una descarga independiente y no está firmado.

## Descargas

| Archivo | Plataforma |
| --- | --- |
| `GDW-Mirror-0.2.4-arm64.zip` / `.dmg` | macOS Apple Silicon |
| `GDW-Mirror-0.2.4-x64.zip` / `.dmg` | macOS Intel |
| `GDW-Mirror-0.2.4-x64-portable.exe` | Windows x64, portable |

## Firma y seguridad

La aplicación de macOS se firma con Developer ID y se notariza con Apple. El DMG lleva el ticket de notarización adjunto; el ZIP contiene la app notarizada. Windows no está firmado con un certificado de firma de código, por lo que SmartScreen puede mostrar un aviso. Permite conexiones en redes privadas para el descubrimiento local.

## English

For the signed Windows version, install **GDW Mirror View** from [Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX). The Store version is signed and updated by Microsoft. The portable `.exe` in this release is a separate, unsigned download.

On macOS, optionally use the Dock's **Scale** minimize effect while sharing. This may make the Genie minimize animation look smoother on the receiving computer; the original Dock effect is restored afterward. The **Smooth** quality profile also prioritizes maintaining frame rate when the encoder adapts.

| File | Platform |
| --- | --- |
| `GDW-Mirror-0.2.4-arm64.zip` / `.dmg` | macOS Apple Silicon |
| `GDW-Mirror-0.2.4-x64.zip` / `.dmg` | macOS Intel |
| `GDW-Mirror-0.2.4-x64-portable.exe` | Windows x64 portable |

For the signed Windows version, install **[GDW Mirror View from Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX)**. The Store version is signed and updated by Microsoft. The portable `.exe` in this release is a separate, unsigned download.

The macOS app is signed with Developer ID and notarized by Apple. The DMG has the notarization ticket stapled; the ZIP contains the notarized app. Windows is not signed with a code-signing certificate, so SmartScreen may show a warning. Allow the app through private-network firewall prompts so local device discovery can work.
