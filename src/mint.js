import { Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile } from '@metaplex-foundation/js';
import { generateUniqueGenderCombination, getGenderAttributes } from './genders.js';
import { 
  getConnection, 
  getMetaplex,
  COLLECTION_NAME,
  COLLECTION_SYMBOL,
  COLLECTION_DESCRIPTION,
  ROYALTY_BASIS_POINTS
} from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InfiniteGendersNFT {
  constructor() {
    this.connection = getConnection();
    this.metaplex = null;
    this.collectionNft = null;
    this.mintCounter = 0;
  }

  async initialize(walletKeypair) {
    this.metaplex = Metaplex.make(this.connection)
      .use(keypairIdentity(walletKeypair));
    
    if (process.env.BUNDLR_NODE) {
      this.metaplex.use(bundlrStorage({
        address: process.env.BUNDLR_NODE,
        providerUrl: this.connection.rpcEndpoint,
        timeout: 60000,
      }));
    }
    
    console.log('Initialized with wallet:', walletKeypair.publicKey.toString());
  }

  async createCollection(walletKeypair) {
    console.log('Creating NFT collection...');
    
    const collectionMetadata = {
      name: COLLECTION_NAME,
      symbol: COLLECTION_SYMBOL,
      description: COLLECTION_DESCRIPTION,
      image: await this.uploadCollectionImage(),
      attributes: [
        { trait_type: "Type", value: "Collection" },
        { trait_type: "Max Supply", value: "Infinite" }
      ],
      properties: {
        category: "image",
        creators: [{
          address: walletKeypair.publicKey.toString(),
          share: 100
        }]
      }
    };

    const { uri: collectionUri } = await this.metaplex.nfts().uploadMetadata(collectionMetadata);
    
    const { nft: collectionNft } = await this.metaplex.nfts().create({
      uri: collectionUri,
      name: COLLECTION_NAME,
      symbol: COLLECTION_SYMBOL,
      sellerFeeBasisPoints: ROYALTY_BASIS_POINTS,
      isCollection: true,
      updateAuthority: walletKeypair,
      mintAuthority: walletKeypair,
      tokenOwner: walletKeypair.publicKey,
      creators: [{
        address: walletKeypair.publicKey,
        share: 100,
        authority: walletKeypair
      }]
    });

    this.collectionNft = collectionNft;
    console.log('Collection created:', collectionNft.address.toString());
    return collectionNft;
  }

  async uploadCollectionImage() {
    const imagePath = path.join(__dirname, '..', 'assets', 'collection.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('Collection image not found, using placeholder');
      return 'https://arweave.net/placeholder-collection-image';
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const imageFile = toMetaplexFile(imageBuffer, 'collection.png');
    const imageUri = await this.metaplex.storage().upload(imageFile);
    
    return imageUri;
  }

  async mintNFT(recipientAddress, tokenId = null) {
    if (!this.collectionNft) {
      throw new Error('Collection not initialized. Please create collection first.');
    }

    const effectiveTokenId = tokenId || Date.now() + this.mintCounter++;
    const gender = generateUniqueGenderCombination(effectiveTokenId);
    
    console.log(`Minting NFT #${effectiveTokenId}`);
    console.log(`Generated Gender: ${gender.name}`);
    console.log(`Rarity: ${gender.rarity}`);
    
    const nftMetadata = {
      name: `Gender #${effectiveTokenId}: ${gender.name}`,
      symbol: COLLECTION_SYMBOL,
      description: `A unique gender identity: ${gender.name}. This NFT represents one of infinite possible gender combinations, generated through a deterministic algorithm that ensures each token ID produces a unique and reproducible gender identity.`,
      image: await this.generateAndUploadImage(gender, effectiveTokenId),
      attributes: getGenderAttributes(gender),
      properties: {
        category: "image",
        files: [{
          uri: await this.generateAndUploadImage(gender, effectiveTokenId),
          type: "image/png"
        }],
        creators: [{
          address: this.metaplex.identity().publicKey.toString(),
          share: 100
        }]
      },
      collection: {
        name: COLLECTION_NAME,
        family: COLLECTION_NAME
      }
    };

    const { uri } = await this.metaplex.nfts().uploadMetadata(nftMetadata);
    
    const recipient = typeof recipientAddress === 'string' 
      ? new PublicKey(recipientAddress) 
      : recipientAddress;

    const { nft } = await this.metaplex.nfts().create({
      uri,
      name: nftMetadata.name,
      symbol: COLLECTION_SYMBOL,
      sellerFeeBasisPoints: ROYALTY_BASIS_POINTS,
      tokenOwner: recipient,
      collection: this.collectionNft.address,
      collectionAuthority: this.metaplex.identity(),
      creators: [{
        address: this.metaplex.identity().publicKey,
        share: 100,
        authority: this.metaplex.identity()
      }]
    });

    console.log(`NFT minted successfully!`);
    console.log(`Mint address: ${nft.address.toString()}`);
    console.log(`Metadata URI: ${uri}`);
    
    return {
      nft,
      gender,
      tokenId: effectiveTokenId,
      metadataUri: uri
    };
  }

  async generateAndUploadImage(gender, tokenId) {
    const imagePath = path.join(__dirname, '..', 'assets', 'images', `${tokenId}.png`);
    
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageFile = toMetaplexFile(imageBuffer, `${tokenId}.png`);
      return await this.metaplex.storage().upload(imageFile);
    }
    
    const placeholderPath = path.join(__dirname, '..', 'assets', 'placeholder.png');
    if (fs.existsSync(placeholderPath)) {
      const imageBuffer = fs.readFileSync(placeholderPath);
      const imageFile = toMetaplexFile(imageBuffer, 'placeholder.png');
      return await this.metaplex.storage().upload(imageFile);
    }
    
    return `https://via.placeholder.com/500/000000/FFFFFF?text=${encodeURIComponent(gender.name)}`;
  }

  async batchMint(recipientAddress, count = 10) {
    const results = [];
    for (let i = 0; i < count; i++) {
      try {
        const result = await this.mintNFT(recipientAddress);
        results.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error minting NFT ${i + 1}:`, error);
      }
    }
    return results;
  }
}

async function main() {
  try {
    if (!process.env.WALLET_PRIVATE_KEY) {
      console.error('Please set WALLET_PRIVATE_KEY in .env file');
      console.log('Generating a new keypair for demo purposes...');
      
      const demoKeypair = Keypair.generate();
      console.log('Demo wallet public key:', demoKeypair.publicKey.toString());
      console.log('Demo wallet private key (base58):', Buffer.from(demoKeypair.secretKey).toString('base64'));
      console.log('\nPlease fund this wallet with SOL on devnet to proceed with minting.');
      return;
    }

    const privateKey = JSON.parse(process.env.WALLET_PRIVATE_KEY);
    const walletKeypair = Keypair.fromSecretKey(new Uint8Array(privateKey));
    
    const nftMinter = new InfiniteGendersNFT();
    await nftMinter.initialize(walletKeypair);
    
    const command = process.argv[2];
    
    switch(command) {
      case 'create-collection':
        await nftMinter.createCollection(walletKeypair);
        break;
        
      case 'mint':
        const recipientAddress = process.argv[3] || walletKeypair.publicKey.toString();
        const tokenId = process.argv[4] ? parseInt(process.argv[4]) : null;
        await nftMinter.mintNFT(recipientAddress, tokenId);
        break;
        
      case 'batch-mint':
        const batchRecipient = process.argv[3] || walletKeypair.publicKey.toString();
        const count = process.argv[4] ? parseInt(process.argv[4]) : 10;
        await nftMinter.batchMint(batchRecipient, count);
        break;
        
      default:
        console.log('Usage:');
        console.log('  npm run mint create-collection');
        console.log('  npm run mint mint [recipient_address] [token_id]');
        console.log('  npm run mint batch-mint [recipient_address] [count]');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default InfiniteGendersNFT;