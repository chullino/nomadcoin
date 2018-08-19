const elliptic = require("elliptic")
const ec = new elliptic.ec("secp256k1")
const fs = require("fs")
const path = require("path")
const _ = require("lodash")
const Transaction = require("./transaction")

const { transaction,
        transactionInput,
        unsignedTransactionInput,
        transactionOutput,
        getPublicKey,
        getTransactionId,
        signTransactionInput } = Transaction

const privateKeyLocation = path.join(__dirname, "privateKey")

const generatePrivateKey = () => {
    return ec.genKeyPair()
             .getPrivate()
             .toString(16)
}

const getPrivateKeyFromWallet = () => {
    return fs.readFileSync(privateKeyLocation, "utf-8")
             .toString()
}

const getPublicKeyFromWallet = () => {
    const privateKey = getPrivateKeyFromWallet()
    const key = ec.keyFromPrivate(privateKey, "hex")
    return key.getPublic().encode("hex")
}

const getBalance = (address, unspentTransactionOutputs) => {
    return _(unspentTransactionOutputs)
        .filter(unspentTransactionOutput => unspentTransactionOutput.address === address)
        .map(unspentTransactionOutput => unspentTransactionOutput.amount)
        .reduce((a,b) => a + b, 0)
}

const initWallet = () => {
    if(fs.existsSync(privateKeyLocation)){
	return
    }
    const newPrivateKey = generatePrivateKey()
    fs.writeFileSync(privateKeyLocation, newPrivateKey)
}

const findAmountInUnspentTransactionOutputs = (amountNeeded, myUnspentTransactionOutputs) => {
    let currentAmount = 0
    const includedUnspentTransactionOutputs = []
    for(const myUnspentTransactionOutput of myUnspentTransactionOutputs){
	    includedUnspentTransactionOutputs.push(myUnspentTransactionOutput)
	    currentAmount = currentAmount + myUnspentTransactionOutput.amount
	    if(currentAmount >= amountNeeded){
	        const leftOverAmount = currentAmount - amountNeeded
	        return { includedUnspentTransactionOutputs, leftOverAmount }
	    }
    }
    throw Error("Not enough funds.")
    return false
}

const createTransactionOutputs = (receiverAddress, myAddress, amount, leftOverAmount) => {
    const receiverTransactionOutput = new transactionOutput(receiverAddress, amount)
    if(leftOverAmount === 0){
	    return [receiverTransactionOutput]
    }
    else{
        const leftOverTransactionOutput = new transactionOutput(myAddress, leftOverAmount)
	    return [receiverTransactionOutput, leftOverTransactionOutput]
    }
}

const filterUnspentTransactionOutputsFromMempool = (unspentTransactionOutputs, mempool) => {
    const transactionInputs = _(mempool)
        .map(transaction => transaction.transactionInputs)
        .flatten()
        .value()

    const removables = [];

    for(const unspentTransactionOutput of unspentTransactionOutputs){
        const transactionInput = _.find(transactionInputs, transactionInput =>
            transactionInput.transactionOutputIndex === unspentTransactionOutput.transactionOutputIndex &&
            transactionInput.transactionOutputId === unspentTransactionOutput.transactionOutputId)
        if(transactionInput !== undefined){
            removables.push(unspentTransactionOutput)
        }
    }

    return _.without(unspentTransactionOutputs, ...removables)

}

const createTransaction = (amount, receiverAddress, privateKey, unspentTransactionOutputs, mempool) => {
    const myAddress = getPublicKey(privateKey) 
    const myUnspentTransactionOutputs = unspentTransactionOutputs
        .filter(unspentTransactionOutput => unspentTransactionOutput.address === myAddress)
    const filteredUnspentTransactionOutputs = filterUnspentTransactionOutputsFromMempool(myUnspentTransactionOutputs,
                                                                                         mempool)
    const { includedUnspentTransactionOutputs, leftOverAmount } = findAmountInUnspentTransactionOutputs(amount,
                                                                                                        filteredUnspentTransactionOutputs)

    const newUnsignedTransactionInputs = includedUnspentTransactionOutputs
        .map(includedUnspentTransactionOutput =>
            new unsignedTransactionInput(includedUnspentTransactionOutput.transactionOutputId,
                                         includedUnspentTransactionOutput.transactionOutputIndex)
        )

    console.log(newUnsignedTransactionInputs)
    const newTransactionOutputs = createTransactionOutputs(receiverAddress,
                                                            myAddress,
                                                            amount,
                                                            leftOverAmount)
    console.log(newTransactionOutputs)
    const newTransaction = new transaction(newUnsignedTransactionInputs, newTransactionOutputs)
    console.log(newTransaction)

    newTransaction.transactionInputs = newTransaction.transactionInputs
        .map((unsignedTransactionInput, index)=> {
            const signature = signTransactionInput(newTransaction,
                                                   index,
                                                   privateKey,
                                                   unspentTransactionOutputs)
            return new transactionInput(unsignedTransactionInput.transactionOutputId,
                                        unsignedTransactionInput.transactionOutputIndex,
                                        signature)
        })
    console.log("new Transaction!!!!")
    console.log(newTransaction)
    console.log("transaction created \n\n\n\n\n")
    return newTransaction
}

module.exports = {
    initWallet,
    getBalance,
    getPublicKeyFromWallet,
    getPrivateKeyFromWallet,
    createTransaction,
}

