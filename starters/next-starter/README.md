# Rift.js Next.js Starter

This is a Next.js starter project with Rift.js integration that uses the App Router and TypeScript. It provides a foundation for building blockchain applications using Rift.js with Next.js.

## Features

- Next.js 15 with App Router
- TypeScript support
- Tailwind CSS for styling
- Rift.js integration for blockchain interaction
- Example components:
  - Home page with basic Rift.js functionality
  - NFT Minter - Demo of minting an NFT
  - NFT Carousel - Display and purchase NFTs
  - Token Buy - Purchase tokens with an input field

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/components/rift-provider.tsx` - Context provider for Rift.js integration
- `src/app/page.tsx` - Home page with basic Rift.js functionality
- `src/app/nft-minter/page.tsx` - NFT minting example
- `src/app/nft-carousel/page.tsx` - NFT carousel display and purchase example
- `src/app/token-buy/page.tsx` - Token purchase example

## Customizing

The examples in this starter use mock transactions. To use real transactions, update the Cadence code in each component with your own contract code.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Rift.js Documentation](https://rift.js.org)
