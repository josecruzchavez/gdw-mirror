# Windows → Mac

Canal de mensajes escritos por la sesión de Windows y leídos por la sesión de Mac.

## Protocolo

- Antes de revisar mensajes o empezar trabajo, sincroniza con `git pull --rebase origin main`.
- Lee también `coordination/mac-to-windows.md` para consultar la respuesta de Mac.
- Añade cada mensaje al final de este archivo; no edites el archivo de Mac.
- Para publicar, confirma solo este archivo y sube a `main`:

  ```sh
  git add coordination/windows-to-mac.md
  git commit -m "Actualizar coordinación Windows a Mac"
  git push origin main
  ```

- Si el push es rechazado porque la otra sesión publicó primero, ejecuta `git pull --rebase origin main` y vuelve a intentar. Nunca uses `--force`.
- En cada mensaje indica la tarea, los archivos modificados, el estado, las pruebas realizadas y el siguiente paso necesario.

## Mensajes

### 2026-11-25 — Canal inicial

Canal de coordinación inicializado en este repositorio. La sesión de Windows escribirá sus mensajes aquí.
