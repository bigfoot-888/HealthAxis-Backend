= Guía de instalación

En este último anexo se describen los pasos para instalar y ejecutar el proyecto. 

Los repositorios con el código se pueden encontrar en: 

- *Backend*: https://github.com/bigfoot-888/HealthAxis-Backend

- *Frontend*: https://github.com/bigfoot-888/HealthAxis-Frontend

1. *Requisitos previos*

El sistema ha sido probado en un entorno con:
- Node.js 
- npm 
- PostgreSQL 
- Redis 

Antes de ejecutar el proyecto, es necesario tener PostgreSQL y Redis instalados y en ejecución.

*Node.js*: https://nodejs.org/.

*PostgreSQL*: https://www.postgresql.org/download/.

*Redis*: https://redis.io/downloads/.

2. *Clonado de repositorios*

Crea una carpeta donde almacenar el proyecto, y ejecutar en la terminal los siguientes comandos.

```
git clone https://github.com/bigfoot-888/HealthAxis-Frontend.git frontend
```,

```
git clone https://github.com/bigfoot-888/HealthAxis-Backend.git backend
```,

3. *Configuración del backend*

Primero ejecuta los siguientes comandos. 

```
cd backend
npm install
```,

Luego crea el archivo "*.env*" con las variables de entorno en la raíz de la carpeta backend. Este debe tener el siguiente contenido y estructura:

```
PORT=3000
PGUSER=<usuario_postgres>
PGPASSWORD=<password_postgres>
PGHOST=localhost
PGPORT=5432
PGDATABASE=<nombre_bd>
SESSION_SECRET=<string_largo_aleatorio>
REDIS_URL=redis://localhost:6379
```,

Asegúrate de tener los puertos especificados en la estructura libres. 

4. *Creación de la base de datos*

Crea una base de datos PostgreSQL vacía con el nombre definido en la variable `PGDATABASE`:

```
createdb <nombre_bd>
```,

Alternativamente, desde PostgreSQL:

```
CREATE DATABASE <nombre_bd>;
```,

5. *Inicialización del sistema*

Crea una carpeta llamada "uploads" en la raíz de la carpeta del backend. 

```
mkdir -p uploads // Linux / Max
mkdir uploads    // Windows
```,

Inicializa las tablas y datos de prueba:

```
node utils/init-db.js
```,

Este comando elimina y recrea las tablas de la base de datos, además de insertar datos de prueba.

6. *Ejecución del backend*

Desde la raíz de la carpeta del backend ejecuta:

```
npx nodemon ./index.js
```,

El backend quedará disponible en http://localhost:3000.
