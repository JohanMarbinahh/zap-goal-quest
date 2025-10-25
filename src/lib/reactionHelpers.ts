// Helper functions for categorizing Nostr reactions based on NIP-25
// https://nostrbook.dev/kinds/7

/**
 * Check if a reaction content is an upvote
 * According to Nostr spec: + and empty string are likes/upvotes
 */
export const isUpvote = (content: string): boolean => {
  return content === '+' || content === '';
};

/**
 * Check if a reaction content is a downvote
 * According to Nostr spec: - is dislike/downvote
 */
export const isDownvote = (content: string): boolean => {
  return content === '-';
};

/**
 * Check if a reaction content is an emoji reaction (not a vote)
 * Emoji reactions are any content that's not +, -, or empty string
 */
export const isEmojiReaction = (content: string): boolean => {
  return !isUpvote(content) && !isDownvote(content);
};
