const CryptoJS = require("crypto-js")
const hexToBinary = require("hex-to-binary")
const Wallet = require("./wallet")
const Transaction = require("./transaction")
const MemPool = require("./memPool")
const _ = require("lodash")

const BLOCK_GENERATION_INTERVAL = 10
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10

const { getBalance, getPublicKeyFromWallet, createTransaction, getPrivateKeyFromWallet } = Wallet
const { getUpdatedUnspentTransactionOutputs, createCoinbaseTransaction, getTransactionId } = Transaction
const { addToMempool, getMempool, updateMempool } = MemPool

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
const genesisTransaction = {
   transactionInputs: [{ signature: "", unspentTransactionOutputId: "", unspentTransactionOutputIndex: 0 }],
   transactionOutputs: [
     {
       address:
         "049834215802c8d0c6b8211715f852fb19c77c657325b8bec0fec962a8526d5348d3e10253961e4ddcba59538261241163472a51152df21c04aa0ca9905eb0e01a",
       amount: 50
     }
   ],
   id: "e4ce1254070c12e08c4ebcd59b85aef6d7a2aee44b1f349157d9928d67e0b05e"
 }


const genesisBlock = new Block(index=0,
							   hash="sha-256 hashed result of genesis block",
							   previousHash="",
							   timestamp=new Date().getTime()/1000,
							   data=[genesisTransaction],
							   difficulty=0,
							   nounce=0)

let blockchain = [genesisBlock]
let unspentTransactionOutputs = getUpdatedUnspentTransactionOutputs(blockchain[0].data, [], 0);

const createNewBlock = () => {
    const coinbaseTransaction = createCoinbaseTransaction(
        getPublicKeyFromWallet(),
        getNewestBlockFromBlockChain().index + 1
    )
    const blockData = [coinbaseTransaction].concat(getMempool())
    return createNewRawBlock(blockData)

}

const createNewRawBlock = data => {
    const newBlock = findValidBlock(getNewestBlockFromBlockChain().index + 1,
        							getNewestBlockFromBlockChain().hash,
        							createCurrentTimestamp(),
        							data,
        							findNewestDifficultyOfBlockChain(getBlockchain()))
    addBlockToChain(newBlock)
	console.log("should broadcast now!")
    require("./p2p").broadcastNewBlock()
    return newBlock
}

const getBlockchain = () => blockchain

const getNewestBlockFromBlockChain = () => blockchain[blockchain.length - 1]

//todo util로 빼는 것이 좋을 듯. 아니면 녹일 방법을 찾든가.
const createCurrentTimestamp = () => Math.round(new Date().getTime() / 1000)


//todo util로 빼는 것이 좋을 듯. 아니면 녹일 방법을 찾든가.
const createHash = (index, previousHash, timestamp, data, difficulty, nounce) =>
    CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data) + difficulty + nounce)
		.toString()

const isTimestampValid = (incomingBlock, newestBlockFromBlockchain) => {
	return (newestBlockFromBlockchain.timestamp - 60 < incomingBlock.timestamp &&
		incomingBlock.timestamp - 60 < createCurrentTimestamp()
	)
}

const findNewestDifficultyOfBlockChain = (blockchain) => {
	if(getNewestBlockFromBlockChain().index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
		getNewestBlockFromBlockChain().index !== 0){
			return calculateNewDifficulty(getNewestBlockFromBlockChain(), blockchain)
	} else{
		return getNewestBlockFromBlockChain().difficulty
	}
}

const calculateNewDifficulty = (newestBlockFromBlockchain, blockchain) => {
	const lastCalculatedBlock = blockchain[blockchain.length - BLOCK_GENERATION_INTERVAL]
	const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL
	const timeTaken = newestBlockFromBlockchain.timestamp - lastCalculatedBlock.timestamp
	if(timeTaken < timeExpected/ 2){
		return lastCalculatedBlock.difficulty + 1
	}else if (timeTaken > timeExpected * 2){
		return lastCalculatedBlock.difficulty -1
	} else {
		return lastCalculatedBlock.difficulty
	}
}

const findValidBlock = (index, previousHash, timestamp, data, difficulty) => {
	let nounce = 0

	while(true){
		console.log(nounce)
		const hash = createHash(index, previousHash, timestamp, data, difficulty, nounce)
		console.log(hash)
		if(hashMatchesDifficulty(hash, difficulty)){
			return new Block(index, hash, previousHash, timestamp, data, difficulty, nounce)
		}else {
			nounce = nounce + 1
		}
	}
}

const hashMatchesDifficulty = (hash, difficulty) => {
	const hashInBinary = hexToBinary(hash)
	const requiredZeros = "0".repeat(difficulty)
	console.log(difficulty, hashInBinary.startsWith(requiredZeros))
	return hashInBinary.startsWith(requiredZeros)
}

