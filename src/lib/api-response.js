import { NextResponse } from 'next/server';

/**
 * Standardised success response payload creator.
 *
 * @param {*} data - Payload returned to client
 * @param {string} message - Operation descriptor
 * @param {number} status - HTTP status code
 * @returns {NextResponse}
 */
export function successResponse(data, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      error: null,
    },
    { status }
  );
}

/**
 * Standardised error response payload creator.
 *
 * @param {string} message - User facing error details
 * @param {string} code - Machine readable semantic error code
 * @param {*} details - Auxiliary nested error mappings (e.g. Zod lists)
 * @param {number} status - HTTP status code
 * @returns {NextResponse}
 */
export function errorResponse(message, code = 'UNKNOWN_ERROR', details = null, status = 400) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
      error: {
        code,
        details,
      },
    },
    { status }
  );
}
