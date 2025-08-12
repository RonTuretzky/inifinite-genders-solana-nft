#!/usr/bin/env node

import { generateUniqueGenderCombination, genderList } from './src/genders.js';

console.log(`
╔══════════════════════════════════════════════════════╗
║        INFINITE GENDERS SOLANA NFT DEMO             ║
╚══════════════════════════════════════════════════════╝
`);

console.log(`Total base genders available: ${genderList.length}`);
console.log(`Possible unique combinations: Infinite!\n`);

console.log('═══════════════════════════════════════════════════════');
console.log('                  SAMPLE GENERATIONS                    ');
console.log('═══════════════════════════════════════════════════════\n');

// Generate some examples
const examples = [
  { id: 1, description: "First NFT" },
  { id: 42, description: "The Answer" },
  { id: 69, description: "Nice" },
  { id: 420, description: "Blazing" },
  { id: 1337, description: "Elite" },
  { id: 9999, description: "Almost 10k" },
  { id: Date.now() % 10000, description: "Current Time" }
];

examples.forEach(({ id, description }) => {
  const gender = generateUniqueGenderCombination(id);
  
  console.log(`Token #${id} (${description}):`);
  console.log(`├─ Name: ${gender.name}`);
  console.log(`├─ Components: ${gender.components.join(', ')}`);
  console.log(`├─ Modifiers: ${gender.modifiers.length > 0 ? gender.modifiers.join(', ') : 'None'}`);
  console.log(`└─ Rarity: ${getRarityEmoji(gender.rarity)} ${gender.rarity}`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════');
console.log('                  RARITY DISTRIBUTION                   ');
console.log('═══════════════════════════════════════════════════════\n');

// Analyze rarity distribution
const rarityCount = {
  Common: 0,
  Uncommon: 0,
  Rare: 0,
  Legendary: 0,
  Mythic: 0
};

const sampleSize = 10000;
for (let i = 0; i < sampleSize; i++) {
  const gender = generateUniqueGenderCombination(i);
  rarityCount[gender.rarity]++;
}

Object.entries(rarityCount).forEach(([rarity, count]) => {
  const percentage = ((count / sampleSize) * 100).toFixed(2);
  const bar = '█'.repeat(Math.floor(percentage / 2));
  console.log(`${getRarityEmoji(rarity)} ${rarity.padEnd(10)} ${bar} ${percentage}%`);
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('                   UNIQUE FEATURES                      ');
console.log('═══════════════════════════════════════════════════════\n');

console.log('• Each NFT generates a unique gender identity');
console.log('• Deterministic generation (same ID = same gender)');
console.log('• 2-5 gender components per NFT');
console.log('• Dynamic modifier system for extra uniqueness');
console.log('• Rarity based on complexity and modifiers');
console.log('• Infinite possible combinations');

console.log('\n═══════════════════════════════════════════════════════');
console.log('                    HOW TO USE                          ');
console.log('═══════════════════════════════════════════════════════\n');

console.log('1. Set up your Solana wallet (see .env.example)');
console.log('2. Run: npm run mint create-collection');
console.log('3. Run: npm run mint mint [address] [token_id]');
console.log('4. Or open index.html for web interface');

console.log('\n═══════════════════════════════════════════════════════');
console.log('           Try different token IDs to explore!          ');
console.log('═══════════════════════════════════════════════════════\n');

function getRarityEmoji(rarity) {
  const emojis = {
    Common: '⚪',
    Uncommon: '🟢',
    Rare: '🔵',
    Legendary: '🟣',
    Mythic: '🔴'
  };
  return emojis[rarity] || '⚫';
}