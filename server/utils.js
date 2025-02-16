export async function getBlockSize(provider, blockNumber) {
    const block = await provider.getBlock(blockNumber);
    return block.size; // Directly fetch the actual block size
}