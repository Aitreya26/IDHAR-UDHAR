import { SellerReputation, SellerRatingRecord, ExchangeSession } from '../types';
import { safeStorage } from '../utils/storage';

export const INITIAL_REPUTATIONS: Record<string, SellerReputation> = {
  // Aitreya Srivastava has 10 consecutive 5-star ratings -> Pre-verified TRUSTWORTHY SELLER
  'user-aitreya': {
    sellerId: 'user-aitreya',
    ratingsCount: 10,
    averageRating: 5.0,
    consecutiveFourPlus: 10,
    totalFourPlus: 10,
    oneStarCount: 0,
    isTrustworthy: true,
    hasOneStarWarning: false,
    ratingHistory: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  },
  'user-naman': {
    sellerId: 'user-naman',
    ratingsCount: 4,
    averageRating: 4.8,
    consecutiveFourPlus: 4,
    totalFourPlus: 4,
    oneStarCount: 0,
    isTrustworthy: false,
    hasOneStarWarning: false,
    ratingHistory: [5, 4, 5, 5],
  },
  'user-rivastik': {
    sellerId: 'user-rivastik',
    ratingsCount: 3,
    averageRating: 4.7,
    consecutiveFourPlus: 3,
    totalFourPlus: 3,
    oneStarCount: 0,
    isTrustworthy: false,
    hasOneStarWarning: false,
    ratingHistory: [5, 4, 5],
  },
  'user-kushboo': {
    sellerId: 'user-kushboo',
    ratingsCount: 5,
    averageRating: 5.0,
    consecutiveFourPlus: 5,
    totalFourPlus: 5,
    oneStarCount: 0,
    isTrustworthy: false,
    hasOneStarWarning: false,
    ratingHistory: [5, 5, 5, 5, 5],
  },
};

/**
 * Calculates reputation metrics from a list of ratings
 */
export const calculateReputation = (sellerId: string, ratings: number[]): SellerReputation => {
  if (!ratings || ratings.length === 0) {
    return {
      sellerId,
      ratingsCount: 0,
      averageRating: 5.0,
      consecutiveFourPlus: 0,
      totalFourPlus: 0,
      oneStarCount: 0,
      isTrustworthy: false,
      hasOneStarWarning: false,
      ratingHistory: [],
    };
  }

  const ratingsCount = ratings.length;
  const sum = ratings.reduce((acc, curr) => acc + curr, 0);
  const averageRating = Math.round((sum / ratingsCount) * 10) / 10;

  // Calculate current and maximum consecutive streak of ratings >= 4
  let currentStreak = 0;
  let maxStreak = 0;
  let totalFourPlus = 0;
  let oneStarCount = 0;

  for (const r of ratings) {
    if (r >= 4) {
      currentStreak += 1;
      totalFourPlus += 1;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }

    if (r === 1) {
      oneStarCount += 1;
    }
  }

  // Requirement:
  // "if the seller is continuously rated for 4 stars or above for 10 times or more , the seller gets a tag of 'TRUSTWORTHY SELLER'"
  const isTrustworthy = maxStreak >= 10 || currentStreak >= 10;

  // Requirement:
  // "If a seller is rated as 1 star for 5 times or more after the handovers , the seller gets warning - 'You were constantly rated as 1, please review products to avoid suspension'"
  const hasOneStarWarning = oneStarCount >= 5;

  return {
    sellerId,
    ratingsCount,
    averageRating,
    consecutiveFourPlus: currentStreak,
    totalFourPlus,
    oneStarCount,
    isTrustworthy,
    hasOneStarWarning,
    ratingHistory: ratings,
  };
};

let cachedReputations: Record<string, SellerReputation> | null = null;

export const getSellerReputation = (sellerId: string): SellerReputation => {
  if (!cachedReputations) {
    cachedReputations = safeStorage.getJSON<Record<string, SellerReputation>>(
      'idhar_udhar_seller_reputations',
      INITIAL_REPUTATIONS
    );
  }
  return (
    cachedReputations[sellerId] || {
      sellerId,
      ratingsCount: 0,
      averageRating: 5.0,
      consecutiveFourPlus: 0,
      totalFourPlus: 0,
      oneStarCount: 0,
      isTrustworthy: false,
      hasOneStarWarning: false,
      ratingHistory: [],
    }
  );
};

export const recordSellerRating = (
  sellerId: string,
  rating: number
): { reputation: SellerReputation; allReputations: Record<string, SellerReputation> } => {
  if (!cachedReputations) {
    cachedReputations = safeStorage.getJSON<Record<string, SellerReputation>>(
      'idhar_udhar_seller_reputations',
      INITIAL_REPUTATIONS
    );
  }

  const existing = cachedReputations[sellerId] || {
    sellerId,
    ratingsCount: 0,
    averageRating: 5.0,
    consecutiveFourPlus: 0,
    totalFourPlus: 0,
    oneStarCount: 0,
    isTrustworthy: false,
    hasOneStarWarning: false,
    ratingHistory: [],
  };

  const newHistory = [...(existing.ratingHistory || []), rating];
  const updatedRep = calculateReputation(sellerId, newHistory);
  cachedReputations[sellerId] = updatedRep;
  safeStorage.setJSON('idhar_udhar_seller_reputations', cachedReputations);

  return { reputation: updatedRep, allReputations: cachedReputations };
};

export const recalculateSellerReputation = (
  sellerId: string,
  exchanges: ExchangeSession[]
): SellerReputation => {
  if (!cachedReputations) {
    cachedReputations = safeStorage.getJSON<Record<string, SellerReputation>>(
      'idhar_udhar_seller_reputations',
      INITIAL_REPUTATIONS
    );
  }

  // Find active, non-expunged rated exchanges for this seller
  const sellerExchanges = (exchanges || []).filter(
    (e) => e.sellerId === sellerId && typeof e.buyerRating === 'number' && e.buyerRating > 0
  );

  const initialHistory = INITIAL_REPUTATIONS[sellerId]?.ratingHistory || [];
  const exchangeRatings = sellerExchanges.map((e) => e.buyerRating!);
  const fullRatings = [...initialHistory, ...exchangeRatings];

  const updatedRep = calculateReputation(sellerId, fullRatings);
  cachedReputations[sellerId] = updatedRep;
  safeStorage.setJSON('idhar_udhar_seller_reputations', cachedReputations);

  return updatedRep;
};
