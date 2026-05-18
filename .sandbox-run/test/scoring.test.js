const test = require("node:test");
const assert = require("node:assert/strict");
const { scoreProducts } = require("../src/scoring");

test("scoreProducts sorts highest opportunity first", () => {
  const products = scoreProducts([
    { asin: "1", title: "A", price: 15, rating: 4.2, reviewCount: 9000, prime: false },
    { asin: "2", title: "B", price: 30, rating: 4.6, reviewCount: 250, prime: true }
  ]);

  assert.equal(products[0].asin, "2");
  assert.ok(products[0].opportunityScore > products[1].opportunityScore);
});
