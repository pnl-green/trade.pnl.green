"use client";

import { ChatBox, BtnWithIcon } from '@/styles/pnl.styles';
import { Box, Button, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from './ui/Tooltip';
import { intelayerColors } from '@/styles/theme';
import { useOrderTicketContext, type OrderDirection } from '@/context/orderTicketContext';
import { askLLM } from '@/services/llmRouter';
import {
  ScreenshotParseCodes,
  type ParsedLevelsPartial,
  type ScreenshotParseDebugPayload,
  type ScreenshotParseLogEntry,
  type ScreenshotParseCompleteness,
} from '@/types/screenshotParsing';
import Loader from './loaderSpinner';

type MessageType = 'text' | 'image' | 'warning' | 'status';

interface MessageProps {
  id: string;
  role: 'user' | 'assistant';
  type: MessageType;
  content: string;
  imageUrl?: string;
  status?: 'processing' | 'done' | 'error';
}

const ChatComponent = () => {
  const chatMessagesRef = useRef<HTMLElement | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [typing, setTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [debugLogs, setDebugLogs] = useState<ScreenshotParseLogEntry[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [activeDebugMessageId, setActiveDebugMessageId] = useState<string | null>(null);

  const { setDirection, applyAutofill } = useOrderTicketContext();

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: MessageProps) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateMessage = (id: string, updater: Partial<MessageProps>) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === id ? { ...message, ...updater } : message))
    );
  };

  const sendPrompt = async (prompt: string) => {
    setTyping(true);
    const { message, model } = await askLLM({ prompt });
    addMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      type: 'text',
      content: message || 'No response',
      model,
    });
    setTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const id = crypto.randomUUID();
    addMessage({ id, role: 'user', type: 'text', content: inputMessage.trim() });
    const prompt = inputMessage.trim();
    setInputMessage('');
    await sendPrompt(prompt);
  };

  const logDebug = (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[ChatComponent]', ...args);
    }
  };

  const pushClientLog = useCallback(
    (entry: Omit<ScreenshotParseLogEntry, 'timestamp'>) => {
      setDebugLogs((prev) => [...prev, { ...entry, timestamp: new Date().toISOString() }]);
    },
    []
  );

  const uploadScreenshot = async (file: File): Promise<ScreenshotParseDebugPayload> => {
    const formData = new FormData();
    try {
      formData.append('image', file, file.name || 'chart.png');
      pushClientLog({
        level: 'info',
        phase: 'client-encode',
        code: ScreenshotParseCodes.ENCODE_OK,
        message: 'Prepared form data for upload',
        details: { name: file.name, size: file.size },
      });
    } catch (error) {
      pushClientLog({
        level: 'error',
        phase: 'client-encode',
        code: ScreenshotParseCodes.ENCODE_ERROR,
        message: 'Failed to attach image to form data',
        details: { message: (error as Error)?.message },
      });
      throw error;
    }

    logDebug('Uploading screenshot', { name: file.name, size: file.size });
    pushClientLog({
      level: 'info',
      phase: 'client-request',
      code: ScreenshotParseCodes.REQUEST_SENT,
      message: 'Sending screenshot to backend',
      details: { endpoint: '/api/parse-trade-screenshot', sizeBytes: file.size },
    });

    let response: Response;
    try {
      response = await fetch('/api/parse-trade-screenshot', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      pushClientLog({
        level: 'error',
        phase: 'client-request',
        code: ScreenshotParseCodes.CLIENT_NETWORK_ERROR,
        message: 'Network error sending screenshot',
        details: { message: (error as Error)?.message },
      });
      throw error;
    }

    pushClientLog({
      level: 'info',
      phase: 'client-response',
      code: ScreenshotParseCodes.RESPONSE_RECEIVED,
      message: 'Received response from backend',
      details: { httpStatus: response.status },
    });

    let payload: ScreenshotParseDebugPayload | null = null;
    try {
      payload = (await response.json()) as ScreenshotParseDebugPayload;
    } catch (error) {
      pushClientLog({
        level: 'error',
        phase: 'client-response',
        code: ScreenshotParseCodes.JSON_PARSE_ERROR,
        message: 'Failed to parse JSON response',
        details: { message: (error as Error)?.message },
      });
    }

    if (!payload) {
      payload = {
        success: false,
        errorCode: ScreenshotParseCodes.JSON_PARSE_ERROR,
        errorMessage: 'Unable to parse response payload',
        logs: [],
      };
    }

    setDebugLogs((prev) => [
      ...prev,
      ...(payload.logs || []).map((log) => ({ ...log, level: log.level ?? 'info' })),
    ]);

    if (!payload.success) {
      pushClientLog({
        level: 'error',
        phase: 'client-response',
        code: payload.errorCode || ScreenshotParseCodes.UNKNOWN_ERROR,
        message: payload.errorMessage || 'Unable to extract trade levels from this screenshot.',
      });
    }

    return payload;
  };

  const applyParsedAutofill = useCallback(
    (
      parsed?: ParsedLevelsPartial | null,
      completeness?: ScreenshotParseCompleteness
    ): {
      anyApplied: boolean;
      hasRequired: boolean;
      allFields: boolean;
      detectedFields: string[];
      missingFields: string[];
    } => {
      const detectedFields: string[] = [];
      const missingFields: string[] = [];

      if (!parsed) {
        pushClientLog({
          level: 'error',
          phase: 'client-autofill',
          code: ScreenshotParseCodes.AUTOFILL_ERROR,
          message: 'No parsed payload available for autofill',
        });

        return {
          anyApplied: false,
          hasRequired: false,
          allFields: false,
          detectedFields,
          missingFields: ['Direction', 'Entry', 'Stop Loss', 'Take Profit'],
        };
      }

      const resolvedCompleteness: ScreenshotParseCompleteness =
        completeness ?? {
          direction: parsed.direction !== null,
          entry: parsed.entry !== null,
          stop: parsed.stop !== null,
          tp: parsed.tp !== null,
        };

      const ensureTpSlEnabled = () => {
        applyAutofill({ tpSlEnabled: true });
      };

      let anyApplied = false;

      if (parsed.direction) {
        const orderDirection: OrderDirection = parsed.direction === 'SHORT' ? 'sell' : 'buy';
        pushClientLog({
          level: 'info',
          phase: 'client-autofill',
          code: ScreenshotParseCodes.AUTOFILL_SET_DIRECTION,
          message: 'Setting ticket direction from screenshot',
          details: { direction: orderDirection },
        });
        setDirection(orderDirection);
        detectedFields.push('Direction');
        anyApplied = true;
      }

      if (parsed.entry != null) {
        pushClientLog({
          level: 'info',
          phase: 'client-autofill',
          code: ScreenshotParseCodes.AUTOFILL_SET_ENTRY,
          message: 'Applying entry from screenshot',
          details: { entry: parsed.entry },
        });
        applyAutofill({ limitPrice: parsed.entry.toString(), switchToLimit: true });
        detectedFields.push('Entry');
        anyApplied = true;
      }

      if (parsed.stop != null) {
        ensureTpSlEnabled();
        pushClientLog({
          level: 'info',
          phase: 'client-autofill',
          code: ScreenshotParseCodes.AUTOFILL_SET_STOP,
          message: 'Applying stop from screenshot',
          details: { stop: parsed.stop },
        });
        applyAutofill({ stopLoss: parsed.stop.toString(), tpSlEnabled: true, switchToLimit: true });
        detectedFields.push('Stop Loss');
        anyApplied = true;
      }

      if (parsed.tp != null) {
        ensureTpSlEnabled();
        pushClientLog({
          level: 'info',
          phase: 'client-autofill',
          code: ScreenshotParseCodes.AUTOFILL_SET_TP,
          message: 'Applying take profit from screenshot',
          details: { tp: parsed.tp },
        });
        applyAutofill({ takeProfits: [parsed.tp.toString()], tpSlEnabled: true, switchToLimit: true });
        detectedFields.push('Take Profit');
        anyApplied = true;
      }

      if (!resolvedCompleteness.direction) missingFields.push('Direction');
      if (!resolvedCompleteness.entry) missingFields.push('Entry');
      if (!resolvedCompleteness.stop) missingFields.push('Stop Loss');
      if (!resolvedCompleteness.tp) missingFields.push('Take Profit');

      pushClientLog({
        level: resolvedCompleteness.direction && resolvedCompleteness.entry ? 'info' : 'warn',
        phase: 'client-autofill',
        code: ScreenshotParseCodes.AUTOFILL_SUCCESS,
        message: 'Applied parsed values to ticket',
        details: { detectedFields, missingFields },
      });

      return {
        anyApplied,
        hasRequired: resolvedCompleteness.direction && resolvedCompleteness.entry,
        allFields:
          resolvedCompleteness.direction &&
          resolvedCompleteness.entry &&
          resolvedCompleteness.stop &&
          resolvedCompleteness.tp,
        detectedFields,
        missingFields,
      };
    },
    [applyAutofill, pushClientLog, setDirection]
  );

  const processScreenshot = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const uploadId = crypto.randomUUID();
    const statusId = crypto.randomUUID();

    logDebug('Processing screenshot start');
    setDebugLogs([]);
    setShowDebugLogs(false);
    setActiveDebugMessageId(uploadId);
    pushClientLog({
      level: 'info',
      phase: 'client-upload',
      code: ScreenshotParseCodes.FILE_SELECTED,
      message: 'User provided screenshot for parsing',
      details: { name: file.name, size: file.size, type: file.type },
    });
    addMessage({
      id: uploadId,
      role: 'user',
      type: 'image',
      content: 'Chart uploaded',
      imageUrl: previewUrl,
      status: 'processing',
    });

    addMessage({
      id: statusId,
      role: 'assistant',
      type: 'status',
      content: 'Processing screenshot…',
      status: 'processing',
    });

    setTyping(true);
    try {
      const payload = await uploadScreenshot(file);
      const status: MessageProps['status'] = payload.success ? 'done' : 'error';
      updateMessage(uploadId, { status });
      updateMessage(statusId, {
        content: payload.success
          ? 'Screenshot processed successfully.'
          : payload.errorMessage || 'Unable to process screenshot.',
        status,
      });

      if (payload.success && payload.parsed) {
        const autofillOutcome = applyParsedAutofill(payload.parsed, payload.completeness);

        const detectedList =
          autofillOutcome.detectedFields.length > 0
            ? autofillOutcome.detectedFields.join(', ')
            : 'None';
        const missingList =
          autofillOutcome.missingFields.length > 0
            ? autofillOutcome.missingFields.join(', ')
            : 'None';

        const content = autofillOutcome.allFields
          ? '✅ Filled direction, entry, stop, and take profit from your chart. Please confirm.'
          : `⚠️ Partially filled from your chart. Detected: ${detectedList}. Missing: ${missingList}. Please review and complete any missing values.`;

        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'status',
          content,
          status: 'done',
        });
      } else {
        const errorMessage = (() => {
          switch (payload.errorCode) {
            case ScreenshotParseCodes.JSON_PARSE_ERROR:
              return '❌ Could not read levels from this screenshot (response was not valid JSON). Please try a clearer screenshot.';
            case ScreenshotParseCodes.OPENAI_ERROR:
            case ScreenshotParseCodes.OPENAI_TIMEOUT:
              return '❌ Our parsing service is unavailable right now. Please try again in a moment.';
            default:
              return payload.errorMessage
                ? `❌ ${payload.errorMessage}`
                : `❌ Unable to extract trade levels from this screenshot.${
                    payload.errorCode ? ` (code: ${payload.errorCode})` : ''
                  }`;
          }
        })();

        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'warning',
          content: errorMessage,
        });
      }
    } catch (error) {
      console.error(error);
      pushClientLog({
        level: 'error',
        phase: 'client-unexpected',
        code: ScreenshotParseCodes.UNKNOWN_ERROR,
        message: 'Unexpected client-side error processing screenshot',
        details: { message: (error as Error)?.message },
      });
      const message = (error as Error).message || 'Unable to process screenshot.';
      updateMessage(uploadId, { status: 'error' });
      updateMessage(statusId, { content: message, status: 'error' });
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'warning',
        content: message,
      });
    } finally {
      setTyping(false);
      setTimeout(() => URL.revokeObjectURL(previewUrl), 3000);
      logDebug('Processing screenshot end');
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFile = Array.from(files).find((file) => file.type.startsWith('image/'));
    if (imageFile) {
      processScreenshot(imageFile);
    }
  };

  const handlePasteIntoInput = (
    event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            processScreenshot(file);
            return;
          }
        }
      }
    }

    const files = event.clipboardData?.files;
    if (files && files.length) {
      const imageFile = Array.from(files).find((file) => file.type.startsWith('image/'));
      if (imageFile) {
        event.preventDefault();
        processScreenshot(imageFile);
      }
    }
  };

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    },
    onDragLeave: () => setDragActive(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
  };

  const renderMessage = (message: MessageProps) => {
    if (message.type === 'image' && message.imageUrl) {
      return (
        <Box sx={{ position: 'relative' }}>
          <img src={message.imageUrl} alt="uploaded" className="image_bubble" />
          {message.status === 'processing' && (
            <Box className="image_status">
              <Loader message="Processing…" />
            </Box>
          )}
          {message.status === 'error' && (
            <Box className="image_status image_status-error">Processing failed</Box>
          )}
          {message.id === activeDebugMessageId && debugLogs.length > 0 && (
            <Box sx={{ marginTop: '10px' }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowDebugLogs((prev) => !prev)}
                sx={{
                  color: intelayerColors.muted,
                  textTransform: 'none',
                  fontSize: '12px',
                  padding: 0,
                }}
              >
                ⚙️ Debug: Screenshot parsing logs ({debugLogs.length}) {showDebugLogs ? '[Hide]' : '[Show]'}
              </Button>
              {showDebugLogs && (
                <Box
                  sx={{
                    marginTop: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: intelayerColors.muted,
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                >
                  {debugLogs.map((log, index) => (
                    <Box key={`${log.timestamp}-${log.code}-${index}`} sx={{ marginBottom: '6px' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        [{log.timestamp}] {log.level} {log.phase} {log.code} – {log.message}
                      </Typography>
                      {log.details && (
                        <Box
                          component="pre"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: intelayerColors.ink,
                            backgroundColor: 'rgba(0,0,0,0.15)',
                            padding: '6px',
                            borderRadius: '4px',
                          }}
                        >
                          {JSON.stringify(log.details, null, 2)}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      );
    }
    if (message.type === 'status') {
      const palette =
        message.status === 'done'
          ? { bg: 'rgba(14, 240, 157, 0.12)', color: '#0EF09D' }
          : message.status === 'error'
            ? { bg: 'rgba(255, 68, 68, 0.15)', color: '#FF7373' }
            : { bg: 'rgba(255, 255, 255, 0.08)', color: intelayerColors.muted };
      return (
        <Box
          sx={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: palette.bg,
            color: palette.color,
          }}
        >
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            {message.content}
          </Typography>
        </Box>
      );
    }
    if (message.type === 'warning') {
      return <Box className="warning_bubble">{message.content}</Box>;
    }
    return (
      <Box>
        <Typography variant="body2" color={intelayerColors.ink}>
          {message.content}
        </Typography>
      </Box>
    );
  };

  return (
    <ChatBox {...dropHandlers} className={dragActive ? 'drag-active' : ''}>
      <Box className="header_nav">
        <Tooltip content="Route prompts to the best model and sync direction with the ticket.">
          <header>Intelayer Assistant</header>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </Box>
      <Box className="chat_room">
        <Box className="chat_messages" ref={chatMessagesRef}>
          {messages.map((message) => (
            <Box key={message.id} className={message.role === 'user' ? 'send_bubble' : 'received_bubble'}>
              {renderMessage(message)}
            </Box>
          ))}
          {typing && <Box className="typing">Thinking…</Box>}
        </Box>

        <Box className="chat_input">
          <input
            type="text"
            placeholder="Type, paste, or drop a chart"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onPaste={handlePasteIntoInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Box sx={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="text"
              onClick={() => fileInputRef.current?.click()}
              sx={{ color: intelayerColors.muted, textTransform: 'none' }}
            >
              Attach
            </Button>
            <BtnWithIcon onClick={handleSendMessage} aria-label="Send message">
              <img src="/sendIcon.svg" alt="send" />
            </BtnWithIcon>
          </Box>
        </Box>
      </Box>
    </ChatBox>
  );
};

export default ChatComponent;
