import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InfiniteGendersNft } from "../target/types/infinite_genders_nft";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount
} from "@solana/spl-token";
import { assert } from "chai";

const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

describe("infinite-genders-nft", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.InfiniteGendersNft as Program<InfiniteGendersNft>;
  
  let collectionState: PublicKey;
  let collectionMint: PublicKey;
  let collectionAuthority: PublicKey;

  describe("Collection Management", () => {
    it("Initializes the collection", async () => {
      const authority = provider.wallet.publicKey;

      [collectionState] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), authority.toBuffer()],
        program.programId
      );

      [collectionMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection_mint"), collectionState.toBuffer()],
        program.programId
      );

      [collectionAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), collectionState.toBuffer()],
        program.programId
      );

      await program.methods
        .initializeCollection(
          "Infinite Genders Test",
          "IGNDT",
          "https://test.infinitegenders.io/collection"
        )
        .accounts({
          collectionState,
          collectionMint,
          collectionAuthority,
          authority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const collectionStateAccount = await program.account.collectionState.fetch(
        collectionState
      );

      assert.equal(collectionStateAccount.authority.toString(), authority.toString());
      assert.equal(collectionStateAccount.totalMinted.toNumber(), 0);
      assert.equal(collectionStateAccount.name, "Infinite Genders Test");
      assert.equal(collectionStateAccount.symbol, "IGNDT");
    });

    it("Creates the collection NFT", async () => {
      const authority = provider.wallet.publicKey;

      const collectionStateAccount = await program.account.collectionState.fetch(
        collectionState
      );

      const collectionMetadata = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      )[0];

      const collectionEdition = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
          Buffer.from("edition"),
        ],
        METADATA_PROGRAM_ID
      )[0];

      await program.methods
        .createCollectionNft(
          collectionStateAccount.name,
          collectionStateAccount.symbol,
          collectionStateAccount.uri
        )
        .accounts({
          collectionState,
          collectionMint,
          collectionMetadata,
          collectionEdition,
          collectionAuthority,
          authority,
          payer: authority,
          metadataProgram: METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Verify collection mint exists
      const mintInfo = await provider.connection.getAccountInfo(collectionMint);
      assert.isNotNull(mintInfo);
    });

    it("Updates collection metadata", async () => {
      const authority = provider.wallet.publicKey;
      const newUri = "https://updated.infinitegenders.io/collection";

      await program.methods
        .updateCollectionMetadata(newUri, null)
        .accounts({
          collectionState,
          authority,
        })
        .rpc();

      const collectionStateAccount = await program.account.collectionState.fetch(
        collectionState
      );

      assert.equal(collectionStateAccount.uri, newUri);
    });
  });

  describe("NFT Minting", () => {
    let recipient: Keypair;
    let nftMint: PublicKey;

    before(async () => {
      recipient = Keypair.generate();
      
      // Airdrop SOL to recipient
      const airdropTx = await provider.connection.requestAirdrop(
        recipient.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropTx);
    });

    it("Mints a gender NFT", async () => {
      const authority = provider.wallet.publicKey;
      
      const collectionStateAccount = await program.account.collectionState.fetch(
        collectionState
      );

      const tokenId = collectionStateAccount.totalMinted.toNumber();
      const genderSeed = 12345;

      [nftMint] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint"),
          collectionState.toBuffer(),
          collectionStateAccount.totalMinted.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [mintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_authority"), collectionState.toBuffer()],
        program.programId
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
          collectionMint.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      )[0];

      const collectionEdition = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
          Buffer.from("edition"),
        ],
        METADATA_PROGRAM_ID
      )[0];

      const recipientTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        recipient.publicKey
      );

      await program.methods
        .mintGenderNft(
          `Gender Test #${tokenId + 1}`,
          "IGNDT",
          "https://test.infinitegenders.io/metadata/1",
          new anchor.BN(genderSeed)
        )
        .accounts({
          collectionState,
          nftMint,
          mintAuthority,
          nftMetadata,
          nftEdition,
          collectionMint,
          collectionMetadata,
          collectionEdition,
          collectionAuthority,
          recipientTokenAccount,
          recipient: recipient.publicKey,
          authority,
          payer: authority,
          metadataProgram: METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Verify NFT was minted
      const tokenAccountInfo = await getAccount(
        provider.connection,
        recipientTokenAccount
      );
      assert.equal(tokenAccountInfo.amount.toString(), "1");
      assert.equal(tokenAccountInfo.mint.toString(), nftMint.toString());

      // Verify collection state updated
      const updatedCollectionState = await program.account.collectionState.fetch(
        collectionState
      );
      assert.equal(updatedCollectionState.totalMinted.toNumber(), tokenId + 1);
    });

    it("Mints multiple NFTs with unique genders", async () => {
      const authority = provider.wallet.publicKey;
      const mintCount = 3;
      const mints: PublicKey[] = [];

      for (let i = 0; i < mintCount; i++) {
        const collectionStateAccount = await program.account.collectionState.fetch(
          collectionState
        );

        const tokenId = collectionStateAccount.totalMinted.toNumber();
        const genderSeed = Date.now() + i;

        const [nftMint] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("mint"),
            collectionState.toBuffer(),
            collectionStateAccount.totalMinted.toArrayLike(Buffer, "le", 8),
          ],
          program.programId
        );

        mints.push(nftMint);

        const [mintAuthority] = PublicKey.findProgramAddressSync(
          [Buffer.from("mint_authority"), collectionState.toBuffer()],
          program.programId
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
            collectionMint.toBuffer(),
          ],
          METADATA_PROGRAM_ID
        )[0];

        const collectionEdition = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            METADATA_PROGRAM_ID.toBuffer(),
            collectionMint.toBuffer(),
            Buffer.from("edition"),
          ],
          METADATA_PROGRAM_ID
        )[0];

        const recipientTokenAccount = await getAssociatedTokenAddress(
          nftMint,
          recipient.publicKey
        );

        await program.methods
          .mintGenderNft(
            `Gender Test #${tokenId + 1}`,
            "IGNDT",
            `https://test.infinitegenders.io/metadata/${tokenId + 1}`,
            new anchor.BN(genderSeed)
          )
          .accounts({
            collectionState,
            nftMint,
            mintAuthority,
            nftMetadata,
            nftEdition,
            collectionMint,
            collectionMetadata,
            collectionEdition,
            collectionAuthority,
            recipientTokenAccount,
            recipient: recipient.publicKey,
            authority,
            payer: authority,
            metadataProgram: METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();

        // Add delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Verify all mints are unique
      const uniqueMints = new Set(mints.map(m => m.toString()));
      assert.equal(uniqueMints.size, mintCount);

      // Verify final total minted count
      const finalCollectionState = await program.account.collectionState.fetch(
        collectionState
      );
      assert.isAtLeast(finalCollectionState.totalMinted.toNumber(), mintCount);
    });
  });

  describe("Error Cases", () => {
    it("Prevents non-authority from updating collection", async () => {
      const nonAuthority = Keypair.generate();
      
      // Airdrop SOL to non-authority
      const airdropTx = await provider.connection.requestAirdrop(
        nonAuthority.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropTx);

      try {
        await program.methods
          .updateCollectionMetadata("https://malicious.com", null)
          .accounts({
            collectionState,
            authority: nonAuthority.publicKey,
          })
          .signers([nonAuthority])
          .rpc();
        
        assert.fail("Should have thrown error");
      } catch (error) {
        assert.include(error.toString(), "ConstraintHasOne");
      }
    });

    it("Prevents reinitializing collection", async () => {
      const authority = provider.wallet.publicKey;

      try {
        await program.methods
          .initializeCollection(
            "Duplicate Collection",
            "DUP",
            "https://duplicate.com"
          )
          .accounts({
            collectionState,
            collectionMint,
            collectionAuthority,
            authority,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        
        assert.fail("Should have thrown error");
      } catch (error) {
        assert.include(error.toString(), "already in use");
      }
    });
  });
});