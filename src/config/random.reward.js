import Web3 from "web3";

// Initialize Web3 (works with MetaMask or fallback RPC)
const web3 = new Web3(window.ethereum || process.env.NEXT_PUBLIC_RPC_URL);

/**
 * Weighted random selection from item array
 * @param {Array} items - Array of items [{ id, name, weight }]
 * @param {number} randFloat - Random number between 0 and 1
 * @returns {Object} Selected item
 */
export function weightedRandom(items, randFloat) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array is empty or invalid");
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let acc = 0;

  for (const item of items) {
    acc += item.weight / totalWeight;
    if (randFloat <= acc) return item;
  }

  return items[items.length - 1];
}

/**
 * Opens a pack in a provably fair way
 * @param {Array} items - Array of items with weights
 * @param {string} serverSeedHash - SHA3 hash of server seed (commitment)
 * @param {string} serverSeed - Server seed (revealed after)
 * @param {string} clientSeed - Client seed (from user)
 * @param {number|string} nonce - Unique per spin
 * @returns {Promise<Object>} Result with final item, 3 selected items, and proof
 */
export async function openPack(
  items,
  serverSeedHash,
  serverSeed,
  clientSeed,
  nonce
) {
  if (!items || !items.length) throw new Error("Items array required");

  // Get latest block hash (public verifiable randomness)
  const latestBlock = await web3.eth.getBlock("latest");
  const blockHash = latestBlock.hash;

  // Combine inputs for randomness
  const combined = web3.utils.sha3(
    `${serverSeed}:${clientSeed}:${blockHash}:${nonce}`
  );

  // Helper to create random floats deterministically
  const randomFloatFromSeed = (seed, i) => {
    const hash = web3.utils.sha3(`${seed}:${i}`);
    return parseInt(hash.slice(2, 10), 16) / 0xffffffff;
  };

  // Select 3 random items based on weights
  const selectedItems = [];
  for (let i = 0; i < 3; i++) {
    const rand = randomFloatFromSeed(combined, i);
    selectedItems.push(weightedRandom(items, rand));
  }

  // Pick 1 final item randomly from the 3
  const finalRand = randomFloatFromSeed(combined, "final");
  const finalIndex = Math.floor(finalRand * 3);
  const finalItem = selectedItems[finalIndex];

  return {
    finalItem,
    selectedItems,
    proof: {
      serverSeedHash,
      clientSeed,
      blockHash,
      nonce,
    },
  };
}
