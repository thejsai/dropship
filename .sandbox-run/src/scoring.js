function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeOpportunityScore(product) {
  const priceScore = clamp((product.price - 10) * 1.5, 0, 40);
  const ratingScore = product.rating ? clamp((product.rating - 3.5) * 20, 0, 30) : 10;
  const reviewScore = clamp(35 - Math.log10((product.reviewCount || 1) + 1) * 12, 5, 35);
  const primeScore = product.prime ? 8 : 0;

  return Math.round(priceScore + ratingScore + reviewScore + primeScore);
}

function buildRecommendation(product) {
  if (product.opportunityScore >= 80) {
    return "High potential: strong price point with manageable competition.";
  }

  if (product.opportunityScore >= 60) {
    return "Worth validating: decent margin room and competition is not saturated.";
  }

  return "Low priority: likely crowded or too weak on margin/reviews.";
}

function scoreProducts(products) {
  return products
    .map((product) => {
      const opportunityScore = computeOpportunityScore(product);

      return {
        ...product,
        opportunityScore,
        recommendation: buildRecommendation({ ...product, opportunityScore })
      };
    })
    .sort((left, right) => right.opportunityScore - left.opportunityScore);
}

module.exports = {
  scoreProducts,
  computeOpportunityScore
};
