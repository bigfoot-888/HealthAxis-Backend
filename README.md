# Guía de instalación

Los repositorios con el código fuente se pueden encontrar en:

- Backend: [HealthAxis-Backend](https://github.com/bigfoot-888/HealthAxis-Backend)
- Frontend: [HealthAxis-Frontend](https://github.com/bigfoot-888/HealthAxis-Frontend)

## 1. Requisitos previos

El sistema ha sido probado en un entorno con:

- Node.js
- npm
- PostgreSQL
- Redis

Antes de ejecutar el proyecto, es necesario tener PostgreSQL y Redis instalados y en ejecución.

- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/
- Redis: https://redis.io/downloads/

## 2. Clonado de repositorios

Crea una carpeta donde almacenar el proyecto y ejecuta en la terminal los siguientes comandos:

```bash
git clone https://github.com/bigfoot-888/HealthAxis-Frontend.git frontend
```

```bash
git clone https://github.com/bigfoot-888/HealthAxis-Backend.git backend
```

## 3. Configuración del backend

Primero ejecuta los siguientes comandos:

```bash
cd backend
npm install
```

Luego crea el archivo `.env` en la raíz de la carpeta `backend`. Este debe tener el siguiente contenido y estructura:

```env
PORT=3000
PGUSER=<usuario_postgres>
PGPASSWORD=<password_postgres>
PGHOST=localhost
PGPORT=5432
PGDATABASE=<nombre_bd>
SESSION_SECRET=<string_largo_aleatorio>
REDIS_URL=redis://localhost:6379
```

Asegúrate de que los puertos especificados en el archivo `.env` estén libres.

## 4. Creación de la base de datos

Crea una base de datos PostgreSQL vacía con el nombre definido en la variable `PGDATABASE`:

```bash
createdb <nombre_bd>
```

Alternativamente, desde PostgreSQL:

```sql
CREATE DATABASE <nombre_bd>;
```

## 5. Inicialización del sistema

Crea una carpeta llamada `uploads` en la raíz de la carpeta del backend:

```bash
# Linux / Mac
mkdir -p uploads

# Windows
mkdir uploads
```

Inicializa las tablas y los datos de prueba:

```bash
node utils/init-db.js
```

Este comando elimina y recrea las tablas de la base de datos, además de insertar datos de prueba.

## 6. Ejecución del backend

Desde la raíz de la carpeta `backend` ejecuta:

```bash
npx nodemon ./index.js
```

El backend quedará disponible en:

```text
http://localhost:3000
```
