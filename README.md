#Breeze

These are notes to setup your local.

## Prerequisites

You need to have your node version to >=14.0.0 and to have the following applications setupped before moving further:

1. Postgis (postgres with postgis) - for the database
2. Redis - caching

You can setup both using docker with:

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

For Redis:

```bash
docker run --name redis -p 6379:6379 -d redis
```

Once you have both postgis and redis running, you can now proceed with cloning the backend to your local.

## First time setup

After cloning, create your local copy of the env file by running one of the following commands.

```bash
npm run setup-env:dev
```

this will setup the local to the dev environment. Update values for the key DB_PASSWORD to the one you used to setup postgis.

## Install

Install the node packages:

```bash
npm install
```

make sure you have the `@adonisjs/cli` package installed. You may add a flag to your npm install with: --include dev

### Migrations

Run the following command to run startup migrations.

```js
adonis migration:run
```

### Notifications Doc

---

Docs
---
```/docs```

