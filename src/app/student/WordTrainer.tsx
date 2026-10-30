"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CelebrationIcon from "@mui/icons-material/CelebrationOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import ThumbUpIcon from "@mui/icons-material/ThumbUpOutlined";
import type { LanguageWord } from "@/lib/language-course";
import { useAppLanguage } from "@/lib/LanguageProvider";
import { glow, gradientOf, tint } from "@/components/tones";

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[.,!?;:«»"“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function Flashcards({ words }: { words: LanguageWord[] }) {
  const { t } = useAppLanguage();
  const [queue, setQueue] = useState(() => shuffle(words));
  const [flipped, setFlipped] = useState(false);
  const [round, setRound] = useState(0);
  const current = queue[0];
  const done = words.length - queue.length;

  const next = (known: boolean) => {
    setFlipped(false);
    setRound((value) => value + 1);
    setQueue(([first, ...rest]) => (known ? rest : [...rest, first]));
  };

  if (!current) {
    return (
      <Stack
        spacing={2}
        sx={{ alignItems: "center", py: 4, animation: "popIn 0.5s both" }}
      >
        <CelebrationIcon color="success" sx={{ fontSize: 64 }} />
        <Typography variant="h6">{t("allLearned")}</Typography>
        <Button
          variant="contained"
          startIcon={<ReplayIcon />}
          onClick={() => {
            setQueue(shuffle(words));
            setRound((value) => value + 1);
          }}
        >
          {t("startOver")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <LinearProgress
          variant="determinate"
          value={(done / words.length) * 100}
          sx={{ flex: 1, height: 8, borderRadius: 4 }}
          aria-label={t("cardsProgress", { done, total: words.length })}
        />
        <Typography variant="body2" color="text.secondary">
          {t("cardsProgress", { done, total: words.length })}
        </Typography>
      </Stack>
      <Box sx={{ perspective: "1000px" }}>
        <Box
          key={round}
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? current.translation : current.term}
          onClick={() => setFlipped((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setFlipped((value) => !value);
            }
          }}
          sx={{
            position: "relative",
            height: 220,
            cursor: "pointer",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(.3,.7,.4,1.2)",
            transform: flipped ? "rotateY(180deg)" : "none",
            animation: "fadeUp 0.35s both",
            borderRadius: 4,
            "&:focus-visible": {
              outline: "3px solid var(--mui-palette-primary-main)",
              outlineOffset: 4,
            },
          }}
        >
          {[false, true].map((back) => (
            <Stack
              key={String(back)}
              spacing={1}
              sx={{
                position: "absolute",
                inset: 0,
                p: 3,
                borderRadius: 4,
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                backfaceVisibility: "hidden",
                transform: back ? "rotateY(180deg)" : "none",
                color: back
                  ? "text.primary"
                  : "var(--mui-palette-common-white)",
                background: back ? tint("info", 14) : gradientOf("primary"),
                boxShadow: glow(back ? "info" : "primary", 60),
                border: back ? `2px solid ${tint("info", 40)}` : "none",
              }}
            >
              <Typography
                variant="h4"
                component="p"
                sx={{ overflowWrap: "anywhere" }}
              >
                {back ? current.translation : current.term}
              </Typography>
              {back && current.example && (
                <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                  {current.example}
                </Typography>
              )}
              {!back && (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {t("flipHint")}
                </Typography>
              )}
            </Stack>
          ))}
        </Box>
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center" }}>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<ReplayIcon />}
          onClick={() => next(false)}
        >
          {t("repeatLater")}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<ThumbUpIcon />}
          onClick={() => next(true)}
        >
          {t("knowIt")}
        </Button>
      </Stack>
    </Stack>
  );
}

type Token = { id: number; text: string };

function SentenceBuilder({ words }: { words: LanguageWord[] }) {
  const { t } = useAppLanguage();
  const [order] = useState(() => shuffle(words));
  const [index, setIndex] = useState(0);
  const word = order[index % order.length];
  const tokens = word.example.split(/\s+/).map((text, id) => ({ id, text }));
  const [pool, setPool] = useState<Token[]>(() => shuffle(tokens));
  const [answer, setAnswer] = useState<Token[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [attempt, setAttempt] = useState(0);

  const goNext = () => {
    const nextWord = order[(index + 1) % order.length];
    setIndex(index + 1);
    setPool(
      shuffle(nextWord.example.split(/\s+/).map((text, id) => ({ id, text }))),
    );
    setAnswer([]);
    setResult(null);
  };

  const check = () => {
    const correct =
      normalize(answer.map((token) => token.text).join(" ")) ===
      normalize(word.example);
    setResult(correct ? "correct" : "wrong");
    setAttempt((value) => value + 1);
  };

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">
        {t("sentenceHint")} · <strong>{word.term}</strong> — {word.translation}
      </Typography>
      <Box
        key={attempt}
        aria-live="polite"
        sx={{
          minHeight: 64,
          p: 1.5,
          borderRadius: 3,
          border: "2px dashed",
          borderColor:
            result === "correct"
              ? "success.main"
              : result === "wrong"
                ? "error.main"
                : "divider",
          bgcolor: result === "correct" ? tint("success", 10) : "transparent",
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          animation:
            result === "wrong"
              ? "shake 0.4s"
              : result === "correct"
                ? "popIn 0.4s"
                : "none",
        }}
      >
        {answer.map((token) => (
          <Chip
            key={token.id}
            label={token.text}
            color="primary"
            onClick={() => {
              setAnswer(answer.filter((item) => item.id !== token.id));
              setPool([...pool, token]);
              setResult(null);
            }}
          />
        ))}
      </Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {pool.map((token) => (
          <Chip
            key={token.id}
            label={token.text}
            variant="outlined"
            onClick={() => {
              setPool(pool.filter((item) => item.id !== token.id));
              setAnswer([...answer, token]);
              setResult(null);
            }}
          />
        ))}
      </Stack>
      {result && (
        <Typography
          sx={{
            fontWeight: 700,
            color: result === "correct" ? "success.main" : "error.main",
          }}
        >
          {t(result === "correct" ? "correctAnswer" : "tryAgain")}
        </Typography>
      )}
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        {result === "correct" ? (
          <Button variant="contained" color="success" onClick={goNext}>
            {t("nextSentence")}
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={pool.length > 0}
            onClick={check}
          >
            {t("checkAnswer")}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

// Study dialog for a topic's words: flip cards, then rebuild the example sentences.
export function WordTrainer({
  title,
  words,
  onClose,
}: {
  title: string;
  words: LanguageWord[];
  onClose: () => void;
}) {
  const { t } = useAppLanguage();
  const withSentences = words.filter(
    (word) => word.example.split(/\s+/).length >= 3,
  );
  const [mode, setMode] = useState<"cards" | "sentences">("cards");

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {withSentences.length > 0 && (
          <Tabs
            value={mode}
            onChange={(_, value) => setMode(value)}
            sx={{ mb: 2 }}
          >
            <Tab value="cards" label={t("flashcards")} />
            <Tab value="sentences" label={t("buildSentences")} />
          </Tabs>
        )}
        {mode === "cards" ? (
          <Flashcards words={words} />
        ) : (
          <SentenceBuilder words={withSentences} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          {t("closeDialog")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
