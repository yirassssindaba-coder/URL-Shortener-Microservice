'use strict';

const dns = require('dns');

module.exports = function (app) {
  // Simpan mapping di memory (cukup untuk FCC tests)
  const urlDatabase = new Map(); // short_url -> original_url
  let counter = 1;

  const isValidHttpUrl = (input) => {
    try {
      const u = new URL(input);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  app.post('/api/shorturl', (req, res) => {
    const original_url = req.body && req.body.url;

    // Harus format http://... atau https://...
    if (!original_url || !isValidHttpUrl(original_url)) {
      return res.json({ error: 'invalid url' });
    }

    const hostname = new URL(original_url).hostname;

    // Verifikasi hostname dengan DNS lookup (sesuai hint FCC)
    dns.lookup(hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      const short_url = counter++;
      urlDatabase.set(String(short_url), original_url);

      return res.json({
        original_url,
        short_url
      });
    });
  });

  app.get('/api/shorturl/:short_url', (req, res) => {
    const short_url = req.params.short_url;
    const original_url = urlDatabase.get(String(short_url));

    if (!original_url) {
      // FCC tidak minta format khusus untuk not found,
      // tapi ini aman dan tidak mengganggu tests.
      return res.status(404).json({ error: 'No short URL found for given input' });
    }

    return res.redirect(original_url);
  });
};
