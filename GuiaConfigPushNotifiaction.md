========================================================================
GUÍA DE CONFIGURACIÓN: NOTIFICACIONES PUSH EN EXPO (SDK 53+) EN WINDOWS
========================================================================

Este documento detalla el proceso completo para configurar y probar notificaciones push en una aplicación desarrollada con Expo, usando un Development Build en un emulador de Android Studio en Windows.

Incluye soluciones a los problemas más comunes: límites de rutas largas en Windows, configuración de pnpm (v10+) y vinculación de credenciales de Firebase (FCM V1).

---

## PRERREQUISITOS

- Node.js y pnpm instalados.
- Android Studio con un emulador configurado (API 34+ recomendado).
- Cuenta en Expo (expo.dev).
- Cuenta en Firebase.

========================================================================
FASE 1: VINCULACIÓN DEL ENTORNO LOCAL
========================================================================

1.1. Configurar la ruta del SDK de Android (local.properties)
Gradle necesita saber dónde está instalado el SDK de Android. Si no se configura, arrojará el error "SDK location not found".

- ¿Dónde hacerlo? En la carpeta android de tu proyecto: tu-proyecto/android/local.properties.
- ¿Qué escribir? La ruta a tu SDK (búscala en Android Studio > Settings > Languages & Frameworks > Android SDK).

IMPORTANTE: Usa dobles barras invertidas (\\) para escapar la ruta correctamente en Windows.

# Archivo: android/local.properties

sdk.dir=C:\\Users\\TuUsuario\\AppData\\Local\\Android\\Sdk

1.2. Solución al límite de rutas de Windows (CMake y Ninja)
Windows tiene un límite de 260 caracteres para las rutas. Las librerías nativas como react-native-worklets fallan al compilar si la ruta es muy larga, provocando el error: "manifest 'build.ninja' still dirty".

Solución A: Habilitar rutas largas en Windows (PowerShell como Administrador):
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

Solución B: Actualizar CMake en Android Studio (instalar versión 3.31.6+) y crear el archivo gradle.properties en C:\Users\TuUsuario\.gradle\ con las siguientes líneas:

# Archivo: C:\Users\TuUsuario\.gradle\gradle.properties

android.cmakeVersion=3.31.6
expo.android.cmakeObjectPathMax=1024

========================================================================
FASE 2: COMPACTACIÓN DE PAQUETES CON PNPM (CRÍTICO)
========================================================================

El problema de pnpm v10+ y las rutas anidadas:
A partir de la versión 10, pnpm dejó de leer configuraciones como node-linker=hoisted desde el archivo .npmrc. Por defecto, pnpm crea una estructura de carpetas anidadas (.pnpm/carpeta_hash/node_modules/...) que hace que las rutas sean extremadamente largas, rompiendo la compilación de Android en Windows.

Para solucionarlo, debemos obligar a pnpm a "aplanar" los paquetes (comportamiento idéntico a npm).

2.1. Configurar el Workspace de pnpm

- ¿Dónde hacerlo? En la raíz del proyecto (tu-proyecto/).
- Crea el archivo pnpm-workspace.yaml con la siguiente línea:

# Archivo: pnpm-workspace.yaml

nodeLinker: hoisted

2.2. Limpiar y reinstalar
Al cambiar esta configuración, debes forzar a pnpm a reconstruir la carpeta node_modules. Ejecuta en la raíz del proyecto:

rm -rf node_modules pnpm-lock.yaml
pnpm install

(Esto garantiza que las librerías nativas no generen rutas de más de 250 caracteres, evitando que Ninja colapse).

========================================================================
FASE 3: CONFIGURACIÓN DE FIREBASE Y CREDENCIALES (FCM V1)
========================================================================

Las notificaciones push en Android usan Firebase Cloud Messaging (FCM). Necesitas dos archivos JSON distintos.

3.1. Configuración pública (google-services.json)

1. Ve a la consola de Firebase, crea un proyecto y registra una app Android.
2. Nombre del paquete: Debe ser IDÉNTICO al package en tu app.json (ej. com.tunombre.pruebaNotificacion).
3. Descarga el google-services.json y colócalo en la raíz de tu proyecto (al lado de app.json).
4. Vincula el archivo en tu app.json:

"android": {
"package": "com.tunombre.pruebaNotificacion",
"googleServicesFile": "./google-services.json"
}

3.2. Credenciales privadas para Expo (Service Account Key)
Expo necesita permisos para enviar notificaciones a través de tu Firebase.

1. En Firebase, ve a Configuración del proyecto > Cuentas de servicio.
2. Haz clic en "Generar nueva clave privada" y descarga el archivo JSON (es secreto, no lo subas a Git).
3. Sube esta llave a los servidores de Expo usando EAS CLI. Ejecuta en la raíz del proyecto:

eas credentials

Selecciona: Android > production > Google Service Account > Manage key > Upload new key. Arrastra el archivo secreto descargado a la terminal.

⚠️ SEGURIDAD: El archivo de la cuenta de servicio NUNCA debe subirse al repositorio. Añade su nombre al archivo .gitignore.

========================================================================
FASE 4: CÓDIGO Y COMPILACIÓN
========================================================================

4.1. Instalación de dependencias de Notificaciones
Ejecuta en la raíz del proyecto:
npx expo install expo-notifications expo-device expo-constants

4.2. Comportamiento en Expo Go vs Development Build
Desde el SDK 53, las notificaciones push remotas ya no funcionan en Expo Go. Es obligatorio compilar un Development Build nativo.

Añade esta validación en tu código para evitar errores si se abre en Expo Go:

import \* as Device from 'expo-device';

useEffect(() => {
if (Device.isDevice) {
registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
} else {
console.log("Las notificaciones push requieren un dispositivo físico o emulador con Google Play.");
}
}, []);

4.3. Compilar e instalar en el emulador
Asegúrate de que el emulador de Android Studio esté encendido. Luego ejecuta en la raíz del proyecto:

npx expo run:android

(Esto compilará la app nativa usando Gradle y la instalará directamente en tu emulador).

========================================================================
FASE 5: PRUEBAS Y VERIFICACIÓN
========================================================================

1. Abre la app instalada en tu emulador (no la abras desde Expo Go).
2. Copia el ExpoPushToken que aparecerá en la pantalla (ej. ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]).
3. Ve a la herramienta oficial de pruebas de Expo: https://expo.dev/notifications
4. Pega el token, escribe un título y un cuerpo, y haz clic en "Send Notification".
5. En unos segundos, deberías ver la notificación aparecer en tu emulador de Android.

========================================================================
RESUMEN DE LECCIONES APRENDIDAS
========================================================================

- Rutas de Windows: Las rutas largas son el enemigo número uno. Habilitar LongPathsEnabled y actualizar CMake/Ninja son pasos vitales.
- pnpm vs React Native: La estructura por defecto de pnpm rompe la compilación de C++ en Windows. El archivo pnpm-workspace.yaml con nodeLinker: hoisted es obligatorio para evitar que Ninja colapse.
- Dos archivos de Firebase: google-services.json es público y va en el proyecto. El Service Account Key es privado, va directo a los servidores de Expo vía eas credentials.
- SDK 53+: Expo Go ya no soporta Push en Android. El flujo obligatorio ahora es npx expo run:android para crear Development Builds.
