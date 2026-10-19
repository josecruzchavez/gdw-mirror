# GDW Mirror 0.2.1

Comparte la pantalla de tu Mac en llamadas y conferencias desde una PC con Windows, a resolución nativa y
por red local.

## Versión firmada para Windows

También puedes instalar **GDW Mirror View** desde [Microsoft Store](https://apps.microsoft.com/store/detail/9N4WCWF6CR0B?cid=DevShareMCLPCS).
La versión de la Store está firmada y se actualiza desde Microsoft. El `.exe` portable de esta release es una descarga independiente y no está firmado.

## Novedades en 0.2.1

- **Arreglo del permiso de grabación de pantalla**: al pulsar "Compartir pantalla", la app dispara el prompt
  nativo y aparece en *Ajustes → Privacidad y seguridad → Grabación de pantalla*, sin tener que agregarla
  manualmente.
- **Binario x64 para Mac Intel**, además del arm64 para Apple Silicon.
- **Nuevo icono**: diseño de dos monitores, unificado con el sitio web.
- **Texto del enlace de donación unificado** ("Invítame un café").

## Descargas

| Archivo | Plataforma | Tamaño |
| --- | --- | --- |
| `GDW-Mirror-Host-0.2.1-arm64.zip` | macOS (Apple Silicon) | ~121 MB |
| `GDW-Mirror-Host-0.2.1-x64.zip` | macOS (Intel) | ~128 MB |
| `GDW-Mirror-View-0.2.1-x64-portable.exe` | Windows 10/11 x64 | ~95 MB |

---

## ⚠️ Léelo antes de abrir — los avisos de seguridad son esperados

Los archivos de esta release **no están firmados** con un Developer ID de Apple ni con un certificado de Windows. Al descargar el `.zip` o el `.exe` portable por
el navegador, el sistema añade el atributo de cuarentena (macOS) o Mark-of-the-Web (Windows), y muestra un
aviso la primera vez. **No significa que el archivo esté dañado.** Para instalar la versión firmada para Windows, usa el enlace de Microsoft Store de arriba.

### macOS — "no se puede abrir porque el desarrollador no puede ser verificado"

1. Descomprime el `.zip` → obtienes **GDW Mirror Host.app**.
2. Arrastra la app a **Aplicaciones**.
3. **No hagas doble clic.** Haz **clic derecho sobre la app → Abrir** → confirma **Abrir**.

Si solo aparece *Mover a la papelera*:

- **Ajustes del Sistema → Privacidad y seguridad** → baja hasta el aviso sobre *GDW Mirror Host* → **Abrir
  igualmente**.

O en Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/GDW Mirror Host.app"
```

4. La app no abre ventanas: aparece un **ícono de monitor en la barra de estado**.
5. Al compartir por primera vez, concede **Grabación de pantalla** en
   *Ajustes → Privacidad y seguridad → Grabación de pantalla* y **reinicia la app**.

### Windows — "Windows protegió tu PC"

1. Pulsa **Más información** → **Ejecutar de todos modos**.
2. La primera vez, permite la app en **redes privadas** (necesario para descubrir la Mac).

### Alternativa sin ningún aviso

Descarga con `gh` o `curl` (no pasan por el navegador y no añaden cuarentena):

```bash
gh release download v0.2.1 --repo josecruzchavez/gdw-mirror
```

O compila desde el código: los binarios locales no llevan cuarentena.

---

## Qué incluye

### Captura y calidad

- Captura a **resolución nativa**: una pantalla 4K envía 3840×2160.
- **FPS adaptados al panel**: lee el refresco real y no pide más de lo que el hardware entrega.
- Perfiles: Nítido (30 fps / 60 Mbps), Fluido (60 fps / 80 Mbps), Alto (90 fps / 100 Mbps), Económico
  (30 fps / 12 Mbps).
- **Resolución enviada**: nativa, mitad o 1080p, con reescalado por GPU (`scaleResolutionDownBy`), sin coste
  de CPU.
- Bitrate calculado sobre el área realmente enviada, hasta 250 Mbps.
- Prioridad de resolución: si la red aprieta, bajan los fps antes que la resolución.

### Audio

- Audio del sistema por `loopback`, **sin drivers virtuales** (nada de BlackHole ni Soundflower).
- Interruptor para activarlo o desactivarlo en caliente.
- Sin procesamiento de micrófono (AGC, supresión de ruido y cancelación de eco desactivados), que en audio
  de sistema volvía el nivel impredecible.

### Conexión

- **Descubrimiento automático** por UDP broadcast.
- **Código de conexión opcional**, desactivado por defecto.
- Bloqueo de 30 s tras 8 intentos fallidos desde la misma IP.
- WebRTC P2P directo, sin STUN ni TURN. Nada sale de la red local.

### Interfaz

- **macOS**: barra de estado, sin ventanas flotantes. Panel con bloques desplegables que **permanece abierto**
  al elegir una opción.
- **Windows**: ventana sin barra de título, con controles propios pequeños y semitransparentes que se atenúan
  sin foco. Se **redimensiona sola** al aspect ratio de la señal.

---

## Mediciones incluidas en esta versión

| Prueba | Resultado |
| --- | --- |
| Captura 4K nativa | 51 fps codificados, 3840×2160 |
| Captura 4K escalada a 1080p | 58 fps, 1920×1080 exacto |
| Captura Retina interna | 3024×1964 a 82–83 fps (perfil Alto) |
| `maxFramerate` 119 / 120 | **0 frames** — por eso el techo es 90 |
| Volumen del Mac 100% → 0% | Nivel capturado constante (−9.0 dBFS) |
| Firma macOS | `codesign --verify` OK, `Sealed Resources version=2` |

---

## Limitaciones

- Un solo receptor a la vez.
- fps por encima de 90 no funcionan (límite del encoder de macOS).
- Solo Apple Silicon y Windows x64 en estos binarios.
- Sin reconexión automática.
- Sin selección de ventana (solo pantalla completa).
- Audio protegido por DRM puede no capturarse.

## Requisitos

- macOS 13+ (probado en macOS 26.7, Apple Silicon)
- Windows 10/11 x64
- Ambos en la misma red local
- Firewall permitiendo la app en redes privadas

## Autor

**José Cruz Chávez** — desarrollado con asistencia de IA para resolver una necesidad concreta: presentar la
pantalla de una Mac desde Windows en Meet o Zoom, sin instalar servicios ni drivers.

- [josecruzchavez.com](https://josecruzchavez.com)
- [gdw.mx](https://gdw.mx)
- [Invítame un café](https://www.paypal.com/paypalme/gestiondigitalweb)

## Verificación de integridad

Los SHA-256 de los archivos están en `SHA256SUMS.txt` en esta misma release:

```bash
shasum -a 256 -c SHA256SUMS.txt        # macOS / Linux
certutil -hashfile <archivo> SHA256    # Windows
```
