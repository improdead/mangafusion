import { Logger } from '@nestjs/common';

const logger = new Logger('PrismaErrorHandler');

export class PrismaError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: any,
  ) {
    super(message);
    this.name = 'PrismaError';
  }
}

/**
 * Wraps a Prisma operation with error handling and logging
 */
export async function withPrismaErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  fallbackValue?: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`Prisma operation failed: ${operation}`, error);

    // Check for common Prisma error codes
    const prismaError = error as any;
    const code = prismaError?.code;
    const meta = prismaError?.meta;

    let errorMessage = 'Database operation failed';

    switch (code) {
      case 'P2002':
        // Unique constraint violation
        errorMessage = `Duplicate entry: ${meta?.target?.join(', ') || 'unknown field'}`;
        break;
      case 'P2003':
        // Foreign key constraint violation
        errorMessage = 'Referenced record does not exist';
        break;
      case 'P2025':
        // Record not found
        errorMessage = 'Record not found';
        break;
      case 'P2014':
        // Required relation violation
        errorMessage = 'Related record is required';
        break;
      case 'P2034':
        // Transaction conflict
        errorMessage = 'Transaction conflict, please retry';
        break;
      default:
        if (error instanceof Error) {
          errorMessage = error.message;
        }
    }

    // If fallback value is provided, log and return it
    if (fallbackValue !== undefined) {
      logger.warn(`Using fallback value for operation: ${operation}`);
      return fallbackValue;
    }

    // Otherwise throw a PrismaError
    throw new PrismaError(errorMessage, operation, error);
  }
}

/**
 * Wraps a Prisma transaction with error handling
 */
export async function withPrismaTransaction<T>(
  prismaClient: any,
  operation: string,
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  return withPrismaErrorHandling(operation, async () => {
    return await prismaClient.$transaction(fn, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    });
  });
}
