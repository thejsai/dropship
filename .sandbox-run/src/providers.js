const fs = require("fs/promises");
const path = require("path");
const { parseAmazonSearchHtml } = require("./scraper");
const { scoreProducts } = require("./scoring");

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "amazon-search-sample.html");
const AMAZON_MARKETPLACE_HOSTS = {
  US: "www.amazon.com",
  IN: "www.amazon.in",
  UK: "www.amazon.co.uk"
};

function getProviderStatus() {
  const hasAffiliateCredentials = Boolean(
    process.env.AMAZON_ACCESS_KEY &&
      process.env.AMAZON_SECRET_KEY &&
      process.env.AMAZON_PARTNER_TAG
  );

  return {
    officialApiConfigured: hasAffiliateCredentials,
    officialApiState: "Product Advertising API was deprecated on May 15, 2026; migrate to Creators API.",
    scraperModeDefault: process.env.AMAZON_SCRAPER_MODE || "fixture"
  };
}

async function fetchAmazonSearchHtml(query, marketplace) {
  const host = AMAZON_MARKETPLACE_HOSTS[marketplace] || AMAZON_MARKETPLACE_HOSTS.US;
  const searchUrl = new URL(`https://${host}/s`);
  searchUrl.searchParams.set("k", query);

  const response = await fetch(searchUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      "accept-language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    throw new Error(`Amazon request failed with status ${response.status}`);
  }

  return response.text();
}

function detectAmazonBlock(html) {
  const markers = [
    /automated access/i,
    /interstitialchallenge/i,
    /akam/i,
    /captcha/i,
    /sorry, we just need to make sure/i
  ];

  return markers.some((marker) => marker.test(html));
}

async function searchWithFixture(query) {
  const html = await fs.readFile(FIXTURE_PATH, "utf8");
  const products = scoreProducts(parseAmazonSearchHtml(html, query));

  return {
    mode: "fixture",
    query,
    sourceNote: "Loaded local Amazon-like fixture HTML for repeatable testing.",
    products
  };
}

async function searchWithScraper(query, marketplace) {
  const html = await fetchAmazonSearchHtml(query, marketplace);
  const blocked = detectAmazonBlock(html);
  const products = scoreProducts(parseAmazonSearchHtml(html, query));

  if (blocked) {
    return {
      mode: "live-scraper-blocked",
      query,
      marketplace,
      blocked: true,
      sourceNote: "Amazon returned an anti-bot challenge page instead of product results. For reliable live data, use browser automation, rotating proxies, or an approved official API.",
      products: []
    };
  }

  if (!products.length) {
    return {
      mode: "live-scraper-empty",
      query,
      marketplace,
      blocked: false,
      sourceNote: "Amazon returned HTML, but the current parser did not match any product cards. The scraper likely needs another selector update.",
      products: []
    };
  }

  return {
    mode: "live-scraper",
    query,
    marketplace,
    sourceNote: "Fetched a public Amazon search result page and parsed visible listing fields.",
    products
  };
}

async function searchWithOfficialApi(query) {
  return {
    mode: "official-api-unavailable",
    query,
    sourceNote: "Product Advertising API access is not usable here as of May 17, 2026 without migrating to Creators API credentials.",
    products: []
  };
}

async function searchProducts({ query, source = "auto", marketplace = "US" }) {
  if (source === "official") {
    return searchWithOfficialApi(query);
  }

  if (source === "fixture") {
    return searchWithFixture(query);
  }

  if (source === "live") {
    return searchWithScraper(query, marketplace);
  }

  const defaultMode = process.env.AMAZON_SCRAPER_MODE || "fixture";

  if (defaultMode === "live") {
    return searchWithScraper(query, marketplace);
  }

  return searchWithFixture(query);
}

module.exports = {
  getProviderStatus,
  searchProducts,
  fetchAmazonSearchHtml
};
