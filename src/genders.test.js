import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUniqueGenderCombination, getGenderAttributes, genderList } from './genders.js';

describe('Gender Generation Tests', () => {
  it('should generate a gender with valid components', () => {
    const gender = generateUniqueGenderCombination(12345);
    
    assert.ok(gender.name, 'Gender should have a name');
    assert.ok(Array.isArray(gender.components), 'Components should be an array');
    assert.ok(gender.components.length >= 2, 'Should have at least 2 components');
    assert.ok(gender.components.length <= 5, 'Should have at most 5 components');
    
    gender.components.forEach(component => {
      assert.ok(genderList.includes(component), `Component "${component}" should be in gender list`);
    });
  });
  
  it('should generate deterministic results for the same token ID', () => {
    const tokenId = 54321;
    const gender1 = generateUniqueGenderCombination(tokenId);
    const gender2 = generateUniqueGenderCombination(tokenId);
    
    assert.strictEqual(gender1.name, gender2.name, 'Same token ID should produce same name');
    assert.deepStrictEqual(gender1.components, gender2.components, 'Same token ID should produce same components');
    assert.strictEqual(gender1.rarity, gender2.rarity, 'Same token ID should produce same rarity');
  });
  
  it('should generate different results for different token IDs', () => {
    const gender1 = generateUniqueGenderCombination(1);
    const gender2 = generateUniqueGenderCombination(2);
    const gender3 = generateUniqueGenderCombination(3);
    
    const names = [gender1.name, gender2.name, gender3.name];
    const uniqueNames = new Set(names);
    
    assert.ok(uniqueNames.size > 1, 'Different token IDs should produce different results');
  });
  
  it('should assign correct rarity levels', () => {
    const validRarities = ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'];
    
    for (let i = 0; i < 100; i++) {
      const gender = generateUniqueGenderCombination(i);
      assert.ok(validRarities.includes(gender.rarity), `Rarity "${gender.rarity}" should be valid`);
    }
  });
  
  it('should apply modifiers correctly', () => {
    let hasModifiers = false;
    let hasNoModifiers = false;
    
    for (let i = 0; i < 100; i++) {
      const gender = generateUniqueGenderCombination(i);
      
      if (gender.modifiers.length > 0) {
        hasModifiers = true;
        
        gender.modifiers.forEach(modifier => {
          assert.ok(
            gender.name.includes(modifier.replace('-', '')), 
            `Modifier "${modifier}" should be in gender name`
          );
        });
      } else {
        hasNoModifiers = true;
      }
      
      if (hasModifiers && hasNoModifiers) break;
    }
    
    assert.ok(hasModifiers, 'Some genders should have modifiers');
    assert.ok(hasNoModifiers, 'Some genders should not have modifiers');
  });
  
  it('should generate valid attributes for metadata', () => {
    const gender = generateUniqueGenderCombination(99999);
    const attributes = getGenderAttributes(gender);
    
    assert.ok(Array.isArray(attributes), 'Attributes should be an array');
    assert.ok(attributes.length > 0, 'Should have at least one attribute');
    
    const requiredTraits = ['Gender Name', 'Components Count', 'Primary Component', 'Rarity'];
    requiredTraits.forEach(trait => {
      const found = attributes.find(attr => attr.trait_type === trait);
      assert.ok(found, `Should have "${trait}" attribute`);
    });
    
    attributes.forEach(attr => {
      assert.ok(attr.trait_type, 'Each attribute should have a trait_type');
      assert.ok(attr.value !== undefined, 'Each attribute should have a value');
    });
  });
  
  it('should handle edge cases for token IDs', () => {
    const edgeCases = [0, 1, -1, Number.MAX_SAFE_INTEGER, 0.5, Math.PI];
    
    edgeCases.forEach(tokenId => {
      const gender = generateUniqueGenderCombination(tokenId);
      assert.ok(gender.name, `Should generate valid gender for token ID ${tokenId}`);
      assert.ok(gender.components.length >= 2, `Should have valid components for token ID ${tokenId}`);
    });
  });
  
  it('should not have duplicate components in a single gender', () => {
    for (let i = 0; i < 100; i++) {
      const gender = generateUniqueGenderCombination(i);
      const uniqueComponents = new Set(gender.components);
      
      assert.strictEqual(
        uniqueComponents.size, 
        gender.components.length, 
        'All components should be unique within a gender'
      );
    }
  });
  
  it('should create pronounceable and readable gender names', () => {
    for (let i = 0; i < 50; i++) {
      const gender = generateUniqueGenderCombination(i);
      
      assert.ok(gender.name.length > 0, 'Gender name should not be empty');
      assert.ok(gender.name.length < 500, 'Gender name should not be too long');
      assert.ok(!gender.name.includes('undefined'), 'Gender name should not contain undefined');
      assert.ok(!gender.name.includes('null'), 'Gender name should not contain null');
    }
  });
  
  it('should have reasonable distribution of component counts', () => {
    const componentCounts = { 2: 0, 3: 0, 4: 0, 5: 0 };
    const sampleSize = 1000;
    
    for (let i = 0; i < sampleSize; i++) {
      const gender = generateUniqueGenderCombination(i);
      componentCounts[gender.components.length]++;
    }
    
    Object.entries(componentCounts).forEach(([count, frequency]) => {
      const percentage = (frequency / sampleSize) * 100;
      assert.ok(percentage > 5, `Component count ${count} should appear in at least 5% of cases`);
      console.log(`  ${count} components: ${frequency} (${percentage.toFixed(1)}%)`);
    });
  });
});

describe('Gender List Validation', () => {
  it('should have a substantial gender list', () => {
    assert.ok(genderList.length > 100, 'Should have at least 100 genders in the list');
  });
  
  it('should not have duplicate entries in gender list', () => {
    const uniqueGenders = new Set(genderList);
    assert.strictEqual(uniqueGenders.size, genderList.length, 'All genders in list should be unique');
  });
  
  it('should have valid gender names', () => {
    genderList.forEach(gender => {
      assert.ok(gender.length > 0, 'Gender name should not be empty');
      assert.ok(typeof gender === 'string', 'Each gender should be a string');
    });
  });
});