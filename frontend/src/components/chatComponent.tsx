"use client";

import { ChatBox, BtnWithIcon } from '@/styles/pnl.styles';
import { Box, Button, Typography } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Tooltip from './ui/Tooltip';
import { intelayerColors } from '@/styles/theme';
import DirectionToggle from './ui/DirectionToggle';
import { useOrderTicketContext } from '@/context/orderTicketContext';
import { askLLM } from '@/services/llmRouter';
import { extractTradeLevelsFromImage } from '@/utils/ocr';

interface MessageProps {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'image' | 'extracted' | 'warning';
  content: string;
  imageUrl?: string;
  extracted?: {
    direction: 'long' | 'short';
    entries: number[];
    stopLoss: number;
    takeProfits: number[];
  };
  model?: string;
  status?: 'processing' | 'done' | 'error';
}

const ChatComponent = () => {
  const chatMessagesRef = useRef<HTMLElement | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [typing, setTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { direction, setDirection, applyAutofill } = useOrderTicketContext();

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

  const updateMessage = (id: string, updates: Partial<MessageProps>) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)));
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

  const handleImageExtraction = async (file: File, imageMessageId: string) => {
    setTyping(true);
    try {
      const extracted = await extractTradeLevelsFromImage(file);
      const directionFromImage = extracted.direction === 'long' ? 'buy' : 'sell';
      setDirection(directionFromImage);
      applyAutofill({
        limitPrice: extracted.entries[0]?.toString() || '',
        stopLoss: extracted.stopLoss ? extracted.stopLoss.toString() : '',
        takeProfits: extracted.takeProfits.map((tp) => tp.toString()),
        direction: directionFromImage,
        tpSlEnabled: true,
        switchToLimit: true,
      });

      updateMessage(imageMessageId, { status: 'done' });

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'extracted',
        content: 'Extracted trade levels',
        extracted,
      });

      await sendPrompt(
        `Analyze this chart and summarize the trade setup. Direction: ${extracted.direction}. Entry: ${extracted.entries.join(
          ', '
        )}. Stop: ${extracted.stopLoss}. Targets: ${extracted.takeProfits.join(', ')}`
      );
    } catch (error) {
      console.error(error);
      updateMessage(imageMessageId, { status: 'error' });
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'warning',
        content: 'Unable to read the chart. Please upload a clearer screenshot.',
      });
    }
    setTyping(false);
  };

  const handleImageMessage = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const imageMessageId = crypto.randomUUID();
    addMessage({
      id: imageMessageId,
      role: 'user',
      type: 'image',
      content: 'Chart uploaded',
      imageUrl: previewUrl,
      status: 'processing',
    });
    await handleImageExtraction(file, imageMessageId);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFile = Array.from(files).find((file) => file.type.startsWith('image/'));
    if (imageFile) {
      handleImageMessage(imageFile);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          handleImageMessage(file);
          break;
        }
      }
    }
  };

  const dropHandlers = useMemo(
    () => ({
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
    }),
    []
  );

  const renderMessage = (message: MessageProps) => {
    if (message.type === 'image' && message.imageUrl) {
      return (
        <Box className="image_preview">
          <img src={message.imageUrl} alt="uploaded" className="image_bubble" />
          {message.status === 'processing' && (
            <Box className="image_status">
              <span className="spinner" />
              <Typography variant="caption" color={intelayerColors.ink}>
                Parsing chart…
              </Typography>
            </Box>
          )}
          {message.status === 'error' && (
            <Box className="image_status error">
              <Typography variant="caption" color={intelayerColors.ink}>
                Parsing failed
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    if (message.type === 'extracted' && message.extracted) {
      return (
        <Box className="extracted_card">
          <Typography variant="body2" color={intelayerColors.muted}>
            Parsed levels
          </Typography>
          <Box className="extracted_row">
            <span>Direction</span>
            <span className={message.extracted.direction === 'long' ? 'pill pill-long' : 'pill pill-short'}>
              {message.extracted.direction.toUpperCase()}
            </span>
          </Box>
          <Box className="extracted_row">
            <span>Entry</span>
            <span>{message.extracted.entries.join(', ') || '—'}</span>
          </Box>
          <Box className="extracted_row">
            <span>Stop</span>
            <span>{message.extracted.stopLoss || '—'}</span>
          </Box>
          <Box className="extracted_row">
            <span>Targets</span>
            <span>{message.extracted.takeProfits.join(', ') || '—'}</span>
          </Box>
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
        {message.model && (
          <Typography variant="caption" color={intelayerColors.muted}>
            Responded with {message.model}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <ChatBox {...dropHandlers} className={dragActive ? 'drag-active' : ''}>
      <Box className="header_nav">
        <Tooltip content="Route prompts to the best model and sync direction with the ticket.">
          <header>Intelayer Assistant</header>
        </Tooltip>
        <Box sx={{ flex: 1, maxWidth: '260px' }}>
          <DirectionToggle value={direction} onChange={setDirection} />
        </Box>
        <Tooltip content="Upload or paste a chart screenshot to auto-fill the ticket.">
          <BtnWithIcon onClick={() => fileInputRef.current?.click()} aria-label="Upload chart">
            <img src="/uploadIcon.svg" alt="upload" />
          </BtnWithIcon>
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
            onPaste={handlePaste}
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
