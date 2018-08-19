const CryptoJS = require("crypto-js")
const elliptic = require("elliptic")
const utils = require("./utils.js")
const _ = require("lodash")

const ec = new elliptic.ec("secp256k1")

const COINBASE_AMOUNT = 50;

class transactionOutput{
    constructor(address, amount) {
        this.address = address
        this.amount = amount
    }
}

class transactionInput {
    constructor(unspentTransactionOutputId, unspentTransactionOutputIndex, signature){
        this.unspentTransactionOutputId = unspentTransactionOutputId
        this.unspentTransactionOutputIndex = unspentTransactionOutputIndex
        this.signature = signature
    }
}

class unsignedTransactionInput {
    constructor(unspentTransactionOutputId, unspentTransactionOutputIndex){
        this.unspentTransactionOutputId = unspentTransactionOutputId
        this.unspentTransactionOutputIndex = unspentTransactionOutputIndex
    }
}

class transaction{
    constructor(transactionInputs, transactionOutputs){
        this.id = getTransactionId(transactionInputs, transactionOutputs)
        this.transactionInputs = transactionInputs
        this.transactionOutputs = transactionOutputs
    }
}

class unspentTransactionOutput{
    constructor(transactionOutputId, transactionOutputIndex, address, amount){
	    this.transactionOutputId = transactionOutputId
	    this.transactionOutputIndex = transactionOutputIndex
	    this.address =address
	    this.amount = amount
    }
}

const getTransactionId = (transactionInputs, transactionOutputs) => {
    const transactionInputContent = transactionInputs
        .map(transactionInput =>
            transactionInput.unspentTransactionOutputId + transactionInput.unspentTransactionOutputIndex)
        .reduce((a, b) => a+b, "")
    const transactionOutputContent = transactionOutputs
        .map(transactionOutput => transactionOutput.address + transactionOutput.amount)
        .reduce((a, b) => a + b, "")
    return CryptoJS.SHA256(transactionInputContent + transactionOutputContent).toString()
}

const findUnspentTransactionOutput = (transactionOutputId, transactionOutputIndex, unspentTransactionOutputs) => {
    return unspentTransactionOutputs
        .find(unspentTransactionOutput =>
            unspentTransactionOutput.transactionOutputId === transactionOutputId &&
            unspentTransactionOutput.transactionOutputIndex === transactionOutputIndex)
}

//todo 왜 트랜잭션 전체의 정보를 하나의 프라이빗 키로 사인하는가?
const signTransactionInput = (transaction, transactionInputIndex, privateKey, unspentTransactionOutputs) => {
    const transactionInput = transaction.transactionInputs[transactionInputIndex]
    const dataToSign = transaction.id

    const referencedUnspentTransactionOutput = findUnspentTransactionOutput(transactionInput.unspentTransactionOutputId,
                                                                            transactionInput.unspentTransactionOutputIndex,
                                                                            unspentTransactionOutputs)
    if(referencedUnspentTransactionOutput === null || referencedUnspentTransactionOutput === undefined){
        console.log("Couldn't find the referenced unspentTransactionOutput. Not signing.")
	    return
    }

    const referencedAddress = referencedUnspentTransactionOutput.address
    if(getPublicKey(privateKey) !== referencedAddress){
        return false
    }

    const key = ec.keyFromPrivate(privateKey, "hex")
    const signature = utils.toHexString(key.sign(dataToSign).toDER())
    return signature
}

const getPublicKey = (privateKey) => {
    return ec.keyFromPrivate(privateKey, "hex").getPublic().encode("hex")
}

const isTransactionStructureValid = (transaction) => {

    if(typeof transaction.id !== "string"){
        console.log("Transaction Id is not valid.")
        return false
    }
    else if(!(transaction.transactionInputs instanceof Array)){
        console.log("The transactionInputs are not an array")
        return false
    }
    else if(!transaction.transactionInputs
        .map(transactionInput => isTransactionInputStructureValid(transactionInput))
        .reduce((a,b) => a && b, true)){
        console.log("The structure of one of the transaction inputs is not valid")
        return false
    }
    else if(!(transaction.transactionOutputs instanceof Array)){
        console.log("The transactionOutputs are not an array")
        return false
    }
    else if(!transaction.transactionOutputs
        .map(transactionOutput => isTransactionOutputStructureValid(transactionOutput))
        .reduce((a,b) => a && b, true)){
        console.log("The structure of one of the transaction outputs is not valid")
        return false
    }
    else{
        return true
    }
}

const isTransactionInputStructureValid = (transactionInput) => {
    if(transactionInput === null){
        console.log("Transaction Input is not valid.")
        return false
    }
    else if(typeof transactionInput.signature !== "string"){
        console.log("Transaction Input signature is not valid.")
        return false
    }
    else if(typeof transactionInput.unspentTransactionOutputId !== "string"){
        console.log("Transaction output id of transaction input is not valid.")
        return false
    }
    else if(typeof transactionInput.unspentTransactionOutputIndex !== "number"){
        console.log("Transaction output index of transaction input is not valid.")
        return false
    }
    else {
        return true
    }
}

