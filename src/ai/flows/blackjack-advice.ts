'use server';
/**
 * @fileOverview A Blackjack advice AI agent.
 *
 * - getBlackjackAdvice - A function that provides Blackjack advice.
 * - GetBlackjackAdviceInput - The input type for the getBlackjackAdvice function.
 * - GetBlackjackAdviceOutput - The return type for the getBlackjackAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetBlackjackAdviceInputSchema = z.object({
  playerHand: z
    .string()
    .describe('The player\'s current hand, as a comma-separated string. e.g. "10 of Spades, Ace of Hearts"'),
  dealerUpCard: z
    .string()
    .describe('The dealer\'s visible card. e.g. "King of Diamonds"'),
});
export type GetBlackjackAdviceInput = z.infer<
  typeof GetBlackjackAdviceInputSchema
>;

const GetBlackjackAdviceOutputSchema = z.object({
  advice: z.string().describe('The recommended action, e.g., "Hit" or "Stand"'),
});
export type GetBlackjackAdviceOutput = z.infer<
  typeof GetBlackjackAdviceOutputSchema
>;

export async function getBlackjackAdvice(
  input: GetBlackjackAdviceInput
): Promise<GetBlackjackAdviceOutput> {
  return getBlackjackAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getBlackjackAdvicePrompt',
  input: {schema: GetBlackjackAdviceInputSchema},
  output: {schema: GetBlackjackAdviceOutputSchema},
  prompt: `You are a Blackjack expert. Your goal is to provide the best possible advice to the player based on their hand and the dealer's up card.

Analyze the player's hand and the dealer's up card according to basic Blackjack strategy and recommend one of the following actions: "Hit", "Stand", "Double Down", or "Split".

Player's Hand: {{{playerHand}}}
Dealer's Up Card: {{{dealerUpCard}}}`,
});

const getBlackjackAdviceFlow = ai.defineFlow(
  {
    name: 'getBlackjackAdviceFlow',
    inputSchema: GetBlackjackAdviceInputSchema,
    outputSchema: GetBlackjackAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
