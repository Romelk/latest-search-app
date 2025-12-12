/**
 * AI Fashion Toolkit API Client
 */

import {
  ToolkitResponse,
  ToolkitError,
  StyleAnalysisResult,
  CompatibilityResult,
  SessionUsage,
  ToolMetadata,
} from '../types/toolkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ==================== Helper Functions ====================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ToolkitError = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

function getSessionId(): string {
  // Get or create session ID
  if (typeof window === 'undefined') return 'default';

  let sessionId = localStorage.getItem('toolkit_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('toolkit_session_id', sessionId);
  }
  return sessionId;
}

// ==================== Feature 1: Style Analyzer ====================

export async function analyzeStyle(
  imageDataUrl: string
): Promise<ToolkitResponse<StyleAnalysisResult>> {
  const sessionId = getSessionId();

  const response = await fetch(`${API_BASE_URL}/toolkit/analyze-style`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({
      session_id: sessionId,
      image: imageDataUrl,
    }),
  });

  return handleResponse<ToolkitResponse<StyleAnalysisResult>>(response);
}

// ==================== Feature 2: Compatibility Checker ====================

export async function checkCompatibility(
  image1DataUrl: string,
  image2DataUrl: string
): Promise<ToolkitResponse<CompatibilityResult>> {
  const sessionId = getSessionId();

  const response = await fetch(`${API_BASE_URL}/toolkit/check-compatibility`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({
      session_id: sessionId,
      image1: image1DataUrl,
      image2: image2DataUrl,
    }),
  });

  return handleResponse<ToolkitResponse<CompatibilityResult>>(response);
}

// ==================== Session Management ====================

export async function getSessionUsage(): Promise<SessionUsage> {
  const sessionId = getSessionId();

  const response = await fetch(
    `${API_BASE_URL}/toolkit/session/${sessionId}/usage`,
    {
      headers: {
        'X-Session-ID': sessionId,
      },
    }
  );

  const data = await handleResponse<{ success: boolean; session_id: string; usage: SessionUsage }>(
    response
  );
  return data.usage;
}

export async function getUsageHistory(limit: number = 50) {
  const sessionId = getSessionId();

  const response = await fetch(
    `${API_BASE_URL}/toolkit/session/${sessionId}/history?limit=${limit}`,
    {
      headers: {
        'X-Session-ID': sessionId,
      },
    }
  );

  return handleResponse<{
    success: boolean;
    session_id: string;
    history: any[];
    count: number;
  }>(response);
}

// ==================== Tool Metadata ====================

export async function getAvailableTools(): Promise<ToolMetadata[]> {
  const response = await fetch(`${API_BASE_URL}/toolkit/tools`);
  const data = await handleResponse<{
    success: boolean;
    tools: ToolMetadata[];
    count: number;
  }>(response);
  return data.tools;
}

// ==================== Utility Functions ====================

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('toolkit_session_id');
  }
}
