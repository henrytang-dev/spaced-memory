import { Card, ReviewLog, Prisma } from '@prisma/client';
import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  type Card as FsrsCard,
  type ReviewLog as FsrsReviewLog,
  type IPreview
} from 'ts-fsrs';
import { prisma } from './prisma';

const params = generatorParameters({ enable_fuzz: true, enable_short_term: false });
const scheduler = fsrs(params);

function jitterDue(due: Date, now: Date) {
  const intervalMs = due.getTime() - now.getTime();
  if (intervalMs <= 0) return due;
  // widen fuzz: ±15% with clamp
  const fuzz = (Math.random() * 0.3 - 0.15) * intervalMs;
  const jittered = new Date(due.getTime() + fuzz);
  const minDue = new Date(now.getTime() + 60 * 60 * 1000); // at least 1h ahead
  return jittered < minDue ? minDue : jittered;
}

export const dbCardToFsrsCard = (card: Card): FsrsCard => {
  const storedState = card.state;
  let state: FsrsCard['state'];
  if (storedState === null || storedState === undefined) {
    state = 0 as FsrsCard['state'];
  } else if (!Number.isNaN(Number(storedState))) {
    state = Number(storedState) as FsrsCard['state'];
  } else {
    state = Number(storedState) as FsrsCard['state'];
  }

  const learningSteps = (card as unknown as { learning_steps?: number }).learning_steps ?? 0;

  return {
    due: card.due ?? new Date(),
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    elapsed_days: card.elapsedDays ?? 0,
    scheduled_days: card.scheduledDays ?? 0,
    learning_steps: learningSteps,
    reps: card.reps ?? 0,
    lapses: card.lapses ?? 0,
    state,
    last_review: card.lastReviewed ?? card.createdAt
  };
};

export const fsrsCardToDbUpdate = (fsrsCard: FsrsCard) => ({
  due: fsrsCard.due,
  stability: fsrsCard.stability,
  difficulty: fsrsCard.difficulty,
  elapsedDays: fsrsCard.elapsed_days,
  scheduledDays: fsrsCard.scheduled_days,
  reps: fsrsCard.reps,
  lapses: fsrsCard.lapses,
  state: `${fsrsCard.state}`,
  lastReviewed: fsrsCard.last_review
});

export const fsrsLogToReviewLog = (
  log: FsrsReviewLog,
  rating: Rating,
  userId: string,
  cardId: string
): Prisma.ReviewLogUncheckedCreateInput => {
  const anyLog = log as any;
  const logState = anyLog.state;
  return {
    userId,
    cardId,
    rating: Number(rating),
    scheduledDays: anyLog.scheduled_days ?? null,
    elapsedDays: anyLog.elapsed_days ?? null,
    state:
      logState === null || logState === undefined
        ? null
        : typeof logState === 'number'
        ? String(logState)
        : (logState as string),
    reviewedAt: anyLog.review ?? new Date(),
    logJson: log as unknown as Prisma.InputJsonValue
  };
};

export async function initializeFsrsStateForCard(cardId: string, createdAt?: Date) {
  const now = createdAt ?? new Date();
  const fsrsCard = createEmptyCard(now);
  // Ramp new cards: start 2 days out to avoid day-one pileups
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  fsrsCard.due = new Date(now.getTime() + twoDaysMs);
  fsrsCard.scheduled_days = Math.max(fsrsCard.scheduled_days ?? 0, 2);
  return prisma.card.update({ where: { id: cardId }, data: fsrsCardToDbUpdate(fsrsCard) });
}

type GradeValue = Exclude<Rating, Rating.Manual>;

function ratingToGrade(rating: Rating): GradeValue {
  switch (rating) {
    case Rating.Again:
      return Rating.Again;
    case Rating.Hard:
      return Rating.Hard;
    case Rating.Good:
      return Rating.Good;
    case Rating.Easy:
    default:
      return Rating.Easy;
  }
}

export async function applyReview(card: Card, rating: Rating, now = new Date()) {
  const fsrsCard = dbCardToFsrsCard(card);
  const schedulingCards: IPreview = scheduler.repeat(fsrsCard, now);
  const grade = ratingToGrade(rating);
  const outcome = schedulingCards[grade];

  // widen fuzz manually
  if (outcome.card.due) {
    outcome.card.due = jitterDue(outcome.card.due, now);
  }

  const updatedCard = await prisma.card.update({
    where: { id: card.id },
    data: fsrsCardToDbUpdate(outcome.card)
  });

  const reviewLog = await prisma.reviewLog.create({
    data: fsrsLogToReviewLog(outcome.log, rating, card.userId, card.id)
  });

  return { updatedCard, reviewLog };
}

export { Rating };
