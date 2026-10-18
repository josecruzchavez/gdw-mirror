# GDW Mirror

**Espejo de pantalla (screen mirror) de macOS a Windows por red local.** Comparte la pantalla de tu Mac en
llamadas y conferencias desde una PC, a resolución nativa.

> **Mirror / espejo** es la palabra clave: no es control remoto ni escritorio remoto. Es un **screen
> mirror** — la Mac se ve en Windows, sin mover su ratón ni su teclado.

Sin control remoto, sin gamepads, sin drivers, sin servicios instalados, sin nube, sin cuentas.

- **GDW Mirror Host** (macOS): vive en la barra de estado, captura y codifica.
- **GDW Mirror View** (Windows): ventana única que recibe y muestra. `.exe` portable.

> **This document is also available in English:** [README.en.md](README.en.md)

---

## Índice

- [Términos de búsqueda](#términos-de-búsqueda)
- [Origen del proyecto](#origen-del-proyecto)
- [Qué problema resuelve](#qué-problema-resuelve)
- [Por qué no Sunshine / Moonlight](#por-qué-no-sunshine--moonlight)
- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
  - [Opción A: descargar desde GitHub Releases](#opción-a-descargar-desde-github-releases)
  - [Opción B: clonar el repositorio](#opción-b-clonar-el-repositorio)
  - [Opción C: compilar desde el código](#opción-c-compilar-desde-el-código)
- [Uso](#uso)
  - [En la Mac](#1-en-la-mac)
  - [En Windows](#2-en-windows)
  - [Para Meet / Zoom / OBS](#3-para-meet--zoom--obs)
- [Calidad de imagen](#calidad-de-imagen)
  - [Qué se prioriza](#qué-se-prioriza)
  - [Sobre los fps y ProMotion](#sobre-los-fps-y-promotion)
  - [Resolución nativa vs escalada](#resolución-nativa-vs-escalada)
- [Audio](#audio)
- [Cómo se conectan](#cómo-se-conectan)
- [Solución de problemas](#solución-de-problemas)
- [Compilar](#compilar)
- [Desarrollo](#desarrollo)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Seguridad](#seguridad)
- [Distribución y firma](#distribución-y-firma)
- [Hoja de ruta](#hoja-de-ruta)
- [Autor](#autor)
- [Licencia](#licencia)

---

## Términos de búsqueda

Si llegaste aquí buscando alguna de estas cosas, este es el proyecto:

**En español**

`espejo de pantalla` · `espejo de pantalla mac a windows` · `compartir pantalla de mac en windows` ·
`ver pantalla de mac en pc` · `mandar pantalla de mac a windows` · `duplicar pantalla mac en windows` ·
`pantalla extendida mac windows` · `compartir pantalla mac en meet` · `compartir pantalla mac en zoom` ·
`pantalla de mac en obs` · `espejo mac sin cables` · `transmitir pantalla mac a pc por red local` ·
`alternativa a airplay para windows`

**In English**

`screen mirror` · `screen mirroring` · `mirror screen` · `mirror mac to windows` ·
`mac screen to windows` · `share mac screen on windows` · `mac to windows screen sharing` ·
`mac as second screen windows` · `display mirroring` · `screen casting lan` ·
`share mac screen in google meet` · `share mac screen in zoom` · `mac screen capture for obs` ·
`airplay alternative for windows` · `sunshine moonlight alternative for presentations` ·
`low latency screen mirror lan` · `webrtc screen sharing desktop`

**Técnico**

`macOS a Windows` · `LAN screen mirror` · `WebRTC screen capture` · `ScreenCaptureKit mirror` ·
`H.264 screen mirror` · `no drivers screen mirror` · `zero install screen mirror` ·
`Electron screen mirror app`

> Este proyecto **no** es: control remoto, escritorio remoto (RDP/VNC), streaming de juegos
> (Moonlight/Parsec), ni AirPlay. Es específicamente un **espejo de pantalla de un solo sentido**,
> Mac → Windows, para presentar.

---

## Origen del proyecto

Este proyecto nació de una necesidad muy concreta: **dar una conferencia o una clase por Meet o Zoom
compartiendo la pantalla de una Mac, pero operando desde un PC con Windows**, conservando la resolución
nativa de la Mac.

Las alternativas existentes no servían para ese caso:

- **Compartir desde el navegador de la Mac** degrada la imagen y ata la presentación al equipo que tiene la
  pantalla buena. Si la Mac está en un atril o conectada a un proyector, no puedes además operar la llamada
  desde ahí.
- **Las suites de streaming de escritorio** (Sunshine/Moonlight) están pensadas para juegos: instalan
  servicios permanentes, drivers virtuales de gamepad y componentes de captura que después hay que mantener
  y que pueden afectar la estabilidad del sistema. Para presentar diapositivas es exceso de maquinaria.
- **Herramientas de escritorio remoto** (VNC, AnyDesk, TeamViewer) añaden control de teclado y ratón, que
  aquí no se quiere, y suelen comprimir agresivamente el texto.

La solución se acota a un solo camino: **capturar → codificar → transportar → mostrar**. Nada más.

Fue desarrollada **con asistencia de IA**, partiendo de esa necesidad y no de una idea genérica de producto:
cada decisión técnica (resolución nativa, fps adaptados al panel, audio del sistema, cero instalación) se
tomó para ese caso de uso concreto.

## Qué problema resuelve

Eres ponente en una videollamada. Tienes:

- una **Mac** con la pantalla buena, el material y las diapositivas;
- una **PC con Windows** con la cámara, el micrófono, el monitor grande y el cliente de Meet/Zoom.

Quieres presentar **tu pantalla de la Mac** dentro de la reunión que corre en Windows, con calidad
suficiente para que el texto se lea.

GDW Mirror hace exactamente eso: la Mac captura su pantalla en resolución nativa y la envía por la red
local; Windows la muestra en una ventana que puedes capturar con OBS o compartir directamente en la reunión.

**No hace** control remoto de la Mac. No mueve el ratón ni el teclado. No instala servicios ni drivers.

## Por qué no Sunshine / Moonlight

Sunshine funciona bien, pero está diseñado para juegos:

| | Sunshine / Moonlight | GDW Mirror |
| --- | --- | --- |
| Instalación | Servicio permanente + drivers virtuales | Un `.exe` portable y una `.app` |
| Control de gamepad | Sí, drivers virtuales | No |
| Configuración | Varias pantallas de ajustes | Un panel de 6 bloques |
| Descubrimiento | Manual (IP + PIN) | Automático por UDP broadcast |
| Enfoque de calidad | Latencia mínima | Resolución máxima |
| Audio | Configuración adicional | Un interruptor |

Si quieres jugar, usa Sunshine. Si quieres presentar, esto.

## Características

- **Resolución nativa real.** Captura el framebuffer físico: una pantalla 4K envía 3840×2160, no 1080p
  reescalado.
- **FPS adaptados al panel.** Lee el refresco real de la pantalla y no pide más de lo que el hardware
  entrega.
- **Audio del sistema** con un interruptor, sin instalar drivers de audio virtual.
- **Descubrimiento automático** en la red local. Sin escribir IPs.
- **Código de conexión opcional** — desactivado por defecto, activable en un clic.
- **Cero instalación.** El receptor es un `.exe` portable.
- **Cero nube.** Nada sale de tu red local.
- **Selección de pantalla y de resolución enviada** desde el panel.
- **Barra de estado nativa en macOS** sin ventanas flotantes.
- **Ventana sin bordes en Windows** que se ajusta sola al aspect ratio de la señal.

## Requisitos

| | Mínimo | Probado en |
| --- | --- | --- |
| macOS | 13 (Ventura) | macOS 26.7, Apple Silicon |
| Windows | 10 x64 | Windows 11 x64 |
| Red | Misma LAN | Ethernet y WiFi 6 |

- **Apple Silicon**: los binarios actuales son `arm64`. Para Macs Intel hay que recompilar con
  `--mac --x64`.
- **Windows**: solo x64. No hay build para ARM64.
- Ambos equipos deben poderse ver por la red local (sin aislamiento de clientes).

## Instalación

### Opción A: descargar desde GitHub Releases

Ve a la sección [**Releases**](../../releases) y descarga los dos archivos:

| Archivo | Para |
| --- | --- |
| `GDW-Mirror-Host-<version>-arm64.zip` | Mac |
| `GDW-Mirror-View-<version>-x64-portable.exe` | Windows |

> **Aviso sobre los avisos de seguridad.** La app no está firmada con un Developer ID de Apple ni con un
> certificado de Windows. Los descargará tu navegador, y **el navegador añade el atributo de cuarentena**
> (macOS) o Mark-of-the-Web (Windows). Eso hace que el sistema muestre un aviso la primera vez. **Es
> esperado y no indica que el archivo esté dañado.** Los pasos exactos están abajo.

#### macOS

1. Descomprime `GDW-Mirror-Host-<version>-arm64.zip`. Se obtiene **GDW Mirror Host.app**.
2. Arrastra la app a **Aplicaciones** (recomendado, no obligatorio).
3. La primera vez **no hagas doble clic**. Haz **clic derecho sobre la app → Abrir**, y confirma
   *Abrir* en el diálogo.

   Si macOS solo ofrece *Mover a la papelera*, usa una de estas dos alternativas:

   - **Ajustes del Sistema → Privacidad y seguridad**, baja hasta el aviso sobre *GDW Mirror Host* y pulsa
     **Abrir igualmente**.
   - O en Terminal:
     ```bash
     xattr -dr com.apple.quarantine "/Applications/GDW Mirror Host.app"
     ```

4. La app **no abre ninguna ventana**: aparece un ícono de monitor en la barra de estado.
5. La primera vez que compartas pantalla, macOS pedirá **Grabación de pantalla**:
   *Ajustes del Sistema → Privacidad y seguridad → Grabación de pantalla* → activa **GDW Mirror Host**.
   El sistema pedirá **reiniciar la app**; ciérrala desde el panel (*Salir de GDW Mirror*) y vuelve a abrirla.

#### Windows

1. Copia `GDW-Mirror-View-<version>-x64-portable.exe` donde quieras. **No instala nada.**
2. Doble clic.
3. Si aparece **"Windows protegió tu PC"**: pulsa **Más información** → **Ejecutar de todos modos**.
4. La primera vez, Windows preguntará si permitir la app en redes privadas → **Permitir** (necesario para
   descubrir la Mac).

### Opción B: clonar el repositorio

Si prefieres el código y compilar tú mismo:

```bash
git clone https://github.com/josecruzchavez/gdw-mirror.git
cd gdw-mirror
npm install
```

Los binarios no están en el repositorio (ver [Distribución y firma](#distribución-y-firma)); se compilan
con los comandos de [Compilar](#compilar).

**Ventaja:** los archivos compilados localmente **no llevan cuarentena** y abren sin ningún aviso.

### Opción C: compilar desde el código

Ver [Compilar](#compilar). Es la única vía para Macs Intel.

## Uso

### 1. En la Mac

1. Abre **GDW Mirror Host**. Aparece un ícono de monitor en la barra de estado.
2. Clic en el ícono → se abre un **panel con bloques**. Pulsa **Compartir pantalla**.
3. El ícono se pone rojo y muestra la resolución activa.
4. Si necesitas los datos de conexión, abre el bloque **Conexión** → **Detalles de conexión…**

El panel es un popover propio, **no un menú nativo**: al elegir una opción **permanece abierto**, así puedes
cambiar varias cosas seguidas sin reabrirlo. Cada bloque se queda desplegado hasta que lo cierres. Se cierra
al hacer clic fuera, con `Esc`, o al volver a pulsar el ícono.

| Bloque | Qué controla |
| --- | --- |
| **Pantalla a compartir** | Cuál monitor compartir. Nunca se comparten dos a la vez. |
| **Perfil de calidad** | Nítido (30 fps, 60 Mbps) · Fluido (60 fps, 80 Mbps) · Alto (90 fps, 100 Mbps) · Económico (30 fps, 12 Mbps) |
| **Resolución enviada** | Nativa · Escalada a la mitad · Escalada a 1080p |
| **Audio del sistema** | Incluir o no el audio. Se puede cambiar en caliente. |
| **Conexión** | Requerir código de 6 dígitos (desactivado por defecto) y ver los detalles. |
| **Acerca de** | Autor, descripción y enlaces. |

En el pie: *Abrir al iniciar sesión*, *Permisos de grabación de pantalla…* y *Salir de GDW Mirror*.

### 2. En Windows

1. Ejecuta `GDW-Mirror-View-<version>-x64-portable.exe`.
2. El Mac aparece en **Equipos en la red**. Si no aparece, escribe la IP a mano (la muestra el bloque
   *Conexión* de la Mac).
3. Pulsa **Conectar**. Si el Mac tiene activado *Requerir código*, teclea el código de 6 dígitos; si no,
   conecta directo.
4. La ventana **se redimensiona sola** al aspect ratio de la señal recibida.
5. Arriba de la imagen: resolución, fps, bitrate y latencia. Botones **Siempre visible**, **Pantalla
   completa** y **Desconectar**.

La ventana no tiene barra de título nativa. Los controles (minimizar, maximizar, cerrar) son botones propios,
pequeños y semitransparentes: se atenúan cuando la ventana pierde el foco y vuelven a plena opacidad al
enfocarla. Se ocultan en pantalla completa.

**Atajos:** `F` alterna pantalla completa · `Esc` la quita.

### 3. Para Meet / Zoom / OBS

La mejor calidad se obtiene **pasando la imagen por OBS** en lugar de compartir la ventana directamente:

1. En Windows, abre **OBS**.
2. Fuente → **Captura de ventana** → elige la ventana de *GDW Mirror View*.
3. Clic derecho en la fuente → **Transformar → Ajustar a la pantalla**.
4. **Iniciar cámara virtual**.
5. En Meet/Zoom elige **OBS Virtual Camera** como cámara.

Así entregas 1080p60 limpio, sin la doble recompresión de compartir ventana, y puedes usar escenas,
transiciones y grabación.

Si prefieres lo simple, **compartir la ventana de GDW Mirror View directamente también funciona**. Meet y
Zoom recomprimen a ~1080p de todos modos, así que la ganancia de OBS está en controlar la escena, no en
resolución.

**Audio:** durante la llamada usa el **micrófono de Windows**. El audio del sistema que llega por el espejo
solo contiene lo que reproduce la Mac, no tu voz.

## Calidad de imagen

### Qué se prioriza

La resolución. La pista de video se marca con `contentHint = "detail"` y el encoder usa
`degradationPreference = "maintain-resolution"`: si la red aprieta, **bajan los fps antes que la
resolución**. No hay reescalado en el camino; se envía lo que la pantalla produce (salvo que elijas
explícitamente *Resolución enviada* escalada).

### Sobre los fps y ProMotion

`getDisplayMedia` **no** usa el refresco del panel: sin constraints entrega 30 fps. Se pidió el techo
explícitamente y se midió en un MacBook Pro con panel de 120 Hz:

| Configuración | fps reales capturados |
| --- | --- |
| sin constraints | 29.4 |
| `ideal: 60` | 57.2 |
| `ideal: 90` | 82–83 |
| `ideal: 120` | 109.7 (captura) |
| `maxFramerate: 120` en el sender | **0 frames — el encoder no emite nada** |
| `maxFramerate: 119` en el sender | **0 frames** |
| `maxFramerate: 90` en el sender | 82–83 ✅ |
| `maxFramerate: 60` en el sender | 57 ✅ |

Tres conclusiones:

1. **Hay un límite duro cerca de 120** entre `maxFramerate` y el encoder de macOS: por encima de ~90 el
   encoder no produce frames. Por eso el perfil más alto es **90 fps**.
2. **ProMotion es adaptativo.** La captura es *change-driven*: si la pantalla está quieta no hay frames
   nuevos. El fps del panel es un techo, no una tasa garantizada.
3. **El fps efectivo se recorta al físico de la pantalla.** Si pides 90 fps y la pantalla es de 60 Hz, el
   host baja el techo a 60 en lugar de quedarse sin frames.

### Resolución nativa vs escalada

`getDisplayMedia` entrega el **framebuffer físico**, no el tamaño lógico. Una pantalla 4K configurada como
"se ve como 1920×1080" (escala 200%) informa `bounds = 1920×1080` con `scaleFactor = 2`, y la captura sale a
**3840×2160**. El bloque *Pantalla a compartir* lo muestra: `Pantalla 2 · 3840×2160 · vista 1920×1080`.

Para eso existe *Resolución enviada*:

| Modo | Envío con una pantalla 4K | Cuándo usarlo |
| --- | --- | --- |
| Nativa | 3840×2160 | Leer texto muy pequeño, mostrar detalles finos |
| Escalada a la mitad | 1920×1080 | Uso normal en conferencias: la mitad de ancho de banda |
| Escalada a 1080p | 1920×1080 (o menos) | Cuando la red no es buena |

El reescalado lo hace la GPU mediante `scaleResolutionDownBy` en el encoder: **no cuesta CPU adicional** y
la captura sigue siendo nativa. Al escalar a 1080p baja también el techo de bitrate, porque se calcula sobre
la resolución que realmente se envía.

El bitrate se ajusta solo según el área enviada: por encima de 2,5 Mpíxeles el techo sube
proporcionalmente, con un máximo de 250 Mbps para no saturar la red local.

> **Aviso técnico:** `getSettings()` sobre la pista de captura en macOS **no es fiable**. Reporta la
> resolución física de otra pantalla, no la que se está capturando. Medido: capturando la pantalla interna
> (3024×1964) reportaba 3840×2160. Por eso el host toma las dimensiones de la pantalla elegida desde el
> proceso principal (`screen.getAllDisplays()`) y las envía al motor; no las lee del track.

## Audio

El audio del sistema se captura con el modo `loopback` de Chromium. No requiere BlackHole, Soundflower ni
ningún driver de audio virtual.

### El volumen del Mac no afecta lo que se envía

Medido con un tono de 440 Hz y un analizador sobre la pista capturada:

| Volumen del Mac | Pico capturado (dBFS) |
| --- | --- |
| 100% | −9.0 |
| 73% | −9.0 |
| 50% | −9.0 |
| 20% | −9.0 |
| 0% | −9.0 |

**El tap es previo al atenuador de salida**: se captura a nivel pleno aunque el Mac esté en silencio. En el
otro extremo, suena igual con el volumen del Mac al 0% o al 100%. El volumen se controla en Windows.

Además se desactivan `autoGainControl`, `noiseSuppression` y `echoCancellation`, que Chromium aplica por
defecto (pensados para micrófono). Con el AGC activo el nivel se volvía impredecible: en la medición, 100%
podía sonar más bajo que 73%.

**Limitación:** si una app usa audio protegido (contenido DRM, por ejemplo), puede no capturarse.

## Cómo se conectan

```
GDW Mirror Host (Mac)                     GDW Mirror View (Windows)
  barra de estado                           ventana
  ScreenCaptureKit / getDisplayMedia  ──▶   WebRTC (recibe)
  VideoToolbox H.264                        decodificación por hardware
        │                                          ▲
        └──── HTTP local :47820 (SDP) ─────────────┘
              UDP :47821 (descubrimiento)
```

- **Descubrimiento**: UDP broadcast en el puerto `47821`. El receptor manda `MIRROR_DISCOVER`, el host
  responde con nombre, IP, puerto y si requiere código. Si el broadcast está bloqueado, escribe la IP a mano.
- **Señalización**: HTTP en `0.0.0.0:47820`, solo red local. Rutas `GET /hello`, `POST /offer`,
  `POST /answer`, `POST /bye`. El código de 6 dígitos es **opcional**: por defecto no se exige. Si se activa
  *Requerir código*, toda petición debe llevarlo y 8 fallos desde la misma IP bloquean 30 segundos.
- **Media**: WebRTC P2P directo, sin STUN ni TURN. Los candidatos mDNS de Chromium están desactivados
  (`WebRtcHideLocalIpsWithMdns`), porque Windows sin Bonjour no puede resolver `.local` y la conexión
  fallaría.
- **Códecs**: H.264 (preferido, decodificación por hardware) → RED → ULPFEC. Si el receptor no soporta
  H.264 se negocia VP8/VP9.

Nada sale a internet. No hay servidores intermedios. No hay telemetría.

## Solución de problemas

### La Mac no aparece en la lista de Windows

1. Confirma que ambos están en la **misma red** y que la Mac está compartiendo.
2. Revisa el **firewall de macOS**: debe permitir conexiones entrantes para *GDW Mirror Host*.
3. Escribe la **IP a mano** en Windows. La muestra el bloque *Conexión* de la Mac.
4. Si tu router tiene **aislamiento de clientes / AP isolation**, desactívalo. Los equipos no se ven.

### macOS bloquea la app al abrirla

Esperado en descargas desde el navegador. Ver [Instalación](#opción-a-descargar-desde-github-releases):

```bash
xattr -dr com.apple.quarantine "/Applications/GDW Mirror Host.app"
```

### "GDW Mirror Host no puede grabar la pantalla"

El permiso no está concedido o la app no se reinició después de concederlo:

1. *Ajustes del Sistema → Privacidad y seguridad → Grabación de pantalla*.
2. Activa **GDW Mirror Host**.
3. **Sal** de la app desde el panel y vuelve a abrirla. Sin reiniciar, el permiso no se aplica.

> Nota: al cambiar el bundle ID entre versiones, macOS trata la app como nueva y **vuelve a pedir el
> permiso**. Es una vez por versión mayor.

### Windows muestra "Windows protegió tu PC"

Esperado en descargas desde el navegador: **Más información** → **Ejecutar de todos modos**. Para evitarlo
definitivamente hace falta un certificado de firma de código. Ver [Distribución y firma](#distribución-y-firma).

### Se ve a pocos fps

La captura es **change-driven**: si la pantalla está quieta (una diapositiva estática) no se generan frames
nuevos y el contador baja. Mueve el ratón o pon un video para comprobarlo.

Si con movimiento sigue bajo:

1. Mira el **chip de latencia** en la ventana de Windows y el **bitrate**.
2. Si el perfil es *Alto* (90 fps) y tu pantalla externa es de 60 Hz, el host lo recortará a 60. Es correcto.
3. Prueba **Escalada a 1080p** en lugar de *Nativa*: reduce el ancho de banda a la mitad y multiplica los fps
   disponibles.
4. Con WiFi 2.4 GHz el bitrate se limita mucho. Usa 5 GHz o Ethernet. Si hay caídas, baja al perfil
   *Económico*.

### El video va con retraso acumulado

Suele ser la red, no el encoder. Mira el bitrate: si está muy por debajo del techo del perfil, hay pérdida
de paquetes. Prueba Ethernet en ambos extremos, o baja el perfil.

### La ventana de Windows no se ajusta

El auto-ajuste ocurre al recibir el primer frame con metadatos válidos. Si maximizaste o entraste a pantalla
completa antes, se respeta tu elección y no se redimensiona.

### Conecta pero se queda en "Sin señal"

1. Comprueba que la Mac siga compartiendo (el ícono de la barra debe estar rojo).
2. Revisa el firewall de Windows: debe permitir la app en **redes privadas**.
3. Si usas una VPN, puede estar capturando el tráfico local. Desactívala o excluye la subred.

### La conexión se corta al rato

Perfiles altos con WiFi débil. Baja a *Económico* y comprueba. También puede ser que la Mac entre en
suspensión: la app bloquea el *display sleep* mientras comparte, pero no el *system sleep*.

## Compilar

```bash
npm install

# macOS (barra de estado)
npm run dist:mac

# Windows x64 portable
npm run dist:win
```

Salidas:

- `dist/host/GDW-Mirror-Host-<version>-arm64.zip`
- `dist/viewer/GDW-Mirror-View-<version>-x64-portable.exe`

### Compilar para Mac Intel

El binario por defecto es `arm64`. Para Intel:

```bash
npx electron-builder --config builder/host.yml --mac zip --x64
```

### Compilar en otro sistema

- El `.exe` de Windows **se puede compilar desde macOS** (electron-builder descarga el Electron de Windows).
  Así se generó este proyecto.
- El `.app` de macOS **solo se puede compilar desde macOS**.

### Publicación automática (GitHub Actions)

El repositorio incluye un workflow en [`.github/workflows/release.yml`](.github/workflows/release.yml) que
compila ambas plataformas y publica el release.

**Se dispara de dos formas:**

```bash
# 1. Al empujar un tag
git tag v0.2.1
git push origin v0.2.1

# 2. Manualmente, indicando el tag
gh workflow run release.yml -f tag=v0.2.0
```

**Qué hace:**

| Job | Runner | Acción |
| --- | --- | --- |
| `meta` | ubuntu | Lee la versión de `package.json` y deriva el tag |
| `build-mac` | macos-14 | Compila el host arm64, verifica `codesign --deep --strict` |
| `build-win` | windows-latest | Compila el receptor x64 portable |
| `publish` | ubuntu | Calcula SHA-256 y crea o actualiza el release con `gh` |

El job `publish` es idempotente: si el release ya existe, **reemplaza** los archivos (`--clobber`) en lugar
de fallar. Las notas salen de [`builder/RELEASE-NOTES.md`](builder/RELEASE-NOTES.md) — **actualízalo antes
de cada versión**.

> **Nota técnica:** los comandos de build usan `--publish never`. Sin eso, electron-builder detecta el
> entorno de CI e intenta publicar por su cuenta, fallando con
> `GitHub Personal Access Token is not set`. La publicación la hace el job final con `gh`.

**Para lanzar el workflow sobre la versión actual**, recuerda subir antes el cambio de `version` en
`package.json`; el tag debe coincidir (`version: 0.2.1` → tag `v0.2.1`).

## Desarrollo

```bash
npm run dev:host     # host con la ventana del motor visible y devtools
npm run dev:viewer   # receptor
```

### Variables de entorno

Útiles para pruebas automatizadas y para depurar:

| Variable | Efecto |
| --- | --- |
| `MIRROR_HTTP_PORT` | Puerto de señalización (default 47820) |
| `MIRROR_DISC_PORT` | Puerto de descubrimiento (default 47821) |
| `MIRROR_AUTOSTART=1` | El host empieza a compartir solo |
| `MIRROR_TEST_CODE` | Fija el código de conexión |
| `MIRROR_REQUIRE_CODE=1` | Arranca exigiendo código |
| `MIRROR_AUDIO=1` | Arranca con audio del sistema |
| `MIRROR_PROFILE` | Perfil inicial: `sharp`, `smooth`, `high` o `eco` |
| `MIRROR_SCALE` | Resolución enviada: `native`, `half` o `hd` |
| `MIRROR_DISPLAY` | id de la pantalla a compartir |
| `MIRROR_FPS` | Sobrescribe los fps del perfil `high` |
| `MIRROR_BITRATE` | Sobrescribe el bitrate del perfil `high` |
| `MIRROR_LOG_STATS=1` | Imprime estadísticas del encoder en consola |
| `MIRROR_AUTOCONNECT=host:puerto:codigo` | El receptor conecta solo |
| `MIRROR_CUSTOM_FRAME=1` | Fuerza el marco propio de Windows en macOS (para probar) |

### Prueba rápida de humo

```bash
# en una terminal
MIRROR_AUTOSTART=1 npm run host

# en otra
curl -s http://127.0.0.1:47820/hello
```

Respuesta esperada:

```json
{"app":"gdwmirror","version":"0.2.0","name":"...","sharing":true,"requireCode":false}
```

## Estructura del proyecto

```
src/
  main.js            selector de modo (host / viewer)
  entry-host.js      entrypoint empaquetado del host
  entry-viewer.js    entrypoint empaquetado del receptor
  host-main.js       barra de estado, panel, señalización HTTP, descubrimiento
  host.html/.js      motor de captura y WebRTC (renderer)
  preload-host.js    puente IPC del motor
  menu.html/.js      popover de la barra de estado con bloques desplegables
  preload-menu.js    puente IPC del popover
  pairing.html       ventana de "Detalles de conexión" (bajo demanda)
  preload-panel.js   puente IPC de esa ventana
  viewer-main.js     ventana del receptor, descubrimiento, IPC de red
  viewer.html/.js    UI de conexión y reproducción
  preload-viewer.js  puente IPC del receptor
  icons.js           íconos de barra y app generados por código (PNG)
  fit.js             cálculo del encaje de ventana al aspect ratio
  net.js             cliente HTTP y utilidades de red
builder/
  host.yml           configuración de empaquetado macOS
  viewer.yml         configuración de empaquetado Windows
  RELEASE-NOTES.md   notas del release (las usa el workflow)
build/
  icon.png           ícono de la app
  entitlements.mac.plist  entitlements para la firma ad-hoc
.github/
  workflows/release.yml   compilación y publicación automática
```

## Limitaciones conocidas

- **Un solo receptor.** La versión actual atiende una conexión a la vez.
- **fps por encima de 90 no funcionan.** El encoder de macOS deja de emitir frames con `maxFramerate` cerca
  de 120. El techo es 90.
- **Audio protegido (DRM)** puede no capturarse.
- **Sin reconexión automática.** Si se cae la red, hay que volver a conectar.
- **Sin selección de ventana.** Solo pantalla completa (no una app suelta).
- **Solo Apple Silicon y Windows x64** en los binarios publicados.
- **La recepción en la misma Mac** baja a ~60 fps porque decodificar compite con codificar. En un equipo
  aparte no ocurre.

## Seguridad

- **Todo es local.** La señalización es HTTP en la LAN y el media es WebRTC P2P directo. No hay servidores
  intermedios ni telemetría.
- **El código de conexión está desactivado por defecto**, porque el caso de uso es una red doméstica o de
  oficina de confianza. **Con el código desactivado, cualquier equipo de tu red local puede conectarse a tu
  pantalla.** Si compartes red con desconocidos, actívalo desde el bloque *Conexión*.
- **Con el código activado**, toda petición de señalización lo exige, y 8 fallos desde la misma IP bloquean
  30 segundos.
- **No hay cifrado del media** en la versión actual: WebRTC va con DTLS-SRTP, que cifra el transporte, pero
  no hay autenticación del receptor más allá del código.
- La app **no pide permisos de accesibilidad, control de entrada ni automatización**, solo grabación de
  pantalla. Es coherente con su diseño: no controla la Mac.

## Distribución y firma

Los binarios se publican en **GitHub Releases**, no en el repositorio:

- GitHub rechaza archivos de más de **100 MB** en el árbol del repo. El `.zip` del host pesa ~121 MB.
- Meter binarios de ese tamaño en git haría el clonado lentísimo.
- Releases acepta hasta 2 GB por archivo y da historial de versiones.

### Firma

| Plataforma | Estado | Consecuencia |
| --- | --- | --- |
| macOS | **ad-hoc** (sin Developer ID) | `codesign --verify` pasa. La app abre directo si se copia por USB/AirDrop. Descargada del navegador, Gatekeeper la bloquea una vez. |
| Windows | **Sin firmar** | SmartScreen muestra aviso una vez. |

Verificado: `codesign --verify --deep --strict` devuelve 0 y `Sealed Resources version=2 rules=13 files=10`.

Para eliminar los avisos definitivamente:

- **macOS:** Developer ID de Apple ($99 USD/año) + notarización.
- **Windows:** certificado de firma de código OV (~$220 USD/año) o EV (~$149–349 USD/año).

Los archivos obtenidos por `git clone`, `curl` o `gh release download` **no llevan cuarentena** y abren sin
avisos. Solo los descargados por un navegador la llevan.

## Hoja de ruta

- [ ] HEVC / AV1 cuando el receptor lo soporte.
- [ ] Reconexión automática si se pierde la red.
- [ ] Selección de ventana además de pantalla completa.
- [ ] Varios receptores simultáneos.
- [ ] Firma y notarización.
- [ ] Build para Mac Intel y Windows ARM64.
- [ ] Control de ganancia de audio (atenuar lo que se envía).

## Autor

**José Cruz Chávez**

- Sitio personal: [josecruzchavez.com](https://josecruzchavez.com)
- Desarrollos y aplicaciones (GDW): [gdw.mx](https://gdw.mx)
- Invitar un café: [paypal.me/gestiondigitalweb](https://www.paypal.com/paypalme/gestiondigitalweb)

Desarrollado con asistencia de IA.

## Licencia

Todos los derechos reservados. Ver [LICENSE](LICENSE).

El código se publica para consulta y uso personal. No se autoriza la redistribución comercial ni la
publicación de binarios derivados sin permiso.