const isBlockValid = (candidateBlock, newestBlockFromBlockchain) => {
    if(!isBlockStructureValid(candidateBlock)){
		console.log("The candidate block structure is not valid")
		return false
    }
    else if(newestBlockFromBlockchain.index + 1 !== candidateBlock.index){
        console.log('The candidate block does not have a valid index.')
		return false
    }
    else if(newestBlockFromBlockchain.hash !== candidateBlock.previousHash){
    	console.log(newestBlockFromBlockchain)
        console.log(candidateBlock)
		console.log('The previousHash of the candidate block is not the hash of the latest block.')
		return false
    }
    else if(createHash(candidateBlock.index,
						candidateBlock.previousHash,
						candidateBlock.timestamp,
						candidateBlock.data,
						candidateBlock.difficulty,
						candidateBlock.nounce) !== candidateBlock.hash){
		console.log('The hash of this block is invalid.')
		return false
    }
    else if(!isTimestampValid(candidateBlock, newestBlockFromBlockchain)){
		console.log('The timestamp of this block is dodgy')
		return false
    }
    return true
}

const isBlockStructureValid = (block) => {
    return (
        typeof block.index === "number" &&
	    typeof block.hash === "string" &&
		( typeof block.previousHash === "string" ||  (block.previousHash === null && block.index === 0 ) )&&
	    typeof block.timestamp === "number" &&
	    typeof block.data === "object" &&
		typeof block.difficulty === "number" &&
		typeof block.nounce === "number"
    )
}

const isChainValid = candidateChain => {
    const isGenesisValid = block => {
		return JSON.stringify(block) === JSON.stringify(genesisBlock)
    }
    if(!isGenesisValid(candidateChain[0])){
	console.log("The candidateChains's genesisBlock is not the same as our genesisBlock")
	return null;
    }
    
    let foreignUnspentTransactionOutputs = []

    for(let i=0; i < candidateChain.length; i++){
	const currentBlock = candidateChain[i];
	if (i!==0 && !isBlockValid(currentBlock, candidateChain[i - 1])) {
       	    return null;
        }
	foreignUnspentTransactionOutputs = getUpdatedUnspentTransactionOutputs(
        					currentBlock.data,
       						foreignUnspentTransactionOutputs,
       						currentBlock.index
     					   );

        if (foreignUnspentTransactionOutputs === null) {
            return null;
        }
    }
    return foreignUnspentTransactionOutputs
}

const sumDifficulty = anyBlockchain => {
    anyBlockchain
		.map(block => block.difficulty)
		.map(difficulty => Math.pow(2, difficulty))
		.reduce((a, b) => a + b)
}


const replaceChain = candidateChain => {
    const foreignUnspentTransactionOutputs = isChainValid(candidateChain);
    const validChain = foreignUnspentTransactionOutputs !== null;
    if(validChain && sumDifficulty((candidateChain) > sumDifficulty(getBlockchain()))){
		blockchain = candidateChain
		unspentTransactionOutputs = foreignUnspentTransactionOutputs
     	updateMempool(unspentTransactionOutputs)
     	require("./p2p").broadcastNewBlock()
	    return true
    } else{
		return false
    }
}

const addBlockToChain = candidateBlock => {
    if(isBlockValid(candidateBlock, getNewestBlockFromBlockChain())){
		const updatedUnspentTransactionOutputs = getUpdatedUnspentTransactionOutputs(candidateBlock.data,
                                                                                      unspentTransactionOutputs,
                                                                                      candidateBlock.index)
		if(updatedUnspentTransactionOutputs === null){
	    	console.log("couldn't process transactions")
	    	return false
		}else{
	    	getBlockchain().push(candidateBlock)
	    	unspentTransactionOutputs = updatedUnspentTransactionOutputs
			updateMempool(unspentTransactionOutputs)
	    	return true
		}
    }
    else{
		return false
    }
}

const getAccountBalance = () => {
	return getBalance(getPublicKeyFromWallet(), unspentTransactionOutputs)
}

const getUnspentTransactionOutputs = () => _.cloneDeep(unspentTransactionOutputs)

const sendTransaction = (address, amount) => {
	const transaction = createTransaction(amount,
											address,
											getPrivateKeyFromWallet(),
											getUnspentTransactionOutputs(),
											getMempool())
	addToMempool(transaction, getUnspentTransactionOutputs())
	require("./p2p").broadcastMempool();
	return transaction;
}

const handleIncomingTransaction = transaction => {
    addToMempool(transaction, getUnspentTransactionOutputs())
};

module.exports = {
    addBlockToChain,
    getBlockchain,
    createNewBlock,
    getNewestBlockFromBlockChain,
    replaceChain,
    isBlockStructureValid,
    getAccountBalance,
    sendTransaction,
    handleIncomingTransaction,
    getUnspentTransactionOutputs
}
