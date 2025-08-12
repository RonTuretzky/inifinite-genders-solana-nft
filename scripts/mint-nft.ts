import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InfiniteGendersNft } from "../target/types/infinite_genders_nft";
import { PublicKey } from "@solana/web3.js";
import { initializeSDK } from "../sdk";
import fs from "fs";
import path from "path";

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const recipientAddress = args[0];
  const genderSeed = args[1] ? parseInt(args[1]) : undefined;

  if (!recipientAddress) {
    console.error("Usage: npm run mint:nft <recipient_address> [gender_seed]");
    process.exit(1);
  }

  console.log("🎨 Minting Infinite Genders NFT...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployment.json not found. Please run deploy script first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.InfiniteGendersNft as Program<InfiniteGendersNft>;
  const sdk = new (await import("../sdk")).InfiniteGendersSDK(program, provider);

  try {
    // Validate recipient address
    let recipient: PublicKey;
    try {
      recipient = new PublicKey(recipientAddress);
    } catch {
      console.error("❌ Invalid recipient address");
      process.exit(1);
    }

    // Get current collection state
    const collectionState = await sdk.getCollectionState();
    const tokenId = collectionState.totalMinted.toNumber() + 1;

    console.log("Collection:", collectionState.name);
    console.log("Total Minted:", collectionState.totalMinted.toString());
    console.log("Minting Token #" + tokenId);
    console.log("Recipient:", recipient.toString());
    
    if (genderSeed !== undefined) {
      console.log("Gender Seed:", genderSeed);
    }

    // Mint the NFT
    console.log("\n⏳ Minting NFT...");
    const { mint, metadata, tx } = await sdk.mintGenderNft(recipient, genderSeed);

    console.log("\n✅ NFT Minted Successfully!");
    console.log("═══════════════════════════════════════");
    console.log("🆔 Token ID:", tokenId);
    console.log("🏷️  Name:", metadata.name);
    console.log("🌈 Gender:", metadata.genderData.name);
    console.log("📦 Components:", metadata.genderData.components.join(", "));
    console.log("✨ Modifiers:", metadata.genderData.modifiers.join(", ") || "None");
    console.log("💎 Rarity:", metadata.genderData.rarity);
    console.log("═══════════════════════════════════════");
    console.log("🔑 Mint Address:", mint.toString());
    console.log("📝 Transaction:", tx);
    console.log("\n🔗 View on Solana Explorer:");
    console.log(`   https://explorer.solana.com/address/${mint.toString()}?cluster=devnet`);

  } catch (error) {
    console.error("\n❌ Minting failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});