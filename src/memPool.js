const _ = require('lodash')
const Transaction = require('./transaction')
const { validateTransaction } = Transaction

let mempool = []

const getTransactionInputsInMempool = mempool => {
    return _(mempool)
        .map(transaction => transaction.transactionInputs)
        .flatten()
        .value()
}

const isTransactionValidForMempool = (transaction, mempool) => {
    console.log(mempool)
    console.log(transaction)
    const transactionInputsInMempool = getTransactionInputsInMempool(mempool)
    console.log("Transaction Inputs in mempool")
    console.log(transactionInputsInMempool)
    console.log(transaction.transactionInputs)

    for (const transactionInput in transaction.transactionInputs) {
        if(isTransactionInputAlreadyInMempool(transactionInputsInMempool, transactionInput)){
            return false
        }
    }
    return true
}

const isTransactionInputAlreadyInMempool = (transactionInputs, transactionInput) => {
    return _.find(transactionInputs, transactionInputInMempool => {
        return(
            transactionInput.transactionOutputIndex === transactionInputInMempool.transactionOutputIndex &&
            transactionInput.transactionOutputId === transactionInputInMempool.transactionOutputId
        )
    })
}

const hasTransactionInput = (transactionInput, unspentTransactionOutputs) => {
    return unspentTransactionOutputs.find(
        unspentTransactionOutput =>
            unspentTransactionOutput.transactionOutputId === transactionInput.transactionOutputId &&
            unspentTransactionOutput.transactionOutputIndex === transactionInput.transactionOutputIndex
    ) !== undefined
}

const updateMempool = (unspentTransactionOutputs) => {
    const invalidTransactions = []
    for(const transaction of mempool){
        for(const transactionInput of transaction.transactionInputs){
            if(! hasTransactionInput(transactionInput, unspentTransactionOutputs)){
                invalidTransactions.push(transaction)
                break;
            }
        }
    }
    if(invalidTransactions.length > 0){
        mempool = _.without(mempool, ...invalidTransactions)
    }
}

const addToMempool = (transaction, unspentTransactionOutputs) => {
    if(validateTransaction(transaction, unspentTransactionOutputs)){
        throw Error("Transaction Is Invalid. Not adding to memPool.")
    }
    else if(! isTransactionValidForMempool(transaction, mempool)){
        throw Error("This transaction is invalid for mempool. Not adding to memPool.")
    }
    else{
        mempool.push(transaction)
    }
}

const getMempool = () => _.cloneDeep(mempool)

module.exports = {
    addToMempool,
    getMempool,
    updateMempool
}