"use client";

import { ChatBox, BtnWithIcon } from '@/styles/pnl.styles';
import { Box, Button, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from './ui/Tooltip';
import { intelayerColors } from '@/styles/theme';
import { useOrderTicketContext } from '@/context/orderTicketContext';
import { askLLM } from '@/services/llmRouter';
import type { DirectionValue, ParseResponse } from '@/types/tradeLevels';
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

  const uploadScreenshot = async (file: File): Promise<ParseResponse> => {
    const formData = new FormData();
    formData.append('image', file, file.name || 'chart.png');
    logDebug('Uploading screenshot', { name: file.name, size: file.size });
    const response = await fetch('/api/parse-trade-screenshot', {
      method: 'POST',
      body: formData,
    });

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      // ignore parsing error; we'll fall back to default message
    }

    if (!response.ok) {
      const message = payload?.error || 'Failed to process screenshot. Please try again.';
      throw new Error(message);
    }

    if (!payload?.success) {
      const message = payload?.error || 'Unable to extract trade levels from this screenshot.';
      throw new Error(message);
    }

    logDebug('Screenshot parsed', {
      modelUsed: payload.modelUsed,
      hasDirectionals: Boolean(payload.directionalRankings?.length),
    });

    return payload as ParseResponse;
  };

  const applySimpleAutofill = useCallback(
    (parsed: ParseResponse): boolean => {
      if (
        !parsed.success ||
        !parsed.direction ||
        parsed.entry == null ||
        parsed.stop == null ||
        parsed.tp == null
      ) {
        return false;
      }

      const orderDirection = parsed.direction === 'SHORT' ? 'sell' : 'buy';
      applyAutofill({
        limitPrice: parsed.entry.toString(),
        stopLoss: parsed.stop.toString(),
        takeProfits: [parsed.tp.toString()],
        direction: orderDirection,
        tpSlEnabled: true,
        switchToLimit: true,
      });
      setDirection(orderDirection);
      return true;
    },
    [applyAutofill, setDirection]
  );

  const processScreenshot = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const uploadId = crypto.randomUUID();
    const statusId = crypto.randomUUID();

    logDebug('Processing screenshot start');
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
      const parsed = await uploadScreenshot(file);
      updateMessage(uploadId, { status: 'done' });
      updateMessage(statusId, {
        content: 'Screenshot processed successfully.',
        status: 'done',
      });
      const autofillSuccess = applySimpleAutofill(parsed);
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'status',
        content: autofillSuccess
          ? 'Order ticket filled from screenshot.'
          : 'Parsed screenshot but missing required values for autofill.',
        status: autofillSuccess ? 'done' : 'error',
      });
    } catch (error) {
      console.error(error);
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
