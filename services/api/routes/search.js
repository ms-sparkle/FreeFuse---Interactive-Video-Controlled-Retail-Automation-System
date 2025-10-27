//services/api/routes/search.js
const express = require("express");
const router = express.Router();
const db = require("../database/init"); // <— use the initialized DB

router.get("/search", (req, res) => {
  const q = req.query.q?.trim() || "";
  if (!q) return res.json([]);

  const sql = `
    SELECT 
      p.productID, p.name, p.brand,
      p.primary_category, p.secondary_category,
      pr.list_price, pr.sale_price, i.count AS stock,
      snippet(product_fts, 1, '<b>', '</b>', '...', 10) AS highlight,
      bm25(product_fts) AS score
    FROM product_fts
    JOIN product AS p ON p.productID = product_fts.productID
    LEFT JOIN price AS pr ON p.productID = pr.productID
    LEFT JOIN inventory AS i ON p.productID = i.productID
    WHERE product_fts MATCH ?
    ORDER BY score ASC, p.brand, p.name
    LIMIT 25;
  `;

  db.all(sql, [q + "*"], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;

