# KeyVault - Cross-Platform Password Manager (React + Capacitor)

A modern, zero-knowledge encrypted password manager built with **React**, **TypeScript**, **Tailwind CSS**, and **Capacitor**. It runs as a Web application and as a native Android app with package ID `com.password.manager`.

---

## 🔒 Arsitektur Penyimpanan & Keamanan

### 1. Lokasi Penyimpanan File (Android Data Folder)
* **Android Native App:** 
  Data disimpan langsung di internal app storage yang disandbox oleh sistem operasi Android:
  ```text
  /data/data/com.password.manager/files/vault.enc.json
  ```
  *(Atau `/data/user/0/com.password.manager/files/vault.enc.json` via `@capacitor/filesystem` `Directory.Data`)*. Folder ini terisolasi dan aplikasi lain di perangkat tidak memiliki izin untuk membacanya.
* **Web Browser:** 
  Disimpan dalam sandboxed Web Storage (`localStorage` / IndexedDB), serta dilengkapi fitur **Export & Import file `.vault`** terenkripsi sehingga file bisa disimpan ke folder mana pun di PC/Laptop/HP.

### 2. Zero-Knowledge Cryptography
* File yang ditulis ke disk **TIDAK PERNAH** dalam bentuk plaintext (JSON biasa).
* **KDF (Key Derivation):** `PBKDF2` dengan `HMAC-SHA256` dan 100.000 iterasi + 16-byte random salt.
* **Symmetric Cipher:** `AES-256-GCM` dengan 12-byte random IV dan authentication tag integrity check.
* **Master Password Memory Safety:** Master password hanya disimpan di memori saat vault dalam status *unlocked*, dan langsung dihapus saat *auto-lock* aktif atau tombol *Lock Now* ditekan.

---

## 📦 Modul & Fitur yang Tersedia

### Modul 1: Login Credentials (Akun Web & Aplikasi)
* `title`: Nama akun / layanan (contoh: Google, Github, Netflix)
* `username` / `email`: Username atau email login
* `password`: Kata sandi (terenkripsi, opsi show/hide & quick copy)
* `urls`: List URL website terkait
* `totpSecret`: **Built-in 2FA Authenticator** (generate 6-digit OTP live setiap 30 detik seperti Google Authenticator, tanpa butuh app terpisah)
* `folderId`, `tags`, `isFavorite`, `notes`

### Modul 2: Secure Notes (Catatan Rahasia)
* `title`: Judul catatan
* `content`: Teks rahasia (Markdown, Crypto Seed Phrase, WiFi password, Recovery codes)
* `tags`, `isFavorite`, `notes`

### Modul 3: Payment Cards (Kartu & Rekening)
* `cardholderName`, `cardNumber`, `brand` (Visa, Mastercard, BCA/GPN, JCB, Amex)
* `expMonth`, `expYear`, `cvv`, `pin` (terenkripsi)

### Modul 4: Identity (Identitas Diri)
* `fullName`, `idType` (KTP, SIM, Passport, NPWP), `idNumber` (NIK / No Paspor), `birthDate`, `phone`, `address`

### Modul 5: Password & Passphrase Generator
* **Random Mode:** Slider panjang (8–48 karakter), opsi Huruf Besar, Huruf Kecil, Angka, Simbol, serta opsi menghindari karakter ambigu (`1`, `l`, `I`, `0`, `O`).
* **Passphrase Mode:** Generator kata sandi berbasis kata-kata yang mudah dihafal (contoh: `swift-falcon-battery-82`).
* **Live Entropy Meter:** Mengukur kekuatan password secara real-time (0–100%).

### Modul 6: Security Audit (Kesehatan Vault)
* Menghitung **Vault Health Score (0–100%)**.
* Mendeteksi password lemah (panjang < 10 karakter atau entropy rendah).
* Mendeteksi **Reused Passwords** (password yang digunakan di lebih dari 1 akun).
* Mendeteksi akun yang belum memasang 2FA.

### Modul 7: Vault Settings & Maintenance
* Info status direktori penyimpanan file fisik.
* Ubah Master Password (otomatis re-enkripsi data dengan kunci baru).
* **Auto-Lock Inactivity Timer:** Kunci vault otomatis setelah 1m, 5m, 15m, atau nonaktif.
* **Export / Backup (.vault):** Download file cadangan terenkripsi.
* **Restore / Import:** Pulihkan data dari file `.vault`.
* Factory Reset / Erase Vault.

---

## 🚀 Cara Menjalankan

### Mode Web (Development & Testing)
```bash
npm run dev
```
Akses di browser: `http://localhost:3000`

### Build untuk Web & Sync ke Android
```bash
# 1. Build web bundle
npm run build

# 2. Sync ke project native Android
npx cap copy android
```

### Buka & Build APK di Android Studio
```bash
npx cap open android
```
Di Android Studio:
1. Tunggu Gradle sync selesai.
2. Klik tombol **Run** (ke Emulator/HP fisik) atau menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. Aplikasi akan terinstall dengan App ID `com.password.manager`, dan data vault otomatis tersimpan di `/data/data/com.password.manager/files/vault.enc.json`.
