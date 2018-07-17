const CryptoJS = require("crypto-js")
const hexToBinary = require("hex-to-binary")

const BLOCK_GENERATION_INTERVAL = 10
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10

class Block {
    constructor(index, hash, previousHash, timestamp, data, difficulty, nounce){
        this.index = index
		this.hash = hash
		this.previousHash = previousHash
		this.timestamp = timestamp
		this.data = data
		this.difficulty = difficulty
		this.nounce = nounce
    }
}

const genesisBlock = new Block(
			0,
			"sha-256 hashed result of genesis block",
			null,
			new Date().getTime()/1000,
			"The Genesis Block",
			0,
			0
)

let blockchain = [genesisBlock]

const getNewestBlock = () => blockchain[blockchain.length - 1]

const getTimestamp = () => Math.round(new Date().getTime() / 1000)

const getBlockchain = () => blockchain

const createHash = (index, previousHash, timestamp, data, difficulty, nounce) =>
    CryptoJS.SHA256(index + previousHash, timestamp + JSON.stringify(data) + difficulty, nounce)
		.toString()

const getBlockHash = (block) => createHash(block.index, block.previousHash,
											block.timestamp, block.data, block.difficulty, block.nounce)

const isTimestampValid = (newBlock, previousBlock) => {
	return (previousBlock.timestamp - 60 < newBlock.timestamp &&
			newBlock.timestamp - 60 < getTimestamp()
	)
}

const createNewBlock = data => {
    const previousBlock = getNewestBlock()
    const newBlockIndex = previousBlock.index + 1
    const newTimestamp = getTimestamp()
    const newHash = createHash(newBlockIndex, 
			       previousBlock.hash, 
	    		       newTimestamp,
    			       data)
	const difficulty = findDifficulty(getBlockchain())
    const newBlock = findBlock(newBlockIndex,
    			       	newHash,
    			       	previousBlock.hash,
    			       	newTimestamp,
    			    	data,
        				difficulty)
    addBlockToChain(newBlock)
	require("./p2p").broadcastNewBlock()
    return newBlock
}

const findDifficulty = (blockchain) => {
	const newestBlock = blockchain[blockchain.length - 1]
	if(newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && newestBlock.index !== 0){
		return calculateNewDifficulty(newestBlock, blockchain)
	} else{
		return newestBlock.difficulty
	}
}

const calculateNewDifficulty = (newestBlock, blockchain) => {
	const lastCalculatedBlock = blockchain[blockchain.length - BLOCK_GENERATION_INTERVAL]
	const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL
	const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;
	if(timeTaken < timeExpected/ 2){
		return lastCalculatedBlock.difficulty + 1
	}else if (timeTaken > timeExpected * 2){
		return lastCalculatedBlock.difficulty -1
	} else {
		return lastCalculatedBlock.difficulty
	}
}

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
	let nounce = 0

	while(true){
		const hash = createHash(index, previousHash, timestamp, data, difficulty, nounce)
		if(hashMatchesDifficulty){
			return new Block(index, hash, previousHash, timestamp, data, difficulty, nounce)
		}else {
			nounce = nounce + 1
		}
	}
}

const hashMatchesDifficulty = (hash, difficulty) => {
	const hashInBinary = hexToBinary(hash)
	const requiredZeros = "0".repeat(difficulty)
	return hashInBinary.startsWith(requiredZeros)
}

const isBlockValid = (candidateBlock, latestBlock) => {
    if(!isBlockStructureValid(candidateBlock)){
		console.log("The candidate block structure is not valid")
		return false
    }
    else if(latestBlock.index + 1 !== candidateBlock.index){
        console.log('The candidate block does not have a valid index.')
		return false
    }
    else if(latestBlock.hash !== candidateBlock.previousHash){
		console.log('The previousHash of the candidate block is not the hash of the latest block.')
		return false
    }
    else if(getBlockHash(candidateBlock) !== candidateBlock.hash){
		console.log('The hash of this block is invalid.')
		return false
    }
    else if(isTimestampValid(candidateBlock, latestBlock)){
		console.log('The timestamp of this block is dodgy')
		return false
    }
    return true
}

const isBlockStructureValid = (block) => {
    return (
        typeof block.index === "number" &&
	    typeof block.hash === "string" &&
	    typeof block.previousHash === "string" &&
	    typeof block.timestamp === "number" &&
	    typeof block.data === "string"
    )
}

const isChainValid = candidateChain => {
    const isGenesisValid = block => {
	return JSON.stringify(block) === JSON.stringify(genesisBlock)
    }
    if(!isGenesisValid(candidateChain[0])){
	console.log("The candidateChains's genesisBlock is not the same as our genesisBlock")
	return false;
    }
    for(let i=1; i < candidateChain.length; i++){
	if(!isBlockValid(candidateChain[i], candidateChain[i-1])){
	    return false
	}
    }
    return true
}

const sumDifficulty = anyBlockchain => {
    anyBlockchain
		.map(block => block.difficulty)
		.map(difficulty => Math.pow(2, difficulty))
		.reduce((a, b) => a + b)
}


const replaceChain = candidateChain => {
    if(isChainValid(candidateChain) &&
		sumDifficulty((candidateChain) > sumDifficulty(getBlockchain()))){
		blockchain = candidateChain
		return true
    } else{
		return false
    }
}

const addBlockToChain = newBlock => {
    if(isBlockValid(newBlock, getNewestBlock())){
		getBlockchain().push(newBlock)
		return true
    } else {
		return false
    }
}

module.exports = {
	addBlockToChain,
    getBlockchain,
    createNewBlock,
    getNewestBlock,
    replaceChain,
    isBlockStructureValid
}
