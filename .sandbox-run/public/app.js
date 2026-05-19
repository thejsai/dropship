const form = document.getElementById("search-form");
const results = document.getElementById("results");
const resultsMeta = document.getElementById("results-meta");
const statusLine = document.getElementById("status-line");
const template = document.getElementById("product-card-template");

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value || 0);
}

function renderProducts(payload) {
  results.innerHTML = "";

  if (!payload.products.length) {
    results.innerHTML = '<p class="subtle">No products returned for this run.</p>';
    return;
  }

  payload.products.forEach((product) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".product-image").src =
      product.image || "https://placehold.co/600x600/f0e7d7/6c746c?text=No+Image";
    fragment.querySelector(".product-image").alt = product.title;
    fragment.querySelector(".score-pill").textContent = `Score ${product.opportunityScore}/100`;
    fragment.querySelector(".product-title").textContent = product.title;
    fragment.querySelector(".product-recommendation").textContent = product.recommendation;
    fragment.querySelector(".price").textContent = formatPrice(product.price);
    fragment.querySelector(".rating").textContent = product.rating ? `${product.rating}/5` : "N/A";
    fragment.querySelector(".reviews").textContent = formatNumber(product.reviewCount);
    fragment.querySelector(".prime").textContent = product.prime ? "Yes" : "No";
    
    // Display keywords
    if (product.keywords && product.keywords.length) {
      const keywordsTags = fragment.querySelector(".keywords-tags");
      keywordsTags.innerHTML = product.keywords
        .map(kw => `<span class="keyword-tag">${kw}</span>`)
        .join("");
    }
    
    fragment.querySelector(".asin").textContent = `ASIN: ${product.asin}`;
    results.appendChild(fragment);
  });
}

async function runSearch(event) {
  event.preventDefault();

  const query = document.getElementById("query").value.trim();
  const source = document.getElementById("source").value;
  const marketplace = document.getElementById("marketplace").value;

  statusLine.textContent = "Running search...";
  resultsMeta.textContent = "Loading...";

  const params = new URLSearchParams({ q: query, source, marketplace });
  const response = await fetch(`/api/search?${params.toString()}`);
  const payload = await response.json();

  if (!response.ok) {
    results.innerHTML = `<p class="subtle">${payload.error}: ${payload.details || ""}</p>`;
    resultsMeta.textContent = "Search failed";
    statusLine.textContent = "The request did not complete.";
    return;
  }

  statusLine.textContent = payload.sourceNote;
  resultsMeta.textContent = `${payload.products.length} products from ${payload.mode}`;
  renderProducts(payload);
}

form.addEventListener("submit", runSearch);
