function cleanText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMatch(block, pattern) {
  const match = block.match(pattern);
  return match ? cleanText(match[1]) : null;
}

function parsePrice(block) {
  const whole = extractMatch(block, /a-price-whole[^>]*>([^<]+)/i);
  const fraction = extractMatch(block, /a-price-fraction[^>]*>([^<]+)/i);

  if (!whole) {
    return null;
  }

  const normalizedWhole = whole.replace(/[^\d]/g, "");
  const normalizedFraction = (fraction || "00").replace(/[^\d]/g, "").padEnd(2, "0");
  return Number(`${normalizedWhole}.${normalizedFraction.slice(0, 2)}`);
}

function parseRating(block) {
  const value = extractMatch(block, /aria-label="([\d.]+)\s+out of 5 stars"/i);
  return value ? Number(value) : null;
}

function parseReviewCount(block) {
  const value = extractMatch(block, /a-size-base s-underline-text">([\d,]+)/i);
  return value ? Number(value.replace(/,/g, "")) : 0;
}

function parsePrime(block) {
  return /aria-label="Amazon Prime"/i.test(block) || /a-icon-prime/i.test(block);
}

function parseImage(block) {
  return extractMatch(block, /<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="([^"]+)"/i);
}

function parseAsin(block) {
  const match = block.match(/data-asin="([^"]+)"/i);
  return match ? match[1] : null;
}

function parseTitle(block) {
  return (
    extractMatch(block, /<h2[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/i) ||
    extractMatch(block, /<span class="a-size-medium[^"]*">([\s\S]*?)<\/span>/i)
  );
}

function extractKeywords(title, query = "") {
  // Common stop words to filter out
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
    "from", "as", "is", "was", "are", "be", "been", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "can", "must", "it", "this", "that",
    "these", "those", "i", "you", "he", "she", "we", "they", "what", "which", "who", "where",
    "when", "why", "how", "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very"
  ]);

  // Split title into words, convert to lowercase, remove punctuation
  const words = title
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^\w]/g, ""))
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Get unique keywords and limit to top 5
  const keywords = [...new Set(words)].slice(0, 5);

  return keywords;
}

function parseAmazonSearchHtml(html, query = "") {
  const blocks = html.match(/<div[^>]+data-component-type="s-search-result"[\s\S]*?<\/div>\s*<\/div>/gi) || [];

  return blocks
    .map((block) => {
      const asin = parseAsin(block);
      const title = parseTitle(block);
      const price = parsePrice(block);

      if (!asin || !title || !price) {
        return null;
      }

      return {
        asin,
        title,
        price,
        rating: parseRating(block),
        reviewCount: parseReviewCount(block),
        prime: parsePrime(block),
        image: parseImage(block),
        searchQuery: query,
        keywords: extractKeywords(title, query)
      };
    })
    .filter(Boolean);
}

module.exports = { parseAmazonSearchHtml };
