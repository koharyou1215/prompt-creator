import { NextResponse } from "next/server";

/**
 * API Response type for consistent typing
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Unified error handler for API routes
 */
export function handleApiError(error: unknown, message: string): NextResponse {
  // Log the actual error for debugging
  console.error(message, error);

  // Extract error message if available
  let errorMessage = message;
  if (error instanceof Error) {
    errorMessage = `${message}: ${error.message}`;
  }

  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  );
}

/**
 * Success response helper
 */
export function handleApiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Type guard for checking if value is a valid record
 */
export function isValidRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extract and validate ID from params
 */
export function extractId(params: unknown): string | null {
  if (!isValidRecord(params)) return null;

  const id = params.id;
  if (typeof id === 'string' && id.length > 0) {
    return id;
  }
  return null;
}