# PWA y sincronización sin conexión

## Objetivo

Permitir instalar la aplicación desde el navegador y utilizar sus funciones de consulta, creación, edición y eliminación sin conexión, incluyendo los TODO. Los cambios se sincronizarán con Supabase cuando vuelva la conectividad.

## Suposiciones y límites

- La primera visita, el inicio de sesión inicial y la carga inicial de datos requieren conexión.
- La sincronización se intenta al recuperar la conexión mientras la aplicación está abierta y al volver a abrirla; no se garantiza con la aplicación cerrada.
- Inicialmente se espera un número reducido de usuarios y dispositivos, sin requisitos especiales de rendimiento.
- Los datos locales son sensibles y dependen de la protección del dispositivo y del navegador.
- Se prioriza conservar los cambios frente a sobrescribirlos silenciosamente.

## Decisiones

1. **Copia local y cola persistente:** usar IndexedDB para los datos y las operaciones pendientes. Se descartó limitarse a una caché de respuestas y peticiones por su fragilidad ante relaciones, eliminaciones y conflictos; también se descartó inicialmente un motor especializado por su dependencia y complejidad adicionales.
2. **Conflictos por registro:** mostrar ambas versiones y sus fechas de edición para que el usuario elija cuál conservar. Se prefirió a combinar campos para evitar registros inconsistentes.
3. **Aislamiento:** separar los datos locales y cambios pendientes por usuario y proyecto de Supabase.
4. **Instalación:** usar un manifiesto y un service worker para poner a disposición los recursos necesarios sin conexión tras la primera visita.

## Flujo

La interfaz lee y escribe en la copia local. Cada operación se registra de forma persistente como pendiente. Al volver la conexión, la aplicación envía los cambios en orden y actualiza la copia local; si falla, mantiene la cola para reintentar. Cada modificación conserva la versión conocida del registro para detectar cambios concurrentes en el servidor. Si existe un conflicto, ese cambio no se sobrescribe automáticamente y se solicita una decisión al usuario.

La interfaz indicará si está sin conexión, sincronizando o si existen cambios pendientes o conflictos.

## Riesgos y verificación

Hay que preservar correctamente operaciones relacionadas, eliminaciones, reintentos y cambios concurrentes, evitando pérdidas y duplicados. La verificación debe cubrir esos casos, el aislamiento entre usuarios y proyectos, la instalación y la apertura de la aplicación sin conexión después de la primera carga.
