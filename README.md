# GDW Mirror

**Espejo de pantalla entre macOS y Windows por red local.** Comparte lo que ocurre en cualquiera de los dos equipos y míralo en el otro, a resolución nativa.

> **Mirror / espejo** es la palabra clave: no es control remoto ni escritorio remoto. La imagen viaja de un equipo al otro; no se controlan el ratón ni el teclado del equipo que comparte.

Sin control remoto, sin gamepads, sin drivers, sin servicios instalados, sin nube, sin cuentas.

- **Una sola aplicación dual** para macOS y Windows: cualquiera de los equipos puede compartir su pantalla y el otro recibirla, en un solo sentido a la vez. Se ejecuta desde la barra de estado o la bandeja e incluye el visor remoto.

> **This document is also available in English:** [README.en.md](README.en.md)

---

## Índice

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
  - [En macOS](#1-en-macos)
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
- [Términos de búsqueda](#términos-de-búsqueda)

---

---

## Origen del proyecto

Este proyecto nació de una necesidad concreta: **compartir la pantalla de una Mac en un PC con Windows** durante una conferencia o clase, conservando la resolución nativa. La aplicación evolucionó a un diseño dual: ahora cualquiera de los dos equipos puede compartir su pantalla y el otro mostrarla, incluido el flujo de Windows a Mac.

Las alternativas existentes no servían bien para ese caso. La necesidad original definió el proyecto; la aplicación actual ya no está limitada a esa dirección:

- **Compartir desde el navegador de la Mac** degrada la imagen y ata la presentación al equipo que tiene la
  pantalla buena. Si la Mac está en un atril o conectada a un proyector, no puedes además operar la llamada
  desde ahí.
- **Las suites de streaming de escritorio** (Sunshine/Moonlight) están pensadas para juegos: instalan
  servicios permanentes, drivers virtuales de gamepad y componentes de captura que después hay que mantener
  y que pueden afectar la estabilidad del sistema. Para presentar diapositivas es exceso de maquinaria.
- **Herramientas de escritorio remoto** (VNC, AnyDesk, TeamViewer) añaden control de teclado y ratón, que
  aquí no se quiere, y suelen comprimir agresivamente el texto.

La solución se acota a un solo camino —**capturar → codificar → transportar → mostrar**— disponible en cualquiera de las dos direcciones, una transmisión a la vez.

Fue desarrollada **con asistencia de IA**, partiendo de esa necesidad y no de una idea genérica de producto:
cada decisión técnica (resolución nativa, fps adaptados al panel, audio del sistema, cero instalación) se
tomó para ese caso de uso concreto.

## Qué problema resuelve

Eres ponente en una videollamada. Tienes:

- una **Mac** con la pantalla buena, el material y las diapositivas;
- una **PC con Windows** con la cámara, el micrófono, el monitor grande y el cliente de Meet/Zoom.

Puedes presentar la pantalla de la Mac en Windows, o la de Windows en macOS, con calidad suficiente para leer el texto. La dirección de transmisión es independiente de la configuración del equipo y solo puede haber una conexión activa a la vez. El equipo receptor muestra la pantalla en una ventana que puedes capturar con OBS o compartir directamente en la reunión.

**No hace** control remoto. No mueve el ratón ni el teclado del otro equipo. No instala servicios ni drivers.

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
- **Una aplicación para ambos roles.** Comparte la pantalla o recibe la del otro equipo; solo una dirección a la vez.
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

- **Apple Silicon e Intel**: se publican binarios `arm64` (Apple Silicon) y `x64` (Intel).
- **Windows**: solo x64. No hay build para ARM64.
- Ambos equipos deben poderse ver por la red local (sin aislamiento de clientes).

## Instalación

### Opción A: descargar desde GitHub Releases

Ve a [**Releases**](../../releases) para descargar los binarios de macOS y, si prefieres la versión
portable, el `.exe` de Windows:

| Archivo | Para |
| --- | --- |
| `GDW-Mirror-<version>-arm64.zip` y `.dmg` | Mac con Apple Silicon |
| `GDW-Mirror-<version>-x64.zip` y `.dmg` | Mac con Intel |
| `GDW-Mirror-<version>-x64-portable.exe` | Windows (portable, sin firma) |
| [GDW Mirror View en Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX) | Windows (versión firmada) |

> **Aviso de seguridad.** La aplicación para macOS está firmada con Developer ID y notarizada por Apple;
> el `.dmg` también lleva el ticket de notarización adjunto. No debería requerir los pasos de apertura de
> una app no identificada que se describen en tutoriales antiguos. El portable de Windows no está firmado
> con un certificado de Windows, por lo que SmartScreen puede mostrar un aviso.

#### macOS

1. Abre el `.dmg` o descomprime el `.zip` que corresponda a tu Mac (`arm64` para Apple Silicon, `x64` para Intel). Obtendrás **GDW Mirror.app**.
2. Arrastra la app a **Aplicaciones** (recomendado, no obligatorio).
3. Abre **GDW Mirror.app**. Al estar firmada con Developer ID y notarizada, macOS debería aceptarla
   sin tener que omitir Gatekeeper ni quitar manualmente el atributo de cuarentena. Si aparece un aviso,
   no lo ignores: confirma que la descarga proviene del release oficial.

4. La aplicación se inicia en la barra de estado, sin ventana principal. Abre el panel desde el icono para compartir esta pantalla o abrir el visor remoto.
5. La primera vez que compartas pantalla, macOS pedirá **Grabación de pantalla**:
   *Ajustes del Sistema → Privacidad y seguridad → Grabación de pantalla* → activa **GDW Mirror**.
   El sistema pedirá **reiniciar la app**; ciérrala desde el panel (*Salir de GDW Mirror*) y vuelve a abrirla.

#### Windows

Para la versión firmada, instala **[GDW Mirror View desde Microsoft Store](https://apps.microsoft.com/detail/9n4wcwf6cr0b?cid=DevShareMCLPCS&hl=es-MX&gl=MX)**; Microsoft gestiona las actualizaciones. También puedes descargar `GDW-Mirror-<version>-x64-portable.exe` desde GitHub Releases. El ejecutable portable no está firmado y SmartScreen puede mostrar un aviso.

1. Copia el `.exe` portable donde quieras y ejecútalo.
2. Si aparece **"Windows protegió tu PC"**: pulsa **Más información** → **Ejecutar de todos modos**.
3. La primera vez, Windows preguntará si permitir la app en redes privadas → **Permitir** (necesario para descubrir equipos).

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

Ver [Compilar](#compilar).

## Uso

La misma aplicación sirve para compartir una pantalla o verla desde otro equipo. En macOS se abre desde el icono de la barra de estado; en Windows, desde el icono de la bandeja. Selecciona **Compartir pantalla** o **Ver pantalla remota**. El visor se abre en una ventana independiente. No se puede abrir el visor mientras se está compartiendo.

### 1. En macOS

1. Abre **GDW Mirror**. Aparece un ícono de monitor en la barra de estado.
2. Clic en el ícono → se abre un **panel con bloques**. Elige **Compartir pantalla** para enviar la pantalla del Mac, o **Ver pantalla remota** para recibir una transmisión de Windows.
3. Al compartir, el ícono se pone rojo y muestra la resolución activa.
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

1. Abre **GDW Mirror** desde el menú Inicio o ejecuta el `.exe` portable.
2. En la bandeja, selecciona **Compartir pantalla** para enviar la pantalla de Windows, o **Ver pantalla remota** para recibir la pantalla del otro equipo.
3. En el visor, selecciona el equipo que comparte en **Equipos remotos**. Si no aparece, escribe su IP manualmente (la muestra el bloque *Conexión* de quien comparte).
4. Pulsa **Conectar**. Si el equipo que comparte tiene activado *Requerir código*, teclea el código de 6 dígitos; si no,
   conecta directo.
5. La ventana **se redimensiona sola** al aspect ratio de la señal recibida.
6. Arriba de la imagen: resolución, fps, bitrate y latencia. Botones **Siempre visible**, **Pantalla
   completa** y **Desconectar**.

La ventana no tiene barra de título nativa. Los controles (minimizar, maximizar, cerrar) son botones propios,
pequeños y semitransparentes: se atenúan cuando la ventana pierde el foco y vuelven a plena opacidad al
enfocarla. Se ocultan en pantalla completa.

**Atajos:** `F` alterna pantalla completa · `Esc` la quita.


### 3. Para Meet / Zoom / OBS

La mejor calidad se obtiene **pasando la imagen por OBS** en lugar de compartir la ventana directamente:

1. En el equipo que recibirá la imagen, abre **OBS**.
2. Fuente → **Captura de ventana** → elige la ventana de *GDW Mirror*.
3. Clic derecho en la fuente → **Transformar → Ajustar a la pantalla**.
4. **Iniciar cámara virtual**.
5. En Meet/Zoom elige **OBS Virtual Camera** como cámara.

Así entregas 1080p60 limpio, sin la doble recompresión de compartir ventana, y puedes usar escenas,
transiciones y grabación.

Si prefieres lo simple, **compartir la ventana de GDW Mirror directamente también funciona**. Meet y
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
GDW Mirror (Mac)                           GDW Mirror (Windows)
  barra de estado                           ventana
  ScreenCaptureKit / getDisplayMedia  ──▶   WebRTC (recibe)
  VideoToolbox (códec negociado)             decodificación por hardware
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
- **Códecs**: el Host prefiere AV1 → HEVC/H.265 → H.264 → VP9 → VP8 según sus capacidades. WebRTC negocia
  solo los códecs compatibles con ambos equipos; si AV1 o HEVC no están disponibles en el receptor, usa
  una alternativa compatible.
- **Reconexión**: ante una desconexión temporal, el receptor espera 3 segundos y reintenta hasta 6 veces,
  con pausas de 1,5 segundos. Si no logra reconectar, muestra un aviso para volver a conectar manualmente.

Nada sale a internet. No hay servidores intermedios. No hay telemetría.

## Solución de problemas

### El otro equipo no aparece en la lista

1. Confirma que ambos están en la **misma red** y que el equipo remoto está compartiendo.
2. Revisa el firewall de ambos sistemas y permite conexiones entrantes para *GDW Mirror*.
3. Escribe la **IP a mano** en el visor remoto. La muestra el bloque *Conexión* del equipo que comparte.
4. Si tu router tiene **aislamiento de clientes / AP isolation**, desactívalo. Los equipos no se ven.

### macOS bloquea la app al abrirla

Esperado en descargas desde el navegador. Ver [Instalación](#opción-a-descargar-desde-github-releases):

```bash
xattr -dr com.apple.quarantine "/Applications/GDW Mirror.app"
```

### "GDW Mirror no puede grabar la pantalla"

El permiso no está concedido o la app no se reinició después de concederlo:

1. *Ajustes del Sistema → Privacidad y seguridad → Grabación de pantalla*.
2. Activa **GDW Mirror**.
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
npm ci

# macOS (Apple Silicon por defecto; genera ZIP y DMG)
npm run dist:mac

# macOS Intel
npm run dist:mac -- --x64

# Windows x64 (portable)
npm run dist:win

# Paquete Windows para Microsoft Store (.appx / MSIX)
npm run dist:win:store
```

El portable se guarda bajo `dist/dual/`; el paquete de Microsoft Store se guarda bajo `dist/store/`.
Para probar la aplicación desde el código ejecuta `npm run dev`.

### Compilar en otro sistema

- El ejecutable portable de Windows se puede compilar desde macOS.
- El paquete MSIX de Microsoft Store se compila en Windows mediante GitHub Actions.
- Los paquetes de macOS solo se pueden compilar desde macOS.

### Publicación automática (GitHub Actions)

El repositorio incluye un workflow en [`.github/workflows/release.yml`](.github/workflows/release.yml) que
compila ambas plataformas y publica el release.

**Se dispara de dos formas:**

```bash
# 1. Al empujar un tag
git tag v0.2.3
git push origin v0.2.3

# 2. Manualmente, indicando el tag
gh workflow run release.yml -f tag=v0.2.3
```

**Qué hace:**

| Job | Runner | Acción |
| --- | --- | --- |
| `meta` | ubuntu | Lee la versión de `package.json` y deriva el tag |
| `build-mac` | macos-14 | Compila y notariza la aplicación dual `arm64` y `x64` (Intel); verifica la firma |
| `build-win` | windows-latest | Compila la aplicación para Windows x64 en formato portable |
| `publish` | ubuntu | Calcula SHA-256 y crea o actualiza el release con `gh` |

Para generar manualmente el portable usa **Actions → Build Windows portable**. Para generar el paquete
que se carga en Partner Center usa **Actions → Build MSIX for Microsoft Store**; descarga el artefacto
`GDW_Mirror-MSIX` y sube su `.appx`. La Store firma el paquete durante el proceso de publicación.

El job `publish` es idempotente: si el release ya existe, **reemplaza** los archivos (`--clobber`) en lugar
de fallar. Las notas salen de [`builder/RELEASE-NOTES.md`](builder/RELEASE-NOTES.md) — **actualízalo antes
de cada versión**.

> **Nota técnica:** los comandos de build usan `--publish never`. Sin eso, electron-builder detecta el
> entorno de CI e intenta publicar por su cuenta, fallando con
> `GitHub Personal Access Token is not set`. La publicación la hace el job final con `gh`.

#### Configurar firma y notarización de macOS en GitHub Actions

El workflow exige estos **Actions secrets** en *Settings → Secrets and variables → Actions*; no los
incluyas en el repositorio ni los compartas en el chat:

| Secret | Contenido |
| --- | --- |
| `MACOS_CSC_LINK` | Archivo `.p12` del certificado **Developer ID Application y su clave privada**, codificado en Base64 en una sola línea. |
| `MACOS_CSC_KEY_PASSWORD` | Contraseña que protege el archivo `.p12`. |
| `APPLE_API_KEY_BASE64` | Contenido del archivo `.p8` de App Store Connect, codificado en Base64 en una sola línea. |
| `APPLE_API_KEY_ID` | Key ID de la API de App Store Connect. |
| `APPLE_API_ISSUER` | Issuer ID de la API de App Store Connect. |

En Acceso a Llaveros, comprueba que el certificado Developer ID tiene su **clave privada** debajo. Selecciona
el certificado y la clave privada, y usa **Archivo → Exportar ítems** para guardar un `.p12` protegido por
contraseña. Si no aparece la clave privada o macOS no permite exportarla, no se podrá firmar en CI con ese
certificado; habrá que recuperar el llavero original o crear otro certificado con su clave privada.

Crea también una **Team API Key** con rol Developer en App Store Connect y descarga el `.p8` (Apple solo
permite descargarlo una vez). Codifica localmente los dos archivos, sin subirlos al repositorio:

```bash
base64 -i "/ruta/segura/DeveloperID.p12" | tr -d '\\n'
base64 -i "/ruta/segura/AuthKey_KEYID.p8" | tr -d '\\n'
```

Pega cada resultado directamente en el secret correspondiente de GitHub. El workflow importa el `.p12` en
un llavero temporal, firma y notariza los builds macOS, sella los DMG y elimina la clave `.p8` temporal al
final del job. `GDWMirrorNotary` es un perfil de tu llavero local y **no** se usa ni se transfiere a GitHub.

**Para lanzar el workflow sobre la versión actual**, recuerda subir antes el cambio de `version` en
`package.json`; el tag debe coincidir (`version: 0.2.3` → tag `v0.2.3`).

## Desarrollo

```bash
npm run dev          # aplicación dual con ventana del motor visible y devtools
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
| `MIRROR_CUSTOM_FRAME=1` | Fuerza el marco propio de la ventana en macOS (para probar) |

### Prueba rápida de humo

```bash
# en una terminal
MIRROR_AUTOSTART=1 npm start

# en otra
curl -s http://127.0.0.1:47820/hello
```

Respuesta esperada:

```json
{"app":"gdwmirror","version":"0.2.3","name":"...","sharing":true,"requireCode":false}
```

## Estructura del proyecto

```
src/
  main.js            inicia el rol predeterminado de la aplicación dual
  entry-dual.js      entrypoint empaquetado de la aplicación dual
  host-main.js       bandeja, panel, señalización HTTP y opciones de compartir/visor
  host.html/.js      motor de captura y WebRTC (renderer)
  preload-host.js    puente IPC del motor
  menu.html/.js      popover de la barra de estado con bloques desplegables
  preload-menu.js    puente IPC del popover
  pairing.html       ventana de "Detalles de conexión" (bajo demanda)
  preload-panel.js   puente IPC de esa ventana
  viewer-main.js     ventana del visor remoto, descubrimiento e IPC de red
  viewer.html/.js    interfaz de conexión y reproducción
  preload-viewer.js  puente IPC del visor
  icons.js           íconos de bandeja y aplicación
  assets/            recursos gráficos de la bandeja de Windows
  fit.js             cálculo del encaje de ventana al aspect ratio
  net.js             cliente HTTP y utilidades de red
builder/
  dual.yml           configuración de empaquetado para macOS y Windows
  RELEASE-NOTES.md   notas del release (las usa el workflow)
build/
  icon.png           ícono de la app
  entitlements.mac.plist  entitlements para Hardened Runtime y notarización
.github/
  workflows/release.yml   compilación y publicación automática
```

## Limitaciones conocidas

- **Un solo receptor.** La versión actual atiende una conexión a la vez.
- **fps por encima de 90 no funcionan.** El encoder de macOS deja de emitir frames con `maxFramerate` cerca
  de 120. El techo es 90.
- **Audio protegido (DRM)** puede no capturarse.
- **Reconexión automática limitada.** Si la conexión se interrumpe, espera 3 segundos y prueba hasta seis veces
  cada 1.5 segundos. Si no se recupera, muestra un aviso y hay que iniciar la conexión de nuevo.
- **Sin selección de ventana.** Solo pantalla completa (no una app suelta).
- **macOS arm64 + x64 y Windows x64** en los binarios publicados. Sin Windows ARM64.
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

- GitHub rechaza archivos de más de **100 MB** en el árbol del repo. Los paquetes de la aplicación pueden superar ese límite.
- Meter binarios de ese tamaño en git haría el clonado lentísimo.
- Releases acepta hasta 2 GB por archivo y da historial de versiones.

### Firma

| Plataforma | Estado | Consecuencia |
| --- | --- | --- |
| macOS | **Firmada y notarizada** | Firmada con Developer ID; el ticket está adjunto a la app y al DMG. El ZIP incluye la app notarizada. |
| Windows — portable | **Sin firma de código** | SmartScreen puede mostrar un aviso al ejecutar el archivo descargado. |
| Windows — Microsoft Store | **Firmado por Microsoft Store** | La Store firma el paquete durante el proceso de publicación. |

Verificado en macOS Apple Silicon: `codesign --verify --deep --strict`, `xcrun stapler validate` y Gatekeeper (`spctl --assess`) aceptan la app; el DMG también valida con `stapler`. El ZIP no admite un ticket adjunto directamente, pero contiene la app notarizada.

La firma Developer ID y la notarización de macOS están configuradas para los builds locales. La publicación automática de GitHub Actions aún requiere configurar las credenciales/certificado de firma para CI; Windows requiere aparte su propio certificado de firma de código.

Los archivos obtenidos por `git clone`, `curl` o `gh release download` **no llevan cuarentena**; los descargados por un navegador sí pueden llevarla.

## Hoja de ruta

- [x] Preferencia por AV1 y HEVC cuando el host los anuncia; WebRTC negocia solo códecs compatibles y conserva H.264/VP9/VP8 como alternativas.
- [x] Reconexión automática limitada tras perder la conexión.
- [ ] Selección de ventana además de pantalla completa.
- [ ] Varios receptores simultáneos.
- [x] Firma y notarización local de macOS; configurar credenciales de firma para GitHub Actions.
- [ ] Firma de código de Windows.
- [ ] Build para Windows ARM64.
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

## Términos de búsqueda

Si llegaste aquí buscando alguna de estas cosas, este es el proyecto:

**En español**

`espejo de pantalla` · `espejo de pantalla mac a windows` · `espejo de pantalla windows a mac` ·
`compartir pantalla de mac en windows` · `compartir pantalla de windows en mac` ·
`ver pantalla de mac en pc` · `ver pantalla de windows en mac` · `mandar pantalla de mac a windows` · `mandar pantalla de windows a mac` ·
`duplicar pantalla mac en windows` · `duplicar pantalla windows en mac` · `compartir pantalla mac en meet` · `compartir pantalla mac en zoom` ·
`pantalla de mac en obs` · `espejo mac sin cables` · `transmitir pantalla mac a pc por red local` ·
`alternativa a airplay para windows`

**In English**

`screen mirror` · `screen mirroring` · `mirror screen` · `mirror mac to windows` · `mirror windows to mac` ·
`mac screen to windows` · `windows screen to mac` · `share mac screen on windows` · `share windows screen on mac` · `mac to windows screen sharing` · `windows to mac screen sharing` ·
`mac as second screen windows` · `windows as second screen mac` · `display mirroring` · `screen casting lan` ·
`share mac screen in google meet` · `share mac screen in zoom` · `mac screen capture for obs` ·
`airplay alternative for windows` · `sunshine moonlight alternative for presentations` ·
`low latency screen mirror lan` · `webrtc screen sharing desktop`

**Técnico**

`macOS ↔ Windows` · `screen mirroring both ways` · `LAN screen mirror` · `WebRTC screen capture` · `ScreenCaptureKit mirror` ·
`H.264 screen mirror` · `no drivers screen mirror` · `zero install screen mirror` ·
`Electron screen mirror app`

> Este proyecto **no** es: control remoto, escritorio remoto (RDP/VNC), streaming de juegos
> (Moonlight/Parsec), ni AirPlay. Es un **espejo de pantalla bidireccional** entre macOS y Windows,
> pensado para presentar y colaborar.
