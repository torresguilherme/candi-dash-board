/**
 * Error utility to map technical errors to user-friendly messages
 * This prevents leaking internal implementation details to users
 */

type ErrorCode = string;

const errorMessages: Record<ErrorCode, string> = {
  // Auth errors
  'Invalid login credentials': 'Email ou senha incorretos',
  'invalid_credentials': 'Email ou senha incorretos',
  'user_not_found': 'Usuário não encontrado',
  'invalid_email': 'Email inválido',
  'weak_password': 'A senha deve ter no mínimo 6 caracteres',
  'email_exists': 'Este email já está cadastrado',
  'User already registered': 'Este email já está cadastrado',
  'already registered': 'Este email já está cadastrado',
  
  // Database constraint errors
  '23505': 'Este registro já existe',
  '23503': 'Operação não permitida - dados relacionados existem',
  '23514': 'Dados inválidos - verifique os campos preenchidos',
  '42501': 'Você não tem permissão para realizar esta ação',
  '42P01': 'Recurso não encontrado',
  
  // Storage errors
  'storage/object-not-found': 'Arquivo não encontrado',
  'storage/unauthorized': 'Sem permissão para acessar este arquivo',
  'storage/quota-exceeded': 'Limite de armazenamento atingido',
  
  // Network errors
  'fetch_error': 'Erro de conexão. Verifique sua internet.',
  'network_error': 'Erro de conexão. Verifique sua internet.',
  
  // RLS errors
  'new row violates row-level security policy': 'Você não tem permissão para realizar esta ação',
};

/**
 * Maps technical error messages to user-friendly messages
 * Always returns a safe message that doesn't leak implementation details
 */
export function getUserFriendlyError(error: unknown, defaultMessage?: string): string {
  const fallback = defaultMessage || 'Ocorreu um erro. Tente novamente.';
  
  if (!error) {
    return fallback;
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check error code first (Supabase/PostgreSQL errors)
    const anyError = error as any;
    if (anyError.code && errorMessages[anyError.code]) {
      return errorMessages[anyError.code];
    }
    
    // Check message matches
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        return message;
      }
    }
    
    return fallback;
  }

  // Handle plain objects with message/code properties
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    // Check code first
    if (typeof errorObj.code === 'string' && errorMessages[errorObj.code]) {
      return errorMessages[errorObj.code];
    }
    
    // Check message
    if (typeof errorObj.message === 'string') {
      for (const [key, message] of Object.entries(errorMessages)) {
        if (errorObj.message.includes(key)) {
          return message;
        }
      }
    }
    
    return fallback;
  }

  // Handle string errors
  if (typeof error === 'string') {
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.includes(key)) {
        return message;
      }
    }
  }

  return fallback;
}

/**
 * Sanitizes data before sending to external services (webhooks, APIs)
 * Removes potentially harmful characters and enforces length limits
 */
export function sanitizeForExternalApi(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove control characters and limit length
      sanitized[key] = value
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim()
        .slice(0, 1000); // Limit to 1000 chars
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    }
    // Skip other complex types for external APIs
  }
  
  return sanitized;
}
