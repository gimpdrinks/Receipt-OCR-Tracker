
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    transaction_name: {
      type: Type.STRING,
      description: "The primary name of the merchant or a brief description of the transaction (e.g., 'Starbucks,' 'Monthly Subscription'). Set to null if not found.",
    },
    total_amount: {
      type: Type.NUMBER,
      description: "The final amount of the transaction. Look for 'Total' or 'Amount Due'. Set to null if not found.",
    },
    transaction_date: {
      type: Type.STRING,
      description: "The date the transaction occurred in YYYY-MM-DD format. Prioritize the primary transaction date. Set to null if not found.",
    },
    category: {
      type: Type.STRING,
      description: "Assign a category from the following list: Food & Drink, Groceries, Transportation, Utilities, Rent/Mortgage, Shopping, Entertainment, Health & Wellness, Travel, Other. Set to null if unclear.",
    },
  },
  required: ["transaction_name", "total_amount", "transaction_date", "category"],
};

export const analyzeReceiptImage = async (mimeType: string, base64Data: string): Promise<ReceiptData> => {
  const prompt = `
    Analyze the provided receipt image. Perform OCR and extract the following information:
    - Transaction Name/Description: The merchant name or transaction description.
    - Total Amount: The final amount paid.
    - Transaction Date: The date of the transaction.
    - Category: Classify the transaction based on the merchant.
    
    Follow these rules strictly:
    - If you cannot confidently determine a piece of information, set its value to null.
    - If multiple dates are present, prioritize the primary transaction date.
    - If the total amount is unclear, look for keywords like "Total," "Amount Due," or the largest numerical value that logically represents the total.
    - Return the data in the specified JSON format.
  `;

  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };

  const textPart = {
    text: prompt,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart, imagePart] },
    config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    }
  });

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as ReceiptData;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText);
    throw new Error("Received an invalid format from the API.");
  }
};
