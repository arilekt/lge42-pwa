
async function generateMultipleGroups() {
  const response = await fetch('./data/heatmap.json');
  const heatmap = await response.json();

  // Internal generate with noise
  const generateOnce = (heatmap, noisePercent) => {
    let number = '';
    let totalWeight = 0;
    let selectedWeight = 0;

    for (let i = 1; i <= 6; i++) {
      const positionKey = `pos${i}`;
      const digitWeights = heatmap[positionKey];
      const digits = Object.keys(digitWeights);

      const weights = digits.map(d => {
        const base = digitWeights[d];
        const noise = base * noisePercent * (Math.random() * 2 - 1); // ±noise%
        return Math.max(0, base + noise);
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

  // Define group config
  const groupConfig = {
    "best-heatmap": { count: 2, noise: 0.02 },
    "cold-random": { count: 2, noise: 0.2 },
    "pure-random": { count: 2, noise: 0.5 },
    "heat-bias": { count: 2, noise: 0.1 },
    "bias-matrix": { count: 2, noise: 0.08 },
    "pattern-biased": { count: 2, noise: 0.15 }
  };

  const result = {};

  for (const [groupName, config] of Object.entries(groupConfig)) {
    result[groupName] = [];
    for (let i = 0; i < config.count; i++) {
      result[groupName].push(generateOnce(heatmap, config.noise));
    }
  }

  return result;
}
