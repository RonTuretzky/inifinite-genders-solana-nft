# Infinite Genders NFT - Solana Smart Contracts

## Overview

This project includes full Solana smart contracts built with Anchor framework for on-chain NFT minting with deterministic gender generation.

## Smart Contract Architecture

### Program Structure

```
programs/infinite-genders-nft/
├── Cargo.toml              # Rust dependencies
└── src/
    └── lib.rs              # Main program logic
```

### Key Instructions

#### 1. `initialize_collection`
Initializes a new NFT collection with authority control.

**Accounts:**
- `collection_state` - PDA storing collection metadata
- `collection_mint` - SPL token mint for the collection NFT
- `authority` - Collection owner/authority

#### 2. `create_collection_nft`
Creates the collection NFT using Metaplex Token Metadata standard.

**Features:**
- Sets up master edition
- Configures royalties (5%)
- Establishes collection verification

#### 3. `mint_gender_nft`
Mints a new NFT with a unique gender identity.

**Process:**
1. Generates deterministic NFT mint address
2. Creates NFT with Metaplex metadata
3. Verifies collection membership
4. Mints to recipient's associated token account
5. Emits `GenderNftMinted` event

**Accounts:**
- `nft_mint` - New NFT's mint account (PDA)
- `recipient` - NFT recipient
- `collection_state` - Collection state for tracking

#### 4. `update_collection_metadata`
Updates collection URI or name (authority only).

### State Management

```rust
pub struct CollectionState {
    pub authority: Pubkey,
    pub collection_mint: Pubkey,
    pub total_minted: u64,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}
```

### PDA Seeds

- Collection State: `[b"collection", authority]`
- Collection Mint: `[b"collection_mint", collection_state]`
- NFT Mint: `[b"mint", collection_state, token_id]`
- Mint Authority: `[b"mint_authority", collection_state]`

## SDK Usage

### TypeScript SDK

```typescript
import { InfiniteGendersSDK } from "./sdk";

// Initialize SDK
const sdk = await initializeSDK(connection, wallet);

// Initialize collection
const { collectionState, collectionMint } = await sdk.initializeCollection(
  "Infinite Genders",
  "IGNDR",
  "https://api.infinitegenders.io/collection"
);

// Create collection NFT
await sdk.createCollectionNft();

// Mint NFT with gender
const { mint, metadata, tx } = await sdk.mintGenderNft(
  recipientAddress,
  genderSeed // optional
);
```

## Deployment

### Prerequisites

1. Install Anchor CLI:
```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

2. Install Solana CLI:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

3. Configure Solana CLI:
```bash
solana config set --url devnet
solana-keygen new
```

### Build & Deploy

1. Build the program:
```bash
npm run build
```

2. Deploy to devnet:
```bash
npm run deploy
```

3. Mint your first NFT:
```bash
npm run mint:nft <recipient_address> [gender_seed]
```

## Testing

### Run Anchor Tests
```bash
npm run test:anchor
```

Tests cover:
- Collection initialization
- NFT minting with unique genders
- Authority controls
- Error cases
- Multiple mints

### Test Structure
```
tests/
└── infinite-genders-nft.ts    # Comprehensive test suite
```

## Scripts

### Deploy Script (`scripts/deploy.ts`)
- Initializes collection
- Creates collection NFT
- Saves deployment info

### Mint Script (`scripts/mint-nft.ts`)
- Mints NFT to specified recipient
- Generates unique gender
- Displays gender attributes

## Program Security

### Access Controls
- Only authority can update collection
- PDAs prevent unauthorized minting
- Collection verification ensures authenticity

### Deterministic Generation
- Token ID determines gender
- Same ID = same gender (reproducible)
- On-chain seed prevents manipulation

## Gas Optimization

- PDA-based mints reduce account creation costs
- Batch-friendly architecture
- Efficient metadata storage

## Integration Examples

### Web3 Frontend
```javascript
import { Connection, PublicKey } from "@solana/web3.js";
import { InfiniteGendersSDK } from "./sdk";

const connection = new Connection("https://api.devnet.solana.com");
const sdk = await initializeSDK(connection, wallet);

// Mint NFT
const result = await sdk.mintGenderNft(userWallet);
console.log("Minted:", result.metadata.genderData.name);
```

### Phantom Wallet Integration
```javascript
const provider = window.solana;
await provider.connect();

const sdk = await initializeSDK(
  connection,
  provider
);
```

## Mainnet Deployment

1. Update `Anchor.toml` with mainnet RPC
2. Get program ID from `anchor deploy`
3. Update SDK with program ID
4. Initialize collection on mainnet
5. Configure metadata storage (Arweave/IPFS)

## Metadata Storage

Options for storing NFT metadata:
- **Arweave**: Permanent storage via Bundlr
- **IPFS**: Decentralized storage via Pinata
- **Shadow Drive**: Solana-native storage

## Events

The program emits `GenderNftMinted` events containing:
- Mint address
- Recipient
- Gender seed
- Token ID
- Name and URI

Monitor events:
```typescript
program.addEventListener("GenderNftMinted", (event) => {
  console.log("New NFT:", event.name);
});
```

## License

MIT