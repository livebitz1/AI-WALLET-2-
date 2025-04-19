# Web3 AI Wallet

An AI-powered Web3 wallet that allows users to interact with the Solana blockchain using natural language.

## Features

- Connect your Phantom wallet
- Use natural language to perform token swaps
- AI-powered interface using GPT-4
- Real-time token swaps via Jupiter Aggregator
- Clean UI built with Next.js, Tailwind CSS and ShadCN UI

## Getting Started

1. Create a `.env.local` file from `.env.local.example` and add your OpenAI API key

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Connect your Phantom wallet using the "Connect Wallet" button
2. Type natural language commands in the chat interface like:
   - "Swap 2 SOL to USDC"
   - "Convert 5 USDC to SOL"
3. Confirm the transaction when prompted

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS & ShadCN UI
- Solana Web3.js
- @solana/wallet-adapter for wallet connections
- Jupiter Aggregator for token swaps
- OpenAI GPT-4 for natural language processing
