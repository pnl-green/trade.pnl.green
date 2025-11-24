export type ScreenshotParsePhase =
  | 'client-upload'
  | 'client-encode'
  | 'client-request'
  | 'server-receive'
  | 'server-validate'
  | 'server-model-call'
  | 'server-parse-response'
  | 'server-build-json'
  | 'client-response'
  | 'client-autofill'
  | 'client-unexpected';

export type ScreenshotParseLogEntry = {
  timestamp: string; // ISO string
  level: 'info' | 'warn' | 'error';
  phase: ScreenshotParsePhase | 'server-unexpected';
  code: string;
  message: string;
  details?: any;
};

export type ParsedLevelsPartial = {
  direction: 'LONG' | 'SHORT' | null;
  entry: number | null;
  stop: number | null;
  tp: number | null;
  confidence: number | null;
};

export type ScreenshotParseCompleteness = {
  direction: boolean;
  entry: boolean;
  stop: boolean;
  tp: boolean;
};

export type ScreenshotParseDebugPayload = {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  parsed?: ParsedLevelsPartial;
  completeness?: ScreenshotParseCompleteness;
  logs: ScreenshotParseLogEntry[];
};

export const ScreenshotParseCodes = {
  REQUEST_START: 'REQUEST_START',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  PARSE_FORM_ERROR: 'PARSE_FORM_ERROR',
  NO_FILE: 'NO_FILE',
  UNSUPPORTED_MIME: 'UNSUPPORTED_MIME',
  FILE_READ_OK: 'FILE_READ_OK',
  OPENAI_REQUEST_READY: 'OPENAI_REQUEST_READY',
  OPENAI_RESPONSE_OK: 'OPENAI_RESPONSE_OK',
  OPENAI_ERROR: 'OPENAI_ERROR',
  OPENAI_TIMEOUT: 'OPENAI_TIMEOUT',
  JSON_PARSE_OK: 'JSON_PARSE_OK',
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  JSON_EMPTY: 'JSON_EMPTY',
  MAPPING_OK: 'MAPPING_OK',
  MISSING_FIELDS: 'MISSING_FIELDS',
  REQUEST_BODY_INVALID: 'REQUEST_BODY_INVALID',
  REQUEST_BODY_OK: 'REQUEST_BODY_OK',
  UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
  CLIENT_NETWORK_ERROR: 'CLIENT_NETWORK_ERROR',
  AUTOFILL_ERROR: 'AUTOFILL_ERROR',
  AUTOFILL_SUCCESS: 'AUTOFILL_SUCCESS',
  FILE_SELECTED: 'FILE_SELECTED',
  ENCODE_OK: 'ENCODE_OK',
  ENCODE_ERROR: 'ENCODE_ERROR',
  REQUEST_SENT: 'REQUEST_SENT',
  RESPONSE_RECEIVED: 'RESPONSE_RECEIVED',
  AUTOFILL_SET_DIRECTION: 'AUTOFILL_SET_DIRECTION',
  AUTOFILL_SET_ENTRY: 'AUTOFILL_SET_ENTRY',
  AUTOFILL_SET_STOP: 'AUTOFILL_SET_STOP',
  AUTOFILL_SET_TP: 'AUTOFILL_SET_TP',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ScreenshotParseCode = (typeof ScreenshotParseCodes)[keyof typeof ScreenshotParseCodes];
