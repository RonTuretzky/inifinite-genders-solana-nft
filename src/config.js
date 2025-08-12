import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

export const COLLECTION_NAME = "Infinite Genders";
export const COLLECTION_SYMBOL = "IGND";
export const COLLECTION_DESCRIPTION = "A unique NFT collection where each mint generates a new gender identity from infinite combinations";
export const MAX_SUPPLY = 10000;
export const CREATOR_ADDRESS = process.env.CREATOR_ADDRESS || "";
export const ROYALTY_BASIS_POINTS = 500; // 5% royalties

export const getConnection = () => {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  const endpoint = network === 'mainnet-beta' 
    ? process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta')
    : clusterApiUrl('devnet');
  
  return new Connection(endpoint, 'confirmed');
};

export const getMetaplex = (connection, wallet) => {
  return Metaplex.make(connection).use(wallet);
};

export const NFT_IMAGE_BASE_URL = process.env.NFT_IMAGE_BASE_URL || "https://arweave.net/";
export const METADATA_BASE_URL = process.env.METADATA_BASE_URL || "https://arweave.net/";