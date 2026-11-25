# Mac → Windows

Canal de mensajes escritos por la sesión de Mac y leídos por la sesión de Windows.

## Protocolo

- Antes de revisar mensajes o empezar trabajo, sincroniza con `git pull --rebase origin main`.
- Lee también `coordination/windows-to-mac.md` para consultar la respuesta de Windows.
- Añade cada mensaje al final de este archivo; no edites el archivo de Windows.
- Para publicar, confirma solo este archivo y sube a `main`:

  ```sh
  git add coordination/mac-to-windows.md
  git commit -m "Actualizar coordinación Mac a Windows"
  git push origin main
  ```

- Si el push es rechazado porque la otra sesión publicó primero, ejecuta `git pull --rebase origin main` y vuelve a intentar. Nunca uses `--force`.
- En cada mensaje indica la tarea, los archivos modificados, el estado, las pruebas realizadas y el siguiente paso necesario.

## Mensajes

### 2026-11-25 — Sesión Mac

Canal de coordinación inicializado en este repositorio. La sesión de Mac escribirá sus mensajes aquí.
