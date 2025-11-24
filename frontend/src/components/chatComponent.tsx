"use client";

import { ChatBox, BtnWithIcon } from '@/styles/pnl.styles';
import { Box, Button, IconButton, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from './ui/Tooltip';
import { intelayerColors } from '@/styles/theme';
import { useOrderTicketContext } from '@/context/orderTicketContext';
import { askLLM } from '@/services/llmRouter';
import type {
  DirectionValue,
  ParseResponse,
  DirectionalRanking,
} from '@/types/tradeLevels';
import Loader from './loaderSpinner';
import ThumbUpIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownIcon from '@mui/icons-material/ThumbDownAlt';

interface MessageProps {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'image' | 'parsed' | 'warning' | 'status';
  content: string;
  imageUrl?: string;
  parseId?: string;
  model?: string;
  status?: 'processing' | 'done' | 'error';
}

type FieldKey = 'entry' | 'stop' | 'tp';

type ParsedSessionState = {
  parseId: string;
  response: ParseResponse;
  activeDirection: DirectionValue;
  directionIndex: number;
  fieldIndices: Record<FieldKey, number>;
  confirmed: Record<FieldKey | 'direction', boolean>;
  applied: boolean;
  exhausted: Partial<Record<FieldKey, boolean>>;
};

const ChatComponent = () => {
  const chatMessagesRef = useRef<HTMLElement | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [typing, setTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { setDirection, applyAutofill } = useOrderTicketContext();

  const [parsedSessions, setParsedSessions] = useState<Record<string, ParsedSessionState>>({});

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

  const uploadScreenshot = async (file: File): Promise<ParseResponse> => {
    const formData = new FormData();
    formData.append('image', file, file.name || 'chart.png');
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

    return payload as ParseResponse;
  };

  const processScreenshot = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const uploadId = crypto.randomUUID();
    const statusId = crypto.randomUUID();

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
      const parseId = crypto.randomUUID();
      const topDirection = parsed.candidates.directionCandidates[0]?.value ?? 'LONG';
      const initialSession: ParsedSessionState = {
        parseId,
        response: parsed,
        activeDirection: topDirection,
        directionIndex: 0,
        fieldIndices: { entry: 0, stop: 0, tp: 0 },
        confirmed: { direction: false, entry: false, stop: false, tp: false },
        applied: false,
        exhausted: {},
      };
      setParsedSessions((prev) => ({ ...prev, [parseId]: initialSession }));

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'parsed',
        content: 'Parsed trade candidates',
        parseId,
        model: parsed.modelUsed,
      });

      const rankingForSummary = parsed.directionalRankings.find(
        (rank) => rank.direction === topDirection
      );
      const entryGuess = rankingForSummary?.entryCandidates[0]?.value;
      const stopGuess = rankingForSummary?.stopCandidates[0]?.value;
      const tpGuess = rankingForSummary?.tpCandidates[0]?.value;

      await sendPrompt(
        `Analyze this chart and summarize the trade setup. Direction: ${topDirection}. Entry: ${
          entryGuess ?? 'unknown'
        }. Stop: ${stopGuess ?? 'unknown'}. Targets: ${tpGuess ?? 'unknown'}`
      );
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

  const getRankingForDirection = useCallback(
    (parseId: string, direction: DirectionValue): DirectionalRanking | undefined => {
      const session = parsedSessions[parseId];
      return session?.response.directionalRankings.find((rank) => rank.direction === direction);
    },
    [parsedSessions]
  );

  const attemptApplyToTicket = useCallback(
    (session: ParsedSessionState) => {
      if (
        !session.confirmed.direction ||
        !session.confirmed.entry ||
        !session.confirmed.stop ||
        !session.confirmed.tp ||
        session.applied
      ) {
        return;
      }

      const ranking = getRankingForDirection(session.parseId, session.activeDirection);
      if (!ranking) return;

      const entryValue = ranking.entryCandidates[session.fieldIndices.entry]?.value;
      const stopValue = ranking.stopCandidates[session.fieldIndices.stop]?.value;
      const tpValue = ranking.tpCandidates[session.fieldIndices.tp]?.value;
      if (entryValue == null || stopValue == null || tpValue == null) return;

      const orderDirection = session.activeDirection === 'SHORT' ? 'sell' : 'buy';

      applyAutofill({
        limitPrice: entryValue.toString(),
        stopLoss: stopValue.toString(),
        takeProfits: [tpValue.toString()],
        direction: orderDirection,
        tpSlEnabled: true,
        switchToLimit: true,
      });
      setDirection(orderDirection);

      setParsedSessions((prev) => ({
        ...prev,
        ...(prev[session.parseId]
          ? { [session.parseId]: { ...prev[session.parseId], applied: true } }
          : {}),
      }));
    },
    [applyAutofill, getRankingForDirection, setDirection]
  );

  useEffect(() => {
    Object.values(parsedSessions).forEach((session) => {
      attemptApplyToTicket(session);
    });
  }, [parsedSessions, attemptApplyToTicket]);

  const renderParsedCard = useCallback(
    (message: MessageProps) => {
      if (!message.parseId) return null;
      const session = parsedSessions[message.parseId];
      if (!session) return null;

      const ranking = getRankingForDirection(session.parseId, session.activeDirection);
      if (!ranking) return null;

      const directionCandidates = session.response.candidates.directionCandidates;
      const currentDirection = session.activeDirection;
      const entryCandidate = ranking.entryCandidates[session.fieldIndices.entry];
      const stopCandidate = ranking.stopCandidates[session.fieldIndices.stop];
      const tpCandidate = ranking.tpCandidates[session.fieldIndices.tp];

      const rotateDirection = () => {
        setParsedSessions((prev) => {
          const next = { ...prev };
          const current = next[session.parseId];
          if (!current) return prev;
          const hasAlternate = current.directionIndex + 1 < directionCandidates.length;
          const nextIndex = hasAlternate
            ? current.directionIndex + 1
            : Math.min(current.directionIndex + 1, directionCandidates.length - 1);
          const nextDirection = hasAlternate
            ? directionCandidates[nextIndex]?.value
            : current.activeDirection === 'LONG'
              ? 'SHORT'
              : 'LONG';

          next[session.parseId] = {
            ...current,
            activeDirection: nextDirection,
            directionIndex: nextIndex,
            confirmed: { direction: false, entry: false, stop: false, tp: false },
            fieldIndices: { entry: 0, stop: 0, tp: 0 },
            applied: false,
            exhausted: {},
          };
          return next;
        });
      };

      const confirmDirection = () => {
        setParsedSessions((prev) => {
          const next = { ...prev };
          const current = next[session.parseId];
          if (!current) return prev;
          next[session.parseId] = {
            ...current,
            confirmed: { ...current.confirmed, direction: true },
          };
          return next;
        });
      };

      const rotateField = (field: FieldKey) => {
        setParsedSessions((prev) => {
          const current = prev[session.parseId];
          if (!current) return prev;
          const targetRanking = getRankingForDirection(current.parseId, current.activeDirection);
          if (!targetRanking) return prev;

          const candidates =
            field === 'entry'
              ? targetRanking.entryCandidates
              : field === 'stop'
                ? targetRanking.stopCandidates
                : targetRanking.tpCandidates;
          const nextIndex = Math.min(current.fieldIndices[field] + 1, candidates.length - 1);
          const exhausted = nextIndex === current.fieldIndices[field];

          return {
            ...prev,
            [session.parseId]: {
              ...current,
              fieldIndices: { ...current.fieldIndices, [field]: nextIndex },
              confirmed: { ...current.confirmed, [field]: false },
              applied: false,
              exhausted: exhausted
                ? { ...current.exhausted, [field]: true }
                : { ...current.exhausted, [field]: false },
            },
          };
        });
      };

      const confirmField = (field: FieldKey) => {
        setParsedSessions((prev) => {
          const current = prev[session.parseId];
          if (!current) return prev;
          const updated = {
            ...current,
            confirmed: { ...current.confirmed, [field]: true },
          };
          return { ...prev, [session.parseId]: updated };
        });
      };

      const renderRow = (label: string, value: number | undefined, field: FieldKey) => (
        <Box className="extracted_row" sx={{ alignItems: 'center', gap: '8px' }}>
          <span>{label}</span>
          <span>{value != null ? value : '—'}</span>
          <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <IconButton
              aria-label={`Confirm ${label}`}
              size="small"
              onClick={() => confirmField(field)}
              color={session.confirmed[field] ? 'success' : 'default'}
            >
              <ThumbUpIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              aria-label={`Cycle ${label}`}
              size="small"
              onClick={() => rotateField(field)}
            >
              <ThumbDownIcon fontSize="inherit" />
            </IconButton>
          </Box>
          {session.exhausted[field] && (
            <Typography variant="caption" color={intelayerColors.muted} sx={{ marginLeft: 'auto' }}>
              No more alternatives
            </Typography>
          )}
        </Box>
      );

      return (
        <Box className="extracted_card">
          <Typography variant="body2" color={intelayerColors.muted} sx={{ marginBottom: '6px' }}>
            Parsed levels
          </Typography>
          <Box
            className="extracted_row"
            sx={{ alignItems: 'center', gap: '8px', marginBottom: '8px' }}
          >
            <span>Direction</span>
            <span className={
              currentDirection === 'LONG' ? 'pill pill-long' : 'pill pill-short'
            }>
              {currentDirection}
            </span>
            <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              <IconButton
                aria-label="Confirm direction"
                size="small"
                onClick={confirmDirection}
                color={session.confirmed.direction ? 'success' : 'default'}
              >
                <ThumbUpIcon fontSize="inherit" />
              </IconButton>
              <IconButton aria-label="Swap direction" size="small" onClick={rotateDirection}>
                <ThumbDownIcon fontSize="inherit" />
              </IconButton>
            </Box>
          </Box>
          {renderRow('Entry', entryCandidate?.value, 'entry')}
          {renderRow('Stop', stopCandidate?.value, 'stop')}
          {renderRow('Targets', tpCandidate?.value, 'tp')}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <Typography variant="caption" color={intelayerColors.muted}>
              Model: {message.model || session.response.modelUsed}
            </Typography>
            <Button
              size="small"
              variant="contained"
              disabled={
                !session.confirmed.direction ||
                !session.confirmed.entry ||
                !session.confirmed.stop ||
                !session.confirmed.tp ||
                session.applied
              }
              onClick={() => attemptApplyToTicket(session)}
            >
              Apply to order ticket
            </Button>
          </Box>
        </Box>
      );
    },
    [attemptApplyToTicket, getRankingForDirection, parsedSessions]
  );

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
    if (message.type === 'parsed') {
      return renderParsedCard(message);
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
