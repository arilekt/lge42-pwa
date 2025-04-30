
async function generateWeightedNumber(options = { count: 5, noisePercent: 0.1 }) {
  const response = await fetch('./data/heatmap.json');
  const heatmap = await response.json();

  const generateOnce = () => {
    let number = '';
    let totalWeight = 0;
    let selectedWeight = 0;

    for (let i = 1; i <= 6; i++) {
      const positionKey = `pos${i}`;
      const digitWeights = heatmap[positionKey];
      const digits = Object.keys(digitWeights);

      // Add noise to weights
      const weights = digits.map(d => {
        const base = digitWeights[d];
        const noise = base * options.noisePercent * (Math.random() * 2 - 1); // ±noise%
        return Math.max(0, base + noise); // Ensure no negative weight
      });

      const sumWeights = weights.reduce((a, b) => a + b, 0);
      totalWeight += sumWeights;

      const rand = Math.random() * sumWeights;
      let cumulative = 0;
      let selectedDigit = digits[0];

      for (let j = 0; j < digits.length; j++) {
        cumulative += weights[j];
        if (rand <= cumulative) {
          selectedDigit = digits[j];
          selectedWeight += weights[j];
          break;
        }
      }

      number += selectedDigit;
    }

    const confidence = ((selectedWeight / totalWeight) * 100);
    return {
      number,
      confidence: parseFloat(confidence.toFixed(2))
    };
  };

  // Generate multiple candidates
  const candidates = Array.from({ length: options.count }, () => generateOnce());
  return candidates.reduce((best, current) => current.confidence > best.confidence ? current : best);
}
