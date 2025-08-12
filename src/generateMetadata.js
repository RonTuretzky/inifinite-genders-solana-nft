import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateUniqueGenderCombination, getGenderAttributes } from './genders.js';
import { COLLECTION_NAME, COLLECTION_SYMBOL, COLLECTION_DESCRIPTION } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateMetadataForToken(tokenId) {
  const gender = generateUniqueGenderCombination(tokenId);
  
  const metadata = {
    name: `Gender #${tokenId}: ${gender.name}`,
    symbol: COLLECTION_SYMBOL,
    description: `A unique gender identity: ${gender.name}. This NFT represents one of infinite possible gender combinations, generated through a deterministic algorithm that ensures each token ID produces a unique and reproducible gender identity.\n\nComponents: ${gender.components.join(', ')}\nRarity: ${gender.rarity}`,
    seller_fee_basis_points: 500,
    image: `${tokenId}.png`,
    external_url: `https://infinitegenders.io/token/${tokenId}`,
    attributes: getGenderAttributes(gender),
    collection: {
      name: COLLECTION_NAME,
      family: COLLECTION_NAME
    },
    properties: {
      category: "image",
      files: [
        {
          uri: `${tokenId}.png`,
          type: "image/png"
        }
      ],
      creators: [
        {
          address: "YOUR_CREATOR_ADDRESS_HERE",
          share: 100
        }
      ]
    }
  };
  
  return metadata;
}

function generateBatchMetadata(startId, count) {
  const metadataDir = path.join(__dirname, '..', 'assets', 'metadata');
  
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }
  
  const allMetadata = [];
  
  for (let i = 0; i < count; i++) {
    const tokenId = startId + i;
    const metadata = generateMetadataForToken(tokenId);
    
    fs.writeFileSync(
      path.join(metadataDir, `${tokenId}.json`),
      JSON.stringify(metadata, null, 2)
    );
    
    allMetadata.push(metadata);
    
    console.log(`Generated metadata for token #${tokenId}: ${metadata.name}`);
  }
  
  fs.writeFileSync(
    path.join(metadataDir, 'collection.json'),
    JSON.stringify({
      name: COLLECTION_NAME,
      symbol: COLLECTION_SYMBOL,
      description: COLLECTION_DESCRIPTION,
      image: "collection.png",
      attributes: [
        { trait_type: "Type", value: "Collection" },
        { trait_type: "Total Possible Combinations", value: "Infinite" }
      ],
      properties: {
        category: "image",
        files: [
          {
            uri: "collection.png",
            type: "image/png"
          }
        ]
      }
    }, null, 2)
  );
  
  return allMetadata;
}

function analyzeGenderDistribution(count = 1000) {
  const rarityCount = {
    Common: 0,
    Uncommon: 0,
    Rare: 0,
    Legendary: 0,
    Mythic: 0
  };
  
  const componentFrequency = {};
  const modifierFrequency = {};
  
  for (let i = 0; i < count; i++) {
    const gender = generateUniqueGenderCombination(i);
    
    rarityCount[gender.rarity]++;
    
    gender.components.forEach(comp => {
      componentFrequency[comp] = (componentFrequency[comp] || 0) + 1;
    });
    
    gender.modifiers.forEach(mod => {
      modifierFrequency[mod] = (modifierFrequency[mod] || 0) + 1;
    });
  }
  
  console.log('\n=== Gender Distribution Analysis ===');
  console.log(`Sample size: ${count} tokens\n`);
  
  console.log('Rarity Distribution:');
  Object.entries(rarityCount).forEach(([rarity, count]) => {
    const percentage = ((count / count) * 100).toFixed(2);
    console.log(`  ${rarity}: ${count} (${percentage}%)`);
  });
  
  console.log('\nTop 10 Most Common Components:');
  const sortedComponents = Object.entries(componentFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  sortedComponents.forEach(([comp, freq]) => {
    console.log(`  ${comp}: ${freq} occurrences`);
  });
  
  console.log('\nModifier Frequency:');
  const sortedModifiers = Object.entries(modifierFrequency)
    .sort((a, b) => b[1] - a[1]);
  sortedModifiers.forEach(([mod, freq]) => {
    console.log(`  ${mod}: ${freq} occurrences`);
  });
}

function generateExamples(count = 20) {
  console.log('\n=== Example Gender Generations ===\n');
  
  for (let i = 0; i < count; i++) {
    const tokenId = Math.floor(Math.random() * 10000);
    const gender = generateUniqueGenderCombination(tokenId);
    
    console.log(`Token #${tokenId}:`);
    console.log(`  Name: ${gender.name}`);
    console.log(`  Components: ${gender.components.join(', ')}`);
    console.log(`  Modifiers: ${gender.modifiers.length > 0 ? gender.modifiers.join(', ') : 'None'}`);
    console.log(`  Rarity: ${gender.rarity}`);
    console.log('');
  }
}

async function main() {
  const command = process.argv[2];
  
  switch(command) {
    case 'generate':
      const startId = parseInt(process.argv[3]) || 0;
      const count = parseInt(process.argv[4]) || 100;
      generateBatchMetadata(startId, count);
      console.log(`\nGenerated ${count} metadata files starting from ID ${startId}`);
      break;
      
    case 'analyze':
      const sampleSize = parseInt(process.argv[3]) || 1000;
      analyzeGenderDistribution(sampleSize);
      break;
      
    case 'examples':
      const exampleCount = parseInt(process.argv[3]) || 20;
      generateExamples(exampleCount);
      break;
      
    case 'single':
      const tokenId = parseInt(process.argv[3]) || 0;
      const metadata = generateMetadataForToken(tokenId);
      console.log(JSON.stringify(metadata, null, 2));
      break;
      
    default:
      console.log('Usage:');
      console.log('  npm run generate-metadata generate [startId] [count] - Generate batch metadata');
      console.log('  npm run generate-metadata analyze [sampleSize] - Analyze gender distribution');
      console.log('  npm run generate-metadata examples [count] - Show example generations');
      console.log('  npm run generate-metadata single [tokenId] - Generate single metadata');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateMetadataForToken, generateBatchMetadata, analyzeGenderDistribution };