class Block {
    constructor(index, hash, previousHash, timestamp, data){
        this.index = index
	this.hash = hash
	this.previousHash = previousHash
	this.timestamp = timestamp
	this.data = data
    }
}

const genesisBlock = new Block(
			 0,
    			 "hashed value",
    			 null,
    			 new Date().getTime()/1000,
			 "The Genesis Block")

let blockchain = [genesisBlock]

const getLastBlock = () => blockchain[blockchain.length - 1]

const getTimestamp = () => new Date().getTime() / 1000;

const createNewBlock = data => {
    const previousBlock = getLastBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimestamp();
}
