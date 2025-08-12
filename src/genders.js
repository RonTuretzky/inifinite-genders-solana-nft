export const genderList = [
  "Abinary", "Agender", "Agenderfluid", "Agenderflux", "Genderblank",
  "Genderfree", "Gendervoid", "Polyagender", "Ambigender", "Androgyne",
  "Androgynous", "Aporagender", "Autigender", "Autonomique", "Bakla",
  "Bigender", "Binary", "Bissu", "Butch", "Caelgender",
  "Calabai", "Calalai", "Cisgender", "Cis female", "Cis male",
  "Cis man", "Cis woman", "Colorgender", "Crystagender", "Demi-boy",
  "Demiflux", "Demigender", "Demi-girl", "Demi-guy", "Demi-man",
  "Demi-woman", "Dual gender", "Egogender", "Eunuch", "Faʻafafine",
  "Female", "Female to male", "Femme", "FTM", "Gender bender",
  "Gender diverse", "Gender gifted", "Genderfae", "Genderfaun", "Genderfluid",
  "Genderflux", "Genderfuck", "Genderless", "Gender nonconforming", "Genderpunk",
  "Genderqueer", "Gender questioning", "Gender variant", "Graygender", "Hijra",
  "Intergender", "Intersex", "Ipsogender", "Juxera", "Kathoey",
  "Kingender", "Leogender", "Lykh", "Māhū", "Male",
  "Male to female", "Man", "Man of trans experience", "Maverique", "Meta-gender",
  "Monogender", "MTF", "Multigender", "Muxe", "Neither",
  "Neurogender", "Neutrois", "Non-binary", "Non-binary man", "Non-binary transgender",
  "Non-binary woman", "Omnigender", "Other", "Pangender", "Person of transgendered experience",
  "Polygender", "Proxvir", "Queer", "Quoigender", "Sapphogender",
  "Sekhet", "Stargender", "Staticgender", "Third gender", "Trans",
  "Trans*", "Trans female", "Trans male", "Trans man", "Transfluid",
  "Trans person", "Trans woman", "Transgender", "Transgender female", "Transgender male",
  "Transgender man", "Transgender person", "Transgender woman", "Transfeminine", "Transmasculine",
  "Transandrogynous", "Transsexual", "Transsexual female", "Transsexual male", "Transsexual man",
  "Transsexual person", "Transsexual woman", "Travesti", "Trigender", "Tumtum",
  "Two spirit", "Unigender", "Vakasalewalewa", "Waria", "Winkte",
  "Woman", "Woman of trans experience", "X-gender", "X-jendā", "Xenogenders"
];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateUniqueGenderCombination(tokenId) {
  const minComponents = 2;
  const maxComponents = 5;
  
  let random = seededRandom(tokenId);
  const numComponents = Math.floor(random * (maxComponents - minComponents + 1)) + minComponents;
  
  const selectedGenders = new Set();
  const availableGenders = [...genderList];
  
  for (let i = 0; i < numComponents && availableGenders.length > 0; i++) {
    random = seededRandom(tokenId * (i + 1) + 12345);
    const index = Math.floor(random * availableGenders.length);
    selectedGenders.add(availableGenders[index]);
    availableGenders.splice(index, 1);
  }
  
  const genderArray = Array.from(selectedGenders);
  
  const modifiers = [
    { prefix: "Ultra-", probability: 0.1 },
    { prefix: "Hyper-", probability: 0.1 },
    { prefix: "Meta-", probability: 0.1 },
    { prefix: "Neo-", probability: 0.15 },
    { prefix: "Quantum-", probability: 0.05 },
    { prefix: "Cyber-", probability: 0.1 },
    { prefix: "Post-", probability: 0.1 },
    { prefix: "Pre-", probability: 0.05 },
    { suffix: "-flux", probability: 0.1 },
    { suffix: "-fluid", probability: 0.1 },
    { suffix: "-void", probability: 0.05 },
    { suffix: "-spectrum", probability: 0.1 }
  ];
  
  const appliedModifiers = [];
  modifiers.forEach((mod, index) => {
    random = seededRandom(tokenId * (index + 100));
    if (random < mod.probability) {
      appliedModifiers.push(mod);
    }
  });
  
  let genderName = genderArray.join("-");
  
  appliedModifiers.forEach(mod => {
    if (mod.prefix) {
      genderName = mod.prefix + genderName;
    }
    if (mod.suffix) {
      genderName = genderName + mod.suffix;
    }
  });
  
  return {
    name: genderName,
    components: genderArray,
    modifiers: appliedModifiers.map(m => m.prefix || m.suffix),
    rarity: calculateRarity(numComponents, appliedModifiers.length)
  };
}

function calculateRarity(numComponents, numModifiers) {
  const baseRarity = numComponents <= 2 ? "Common" : 
                    numComponents === 3 ? "Uncommon" :
                    numComponents === 4 ? "Rare" : "Legendary";
  
  if (numModifiers >= 3) return "Mythic";
  if (numModifiers >= 2 && baseRarity === "Legendary") return "Mythic";
  if (numModifiers >= 1 && baseRarity === "Rare") return "Legendary";
  
  return baseRarity;
}

export function getGenderAttributes(gender) {
  return [
    {
      trait_type: "Gender Name",
      value: gender.name
    },
    {
      trait_type: "Components Count",
      value: gender.components.length
    },
    {
      trait_type: "Primary Component",
      value: gender.components[0]
    },
    {
      trait_type: "Rarity",
      value: gender.rarity
    },
    {
      trait_type: "Modifiers Count",
      value: gender.modifiers.length
    },
    ...gender.components.map((comp, index) => ({
      trait_type: `Component ${index + 1}`,
      value: comp
    })),
    ...gender.modifiers.map((mod, index) => ({
      trait_type: `Modifier ${index + 1}`,
      value: mod
    }))
  ];
}