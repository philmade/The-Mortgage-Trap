import { GoogleGenAI } from "@google/genai";
import { MortgageResult } from "../types";

// Initialize the Gemini API client
// Using environment variable as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMortgageAdvice = async (
  region: string,
  amount: number,
  rate: number,
  years: number,
  result: MortgageResult,
  overpaymentResult?: MortgageResult
): Promise<string> => {
  
  const modelId = "gemini-2.5-flash";

  const interestPercent = Math.round((result.totalInterest / result.totalPrincipal) * 100);
  
  let prompt = `
    You are a witty, brutally honest, financial expert. 
    The user is looking at a mortgage in ${region}.
    
    Here are the stats:
    - Principal: ${amount}
    - Interest Rate: ${rate}%
    - Term: ${years} years
    - Total Interest Payable: ${Math.round(result.totalInterest)}
    - That is ${interestPercent}% of the house value just in interest!
  `;

  if (overpaymentResult) {
    const savedInterest = result.totalInterest - overpaymentResult.totalInterest;
    const savedYears = result.yearsToPayOff - overpaymentResult.yearsToPayOff;
    prompt += `
      Comparison:
      If they use the simulator settings (overpayment/shorter term), they save ${Math.round(savedInterest)} and ${savedYears.toFixed(1)} years.
    `;
  }

  prompt += `
    Give a short, punchy, 2-sentence summary.
    1st sentence: Acknowledge the horror of the standard deal (use a metaphor like "feeding the bank").
    2nd sentence: If the overpayment saves money, enthusiastically recommend it. If not, warn them about the rate.
    Don't use markdown formatting like bold or italics. Just plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to fetch Gemini advice", error);
    return "The math speaks for itself: Interest is the silent wealth killer.";
  }
};
