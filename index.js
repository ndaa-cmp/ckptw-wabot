// Modul dan dependensi yang diperlukan
require("./config.js");
const pkg = require("./package.json");
const tools = require("./tools/exports.js");
const {
    Consolefy
} = require("@mengkodingan/consolefy");
const CFonts = require("cfonts");
const fs = require("fs");
const http = require("http");
const path = require("path");
const SimplDB = require("simpl.db");

// Buat consolefy
const c = new Consolefy({
    tag: pkg.name
});

// Buat basis data
const db = new SimplDB();
const dbFile = path.join(__dirname, "database.json");
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}), "utf8");

// Pengecekan dan penghapusan folder auth pada adaptor 'default' jika kosong
if (config.bot.authAdapter.adapter === "default") {
    const authDir = path.resolve(__dirname, config.bot.authAdapter.default.authDir);
    if (fs.existsSync(authDir) && !fs.readdirSync(authDir).length) fs.rmdirSync(authDir);
}

// Atur konfigurasi ke global
global.config.pkg = pkg;
global.tools = tools;
global.consolefy = c;
global.db = db;

// Memulai
c.log(`Starting...`);

// Tampilkan judul menggunakan CFonts
CFonts.say(pkg.name, {
    font: "chrome",
    align: "center",
    gradient: ["red", "magenta"]
});

// Menampilkan informasi paket
const authorName = pkg.author.name || pkg.author;
CFonts.say(
    `'${pkg.description}'\n` +
    `By ${authorName}`, {
        font: "console",
        align: "center",
        gradient: ["red", "magenta"]
    }
);

// Fungsi untuk menjalankan server jika diaktifkan
if (config.system.useServer) {
    const port = config.system.port;
    const server = http.createServer((req, res) => {
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end(`${pkg.name} is running on port ${port}`);
    });

    server.listen(port, () => {
        c.success(`Server is running at http://localhost:${port}`);
    });
}

// Impor dan jalankan modul utama
require("./main.js");