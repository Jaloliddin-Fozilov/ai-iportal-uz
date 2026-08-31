/**
 * Enterprise AI Billing & Commercial Savings Calculation Engine
 * Accurately calculates real-world commercial market value saved across major AI providers:
 * - OpenAI GPT-4o / GPT-4 Turbo
 * - Anthropic Claude 3.5 Sonnet
 * - DeepSeek R1 Commercial API
 * - OpenAI DALL-E 3 Image Generation
 */

export interface CostComparisonReport {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalRequests: number;
  imagesCount: number;
  
  // Commercial equivalent costs in USD
  openAiCostUsd: number;
  claudeCostUsd: number;
  deepSeekCostUsd: number;
  dalleCostUsd: number;
  
  // Total Free Tier Savings
  totalSavedUsd: number;
  totalSavedUzs: number;
  
  // Formatted Strings for UI
  formattedTotalSavedUsd: string;
  formattedTotalSavedUzs: string;
  formattedOpenAiCost: string;
  formattedClaudeCost: string;
  formattedDeepSeekCost: string;
  formattedDalleCost: string;
  
  // Benchmark Metrics
  equivalentComputeHours: number;
  tokensPerSecBenchmark: number;
  freeEfficiencyMultiplier: string;
}

const UZS_EXCHANGE_RATE = 13000; // 1 USD = 13,000 UZS

export function calculateBillingMetrics(
  promptTokens: number = 0,
  completionTokens: number = 0,
  totalRequests: number = 0,
  imagesCount: number = 0
): CostComparisonReport {
  const totalTokens = promptTokens + completionTokens;

  // 1. OpenAI GPT-4o Pricing: $2.50 per 1M prompt, $10.00 per 1M completion
  const openAiTextCost = (promptTokens * 0.0000025) + (completionTokens * 0.0000100);
  const openAiDalleCost = imagesCount * 0.040; // $0.04 per DALL-E 3 image
  const openAiTotal = openAiTextCost + openAiDalleCost;

  // 2. Anthropic Claude 3.5 Sonnet Pricing: $3.00 per 1M prompt, $15.00 per 1M completion
  const claudeTextCost = (promptTokens * 0.0000030) + (completionTokens * 0.0000150);
  const claudeTotal = claudeTextCost + openAiDalleCost;

  // 3. DeepSeek R1 Official Commercial API: $0.55 per 1M prompt, $2.19 per 1M completion
  const deepSeekTextCost = (promptTokens * 0.00000055) + (completionTokens * 0.00000219);
  const deepSeekTotal = deepSeekTextCost + openAiDalleCost;

  // 4. Calculate Net Commercial Value Saved (Baseline: GPT-4o & Claude 3.5 standard tier)
  const baselineSavedUsd = Math.max(0, (openAiTotal + claudeTotal) / 2);
  const totalSavedUzs = Math.round(baselineSavedUsd * UZS_EXCHANGE_RATE);

  // Compute metrics
  const equivalentComputeHours = parseFloat((totalTokens / (350 * 3600)).toFixed(2)); // At 350 tok/s average
  const tokensPerSecBenchmark = 1000; // Cerebras peak

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    totalRequests,
    imagesCount,
    
    openAiCostUsd: parseFloat(openAiTotal.toFixed(4)),
    claudeCostUsd: parseFloat(claudeTotal.toFixed(4)),
    deepSeekCostUsd: parseFloat(deepSeekTotal.toFixed(4)),
    dalleCostUsd: parseFloat(openAiDalleCost.toFixed(4)),
    
    totalSavedUsd: parseFloat(baselineSavedUsd.toFixed(2)),
    totalSavedUzs,
    
    formattedTotalSavedUsd: `$${baselineSavedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedTotalSavedUzs: `${totalSavedUzs.toLocaleString('uz-UZ')} so'm`,
    formattedOpenAiCost: `$${openAiTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedClaudeCost: `$${claudeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedDeepSeekCost: `$${deepSeekTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedDalleCost: `$${openAiDalleCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    
    equivalentComputeHours,
    tokensPerSecBenchmark,
    freeEfficiencyMultiplier: '100% Free Edge Clustered',
  };
}
