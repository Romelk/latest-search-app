import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../config';

let vertexAI: VertexAI | null = null;

export function getVertexAI(): VertexAI {
  if (!vertexAI) {
    vertexAI = new VertexAI({
      project: config.gcp.projectId,
      location: config.gcp.region,
    });
  }
  return vertexAI;
}

export async function callGemini(prompt: string): Promise<string> {
  try {
    const vertex = getVertexAI();
    const model = vertex.getGenerativeModel({
      model: config.gcp.vertexModelName,
    });

    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    const response = await model.generateContent(request);
    const result = response.response;

    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const candidate = result.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Invalid response structure from Gemini');
    }

    const text = candidate.content.parts[0].text || '';
    return text.trim();
  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw error;
  }
}

export async function callGeminiJSON<T>(prompt: string): Promise<T> {
  const response = await callGemini(prompt);

  try {
    // Extract JSON from markdown code blocks if present
    let jsonStr = response;
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object in the response
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('Error parsing Gemini JSON response:', response);
    throw new Error('Failed to parse JSON from Gemini response');
  }
}