const isTransactionOutputStructureValid = (transactionOutput) => {
    if(transactionOutput === null){
        console.log("Transaction Output is not valid.")
        return false
    }
    else if(typeof transactionOutput.address !== "string"){
        console.log("Transaction Output address format is not valid.")
        return false
    }
    else if(!isAddressValid(transactionOutput.address)){
        console.log("Transaction Output Address is not valid")
        return false
    }
    else if(typeof transactionOutput.amount !== "number"){
        console.log("transaction Output amount format is not valid")
        return false
    }
    else{
        return true
    }
}

const isAddressValid = (address) =>{
    if(address.length !== 130){
        console.log("Address Length is not valid.")
        return false
    }
    else if(address.match("^[a-fA-F0-9]+$") ===null){
        console.log("Address Format HexaDecimal is not valid.")
        return false
    }
    else if(!address.startsWith("04")){
        console.log("Address content is not valid.")
        return false
    }
    else{
        return true
    }
}



////////////////



const isTransactionInputValid = (transactionInput, transaction, unspentTransactionOutputs) => {
    const wantedTransactionOutput = unspentTransactionOutputs
        .find(unspentTransactionOutput =>
            unspentTransactionOutput.transactionOutputId === transactionInput.transactionOutputId &&
            unspentTransactionOutput.transactionOutputIndex === transactionInput.transactionOutputIndex)
    if(wantedTransactionOutput === undefined){
	console.log(`Didn't find the wanted uTxOut, the tx: ${tx} is invalid`);
        return false
    }else {
        const address = wantedTransactionOutput.address
        const key = ec.keyFromPublic(address, "hex")
        return key.verify(transaction.id, transactionInput.signature)
    }
}

const validateTransaction = (transaction, unspentTransactionOutputs) => {
    if( ! isTransactionStructureValid(transaction)){
        console.log("Transaction Structure is not valid.")
    	return false
    }
    else if(! isTransactionIdValid(transaction)) {
        console.log("Transaction id is not valid.")
        return false
    }
    else if( ! isTransactionInputsValid(transaction, unspentTransactionOutputs)){
        console.log("Some transaction inputs are not valid")
        return false
    }
    else if(! isTransactionInputsAmountSameAsTransactionOutputsAmount(transaction)){
        console.log("Amount in Inputs and Amount in Outputs are not same.")
        return false
    }
    else{
        return true
    }
}

const isTransactionInputsValid = (transaction, unspentTransactionOutputs) => {
    return transaction.transactionInputs
        .map(transactionInput => isTransactionInputValid(transactionInput,
                                                         transaction,
                                                         unspentTransactionOutputs))
        .reduce((a,b) => a*b, true)
}

const isTransactionIdValid = (transaction) =>{
    return getTransactionId(transaction.transactionInputs, transaction.transactionOutputs) === transaction.id
}

const isTransactionInputsAmountSameAsTransactionOutputsAmount = (transaction) => {
    const amountInTransactionInputs = transaction.transactionInputs
        .map(transactionInput => getAmountInTransactionInput(transactionInput, unspentTransactionOutputs))
        .reduce((a,b) => a + b, 0)
    const amountInTransactionOutputs = transaction.transactionOutputs
        .map(transactionOutput => transactionOutput.amount)
        .reduce((a,b) => a + b , 0)
    return amountInTransactionInputs === amountInTransactionOutputs
}

const getAmountInTransactionInput = (transactionInput, unspentTransactionOutputs) => {
    findUnspentTransactionOutput(transactionInput.transactionhOutputId,
                                transactionInput.transactionOutputIndex,
                                unspentTransactionOutputs).amount
}

const validateCoinbaseTransaction = (transaction, blockIndex) => {
    if(getTransactionId(transaction.transactionInputs, transaction.transactionOutputs) !== transaction.id){
        console.log("Id is invalid.")
        return false
    }
    else if (transaction.transactionInputs.length !== 1){
        console.log("Input length is invalid. Must be 1 which is input from block itself.",
                    "But current transaction inputs length is ",
                    transaction.transactionInputs.length)
        return false
    }
    else if (transaction.transactionInputs[0].unspentTransactionOutputIndex !== blockIndex){
        console.log("Index is invalid. ",
                    "Must be ", blockIndex, ". ",
                    "But current transaction index is ",
                    transaction.transactionInputs[0].unspentTransactionOutputIndex)
        return false
    }
    else if (transaction.transactionOutputs.length !== 1){
        console.log("Output length is invalid. ",
                    "Must be 1. ",
                    "But current transaction Outputs length is ", transaction.transactionOutputs.length, ". ")
        return false
    }
    else if (transaction.transactionOutputs[0].amount !== COINBASE_AMOUNT){
        console.log("COIN_BASE amount is invalid ",
                    "Must be ", COINBASE_AMOUNT, ". ",
                    "But current transaction Outputs[0] is ",
                    transaction.transactionOutputs[0].amount, ". ")
	    return false
    }
    else {
    	return true
    }
}

