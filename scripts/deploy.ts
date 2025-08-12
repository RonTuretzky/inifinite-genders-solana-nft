import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InfiniteGendersNft } from "../target/types/infinite_genders_nft";
import { initializeSDK } from "../sdk";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying Infinite Genders NFT Collection...\n");

  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.InfiniteGendersNft as Program<InfiniteGendersNft>;
  
  console.log("Program ID:", program.programId.toString());
  console.log("Wallet:", provider.wallet.publicKey.toString());
  console.log("Network:", provider.connection.rpcEndpoint);
  
  const sdk = new (await import("../sdk")).InfiniteGendersSDK(program, provider);

  try {
    // Step 1: Initialize Collection
    console.log("\n📝 Step 1: Initializing collection...");
    const { collectionState, collectionMint, tx: initTx } = await sdk.initializeCollection(
      "Infinite Genders",
      "IGNDR",
      "https://api.infinitegenders.io/collection"
    );
    
    console.log("✅ Collection initialized!");
    console.log("   Collection State:", collectionState.toString());
    console.log("   Collection Mint:", collectionMint.toString());
    console.log("   Transaction:", initTx);

    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Create Collection NFT
    console.log("\n🎨 Step 2: Creating collection NFT...");
    const collectionNftTx = await sdk.createCollectionNft();
    console.log("✅ Collection NFT created!");
    console.log("   Transaction:", collectionNftTx);

    // Step 3: Save deployment info
    const deploymentInfo = {
      programId: program.programId.toString(),
      collectionState: collectionState.toString(),
      collectionMint: collectionMint.toString(),
      authority: provider.wallet.publicKey.toString(),
      network: provider.connection.rpcEndpoint,
      deployedAt: new Date().toISOString(),
    };

    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📄 Deployment info saved to deployment.json");
    console.log("\n✨ Deployment complete!");
    console.log("\nYou can now mint NFTs using:");
    console.log("  npm run mint:nft");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});