const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { parseAmazonSearchHtml } = require("../src/scraper");

test("parseAmazonSearchHtml extracts products from fixture HTML", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "fixtures", "amazon-search-sample.html"),
    "utf8"
  );

  const products = parseAmazonSearchHtml(html, "portable blender");

  assert.equal(products.length, 3);
  assert.deepEqual(products[0], {
    asin: "B0TEST001",
    title: "Portable Blender for Smoothies with USB Charging",
    price: 29.99,
    rating: 4.5,
    reviewCount: 1248,
    prime: true,
    image: "https://example.com/blender.jpg",
    searchQuery: "portable blender"
  });
});
