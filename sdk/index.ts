import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InfiniteGendersNft } from "../target/types/infinite_genders_nft";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY 
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from "@solana/spl-token";
import { generateUniqueGenderCombination } from "../src/genders";

const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export class InfiniteGendersSDK {
  program: Program<InfiniteGendersNft>;
  provider: anchor.AnchorProvider;

  constructor(program: Program<InfiniteGendersNft>, provider: anchor.AnchorProvider) {
    this.program = program;
    this.provider = provider;
  }

  async initializeCollection(
    name: string,
    symbol: string,
    uri: string
  ): Promise<{
    collectionState: PublicKey;
    collectionMint: PublicKey;
    tx: string;
  }> {
    const authority = this.provider.wallet.publicKey;

    const [collectionState] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), authority.toBuffer()],
      this.program.programId
    );

    const [collectionMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_mint"), collectionState.toBuffer()],
      this.program.programId
    );

    const [collectionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), collectionState.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .initializeCollection(name, symbol, uri)
      .accounts({
        collectionState,
        collectionMint,
        collectionAuthority,
        authority,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return { collectionState, collectionMint, tx };
  }

  async createCollectionNft(): Promise<string> {
    const authority = this.provider.wallet.publicKey;

    const [collectionState] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), authority.toBuffer()],
      this.program.programId
    );

    const collectionStateAccount = await this.program.account.collectionState.fetch(
      collectionState
    );

    const [collectionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), collectionState.toBuffer()],
      this.program.programId
    );

    const collectionMetadata = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        collectionStateAccount.collectionMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const collectionEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        collectionStateAccount.collectionMint.toBuffer(),
        Buffer.from("edition"),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const tx = await this.program.methods
      .createCollectionNft(
        collectionStateAccount.name,
        collectionStateAccount.symbol,
        collectionStateAccount.uri
      )
      .accounts({
        collectionState,
        collectionMint: collectionStateAccount.collectionMint,
        collectionMetadata,
        collectionEdition,
        collectionAuthority,
        authority,
        payer: authority,
        metadataProgram: METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return tx;
  }

  async mintGenderNft(
    recipient: PublicKey,
    genderSeed?: number
  ): Promise<{
    mint: PublicKey;
    metadata: any;
    tx: string;
  }> {
    const authority = this.provider.wallet.publicKey;

    const [collectionState] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), authority.toBuffer()],
      this.program.programId
    );

    const collectionStateAccount = await this.program.account.collectionState.fetch(
      collectionState
    );

    const tokenId = collectionStateAccount.totalMinted.toNumber() + 1;
    const effectiveGenderSeed = genderSeed ?? tokenId;
    
    const gender = generateUniqueGenderCombination(effectiveGenderSeed);
    
    const metadata = {
      name: `Gender #${tokenId}: ${gender.name}`,
      symbol: collectionStateAccount.symbol,
      uri: `https://api.infinitegenders.io/metadata/${tokenId}`,
      genderData: gender
    };

    const [nftMint] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint"),
        collectionState.toBuffer(),
        collectionStateAccount.totalMinted.toArrayLike(Buffer, "le", 8),
      ],
      this.program.programId
    );

    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_authority"), collectionState.toBuffer()],
      this.program.programId
    );

    const [collectionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), collectionState.toBuffer()],
      this.program.programId
    );

    const nftMetadata = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const nftEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
        Buffer.from("edition"),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const collectionMetadata = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        collectionStateAccount.collectionMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const collectionEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        collectionStateAccount.collectionMint.toBuffer(),
        Buffer.from("edition"),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const recipientTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      recipient
    );

    const tx = await this.program.methods
      .mintGenderNft(
        metadata.name,
        metadata.symbol,
        metadata.uri,
        new anchor.BN(effectiveGenderSeed)
      )
      .accounts({
        collectionState,
        nftMint,
        mintAuthority,
        nftMetadata,
        nftEdition,
        collectionMint: collectionStateAccount.collectionMint,
        collectionMetadata,
        collectionEdition,
        collectionAuthority,
        recipientTokenAccount,
        recipient,
        authority,
        payer: authority,
        metadataProgram: METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return { mint: nftMint, metadata, tx };
  }

  async getCollectionState(): Promise<any> {
    const authority = this.provider.wallet.publicKey;
    const [collectionState] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), authority.toBuffer()],
      this.program.programId
    );

    return await this.program.account.collectionState.fetch(collectionState);
  }

  async updateCollectionMetadata(
    newUri?: string,
    newName?: string
  ): Promise<string> {
    const authority = this.provider.wallet.publicKey;

    const [collectionState] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), authority.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .updateCollectionMetadata(newUri || null, newName || null)
      .accounts({
        collectionState,
        authority,
      })
      .rpc();

    return tx;
  }
}

export async function initializeSDK(
  connection: anchor.web3.Connection,
  wallet: anchor.Wallet,
  programId?: PublicKey
): Promise<InfiniteGendersSDK> {
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const idl = await anchor.Program.fetchIdl(
    programId || new PublicKey("GNDRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
    provider
  );

  const program = new anchor.Program(
    idl as InfiniteGendersNft,
    provider
  ) as Program<InfiniteGendersNft>;

  return new InfiniteGendersSDK(program, provider);
}