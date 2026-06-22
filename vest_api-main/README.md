# SmartVest API - VPS Setup

Project ini memakai Express, Prisma, dan MySQL. Untuk VPS, database dijalankan lewat Docker Compose, sedangkan API bisa dijalankan langsung dengan Node.js atau process manager seperti PM2.

## 1. Install kebutuhan di VPS

```bash
sudo apt update
sudo apt install -y git curl docker.io docker-compose-plugin nodejs npm
sudo systemctl enable --now docker
```

Jika versi Node.js bawaan VPS terlalu lama, install Node.js LTS dari NodeSource.

## 2. Clone dan konfigurasi environment

```bash
git clone <url-repository> smartvest-api
cd smartvest-api
cp .env.example .env
nano .env
```

Ganti password di `.env`, terutama:

```env
DATABASE_URL="mysql://smartvest_user:password_kuat@127.0.0.1:3306/smartvest_db"
MYSQL_ROOT_PASSWORD=root_password_kuat
MYSQL_DATABASE=smartvest_db
MYSQL_USER=smartvest_user
MYSQL_PASSWORD=password_kuat
```

Pastikan username, password, host, port, dan database di `DATABASE_URL` sama dengan konfigurasi MySQL Docker.

## 3. Jalankan database MySQL Docker

```bash
docker compose up -d mysql
docker compose ps
```

Data MySQL disimpan di Docker volume `smartvest_mysql_data`, jadi tetap aman saat container di-restart atau di-update.

## 4. Install dependency dan migrate database

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed:status
```

Opsional, jika ingin mengisi contoh data ESP32:

```bash
npm run db:seed:esp32
```

## 5. Jalankan API

Tes manual:

```bash
npm start
```

API berjalan di:

```text
http://IP_VPS:3001
```

Untuk production, gunakan PM2:

```bash
sudo npm install -g pm2
npm run pm2:start
pm2 save
pm2 startup
```

Setelah menjalankan `pm2 startup`, PM2 biasanya menampilkan satu command `sudo env ... pm2 startup ...`. Copy dan jalankan command tersebut, lalu jalankan lagi:

```bash
pm2 save
```

## Perintah operasional

```bash
# Lihat log database
docker compose logs -f mysql

# Restart database
docker compose restart mysql

# Stop database
docker compose down

# Jalankan migrasi setelah update kode
npm run db:migrate

# Start API dengan PM2
npm run pm2:start

# Restart API setelah update kode/env
npm run pm2:restart

# Lihat log API
npm run pm2:logs

# Stop API
npm run pm2:stop
```

## Catatan keamanan VPS

- Jangan commit file `.env`.
- Pakai password database yang kuat.
- Jika API dan database berada di VPS yang sama, biarkan `DATABASE_URL` memakai `127.0.0.1`.
- Batasi port `3306` dari publik lewat firewall jika tidak perlu diakses dari luar VPS.
