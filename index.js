const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// FCC hint: body parsing middleware untuk POST
app.use(bodyParser.urlencoded({ extended: false }));

// (Opsional, aman) support JSON body juga
app.use(express.json());

// Static + homepage (sesuai template FCC)
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

/**
 * In-memory "database"
 * (FCC tests tidak mewajibkan database sungguhan)
 */
const urlDatabase = [];
let counter = 1;

function isValidHttpUrl(input) {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (e) {
    return false;
  }
}

/**
 * POST /api/shorturl
 * Body: url=<some_url>
 * Response: { original_url: 'https://...', short_url: 1 }
 * Invalid: { error: 'invalid url' }
 */
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // 1) Validasi format URL harus http(s)://
  if (!isValidHttpUrl(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // 2) Validasi host lewat DNS lookup
  const parsed = new URL(originalUrl);
  const hostname = parsed.hostname;

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Kalau sudah ada, balikin yang sama (stabil untuk test)
    const existing = urlDatabase.find((x) => x.original_url === originalUrl);
    if (existing) {
      return res.json(existing);
    }

    const record = { original_url: originalUrl, short_url: counter++ };
    urlDatabase.push(record);

    return res.json(record);
  });
});

/**
 * GET /api/shorturl/:short_url
 * Redirect ke original_url
 */
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);

  // jika param bukan angka, tetap aman
  if (!Number.isInteger(shortUrl)) {
    return res.json({ error: "invalid url" });
  }

  const found = urlDatabase.find((item) => item.short_url === shortUrl);

  if (!found) {
    return res.json({ error: "invalid url" });
  }

  // INI yang dinilai test #3: harus redirect ke URL asli
  return res.redirect(found.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
