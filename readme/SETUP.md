## Prerequisites

You need to have your node version to >=14.0.0 and npm v7 to have the following applications installed before moving further:

1. Postgis (postgres with postgis) - for the database
2. Redis - caching

### Setting up using Docker

If you use docker you can go through these notes.

#### Setting up Postgis

```bash
docker run --name postgis -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgis/postgis
```

When the container is upped, you need to create the database on the postgres and enable the postgis extension container with:

```bash
> psql -U postgres
postgres=# CREATE DATABASE breeze;
postgres=# \c breeze;
postgres=# CREATE EXTENSION postgis;
```

To verify whether postgis extension is enabled:

```bash
postgres=# \dx
```

#### Setting up Redis

```bash
docker run --name redis -p 6379:6379 -d redis
```

Once you have both postgis and redis running, you can now proceed with cloning the backend to your local.

## First time setup

#### Clone this repository to your local

After cloning, create your local copy of the env file by running one of the following command.

```bash
npm run setup-env:dev
```

this will setup the local to the dev environment. Update values for the key DB_PASSWORD to the one you used to setup postgis.

#### Install Dependencies

Install the node packages:

```bash
npm install
```

make sure you have the `@adonisjs/cli` package installed. We need to use it from local repo, cause it is patched for ts files.

Normally the command is just `adonis` in order to play nice with our `typescript` files we need to convert into `npm run ace --`.

```bash
# this
# adonis --version
# turns into
npm run ace -- --version  
```

#### Migrations

Run the following command to run startup migrations.

```bash
npm run ace -- migration:run
```

#### Running Application

Run the app with:

```bash
npm run ace -- --dev
# or you can
npm run dev #this won't work with windows 10 because adding env variables is different there
```

If you're on windows 10 and you need to track database queries:

```bash
npm run dev:win10
```