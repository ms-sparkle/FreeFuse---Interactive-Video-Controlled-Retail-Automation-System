const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "capstone.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create the FTS5 table if it doesn’t exist
  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS product_fts
    USING fts5(
      productID UNINDEXED,
      name,
      brand,
      attributes,
      ingredients,
      primary_category,
      secondary_category,
      tokenize = 'porter'
    );
  `);
  //   Uses the Porter stemming algorithm for better word matching (tokenize = 'porter')

  // Populate it from the product table
  db.run(`DELETE FROM product_fts;`); // deletes old ones so that virtual tables updates in sync w original
  db.run(`
    INSERT INTO product_fts (productID, name, brand, attributes, ingredients, primary_category, secondary_category)
    SELECT productID, name, brand, attributes, ingredients, primary_category, secondary_category
    FROM product;
  `);

  console.log("product_fts initialized from product table");
});

module.exports = db;