//todo +인지 *인지 찾아볼 것.
const validateNonCoinbaseTransactions = (noncoinbaseTransactions, unspentTransactionOutputs) => {
    return noncoinbaseTransactions
        .map(transaction => validateTransaction(transaction,unspentTransactionOutputs))
        .reduce((a,b) => a * b, true)
}

const createCoinbaseTransaction = (address, blockIndex) => {

    const coinbaseTransactionInputs = [new transactionInput(transactionOutputId="",
                                                            transactionOutputIndex=blockIndex,
                                                            signature="")]
    const coinbaseTransactionOutputs = [new transactionOutput(address, COINBASE_AMOUNT)]
    const coinBaseTransaction = new transaction(coinbaseTransactionInputs, coinbaseTransactionOutputs)
    return coinBaseTransaction
}

const getUpdatedUnspentTransactionOutputs = (transactionsInCandidateBlock,
                                             unspentTransactionOutputs,
                                             blockIndex) => {
    if(!isBlockTransactionsValid(transactionsInCandidateBlock,
                                   unspentTransactionOutputs,
                                   blockIndex)){
        return null
    }
    else{
        console.log(transactionsInCandidateBlock)
        console.log(unspentTransactionOutputs)
        console.log(transactionsInCandidateBlock[0].transactionInputs)
        console.log(transactionsInCandidateBlock[0].transactionOutputs)
        return updateUnspentTransactionOutputsWithTransactionsInCandidateBlock(transactionsInCandidateBlock,
                                                                                 unspentTransactionOutputs)
    }
}

const isBlockTransactionsValid = (transactions, unspentTransactionOutputs, blockIndex) => {
    const coinbaseTransaction = getCoinbaseTransactionFromTransactions(transactions)
    const nonCoinbaseTransactions = getNonCoinbaseTransactionsFromTransactions(transactions)

    if( ! validateCoinbaseTransaction(coinbaseTransaction, blockIndex)) {
        console.log("Coinbase transaction is invalid.")
        return false
    }
    else if( ! validateNonCoinbaseTransactions(nonCoinbaseTransactions, unspentTransactionOutputs)) {
        console.log("Some Non-Coinbase transactions are invalid.")
        return false
    }
    else if(hasDuplicatesInTransactions(transactions)){
        console.log("Some transactions are invalidly duplicated.")
        return false
    }
    else{
        return true
    }
}

const getCoinbaseTransactionFromTransactions = (transactions) => transactions[0]

const getNonCoinbaseTransactionsFromTransactions = (transactions) => transactions.slice(1)

const hasDuplicatesInTransactions = (transactions) => {
    const transactionInputsFromEveryTransaction = _(transactions)
        .map(transaction => transaction.transactionInputs)
        .flatten()
        .value()

    //원소별 갯수 체크
    const group = _.countBy(transactionInputsFromEveryTransaction, transactionInput =>
        transactionInput.transactionOutputId + transactionInput.transactionOutputIndex)

    return _(group).map(value => {
        if(value > 1) {
            console.log("Found a duplicated transactionInput")
            return true
        } else{
            return false
        }
    })
        .includes(true)
}

//todo 왜 newTransactions가 들어오고, 어떤 인자가 들어오는가?
const updateUnspentTransactionOutputsWithTransactionsInCandidateBlock = (transactionsInCandidateBlock,
                                                                         unspentTransactionOutputs) => {
    const newUnspentTransactionOutputs = transactionsInCandidateBlock
        .map(newTransaction =>
            newTransaction.transactionOutputs
                .map( (newTransactionOutput, index) =>
                    new unspentTransactionOutput(
                        newTransaction.id,
                        index,
                        newTransactionOutput.address,
                        newTransactionOutput.amount
                    )
                )
        )
        .reduce((a,b) => a.concat(b), [])

    const spentTransactionOutputs = transactionsInCandidateBlock
        .map(newTransaction => newTransaction.transactionInputs)
        .reduce((a,b) => a.concat(b), [])
        .map(transactionInput =>
            new unspentTransactionOutput(
                transactionInput.unspentTransactionOutputId,
                transactionInput.unspentTransactionOutputIndex,
                "",
                0))

    const resultingUnspentTransactionOutputs = unspentTransactionOutputs
        .filter(unspentTransactionOutput => !findUnspentTransactionOutput(unspentTransactionOutput.transactionOutputId,
                                                                          unspentTransactionOutput.transactionOutputIndex,
                                                                          spentTransactionOutputs))
        .concat(newUnspentTransactionOutputs)

    return resultingUnspentTransactionOutputs
}



module.exports = {
    transactionInput,
    unsignedTransactionInput,
    transactionOutput,
    transaction,
    getTransactionId,
    getPublicKey,
    signTransactionInput,
    unspentTransactionOutput,
    createCoinbaseTransaction,
    getUpdatedUnspentTransactionOutputs,
    validateTransaction,
}
