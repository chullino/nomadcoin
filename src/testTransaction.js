const { getUpdatedUnspentTransactionOutputs, getTransactionId } = require('./transaction')
//
// const validityTest_GetUpdatedUnspentTransactionOutputs = () => {
//     getUpdatedUnspentTransactionOutputs
// }
//
// const validityTest_UpdateUnspentTransactionOutputsWithTransactionsInCandidateBlock = () => {
//     updateUnspentTransactionOutputsWithTransactionsInCandidateBlock
// }



const validityTest_getTransactionId = () => {
    const mockedInputs = [{signature: "", unspentTransactionOutputId: "", unspentTransactionOutputIndex: 0}]
    const mockedOutputs = [{
            address:
                "049834215802c8d0c6b8211715f852fb19c77c657325b8bec0fec962a8526d5348d3e10253961e4ddcba59538261241163472a51152df21c04aa0ca9905eb0e01a",
            amount: 50
        }]

    console.log(getTransactionId(mockedInputs, mockedOutputs))
}

validityTest_getTransactionId()

// const transaction = require("./transaction.js")
//
// const transactionOutput_1 = new transaction.transactionOutput(address="user_1", amount=1)
// const transactionOutput_2 = new transaction.transactionOutput(address="user_2", amount=2)
// const transactionOutput_3 = new transaction.transactionOutput(address="user_3", amount=3)
// const transactionOutput_4 = new transaction.transactionOutput(address="user_4", amount=4)
// const transactionOutput_5 = new transaction.transactionOutput(address="user_5", amount=5)
//
// const transactionOutputs_1_to_5 = [transactionOutput_1,
//                                    transactionOutput_2,
//                                    transactionOutput_3,
//                                    transactionOutput_4,
//                                    transactionOutput_5]
//
// const transactionInput_1 = new transaction.transactionInput(unspentTransactionOutputId="id_1",
//                                                             unspentTransactionOutputIndex=1,
//                                                             signature="signature_1")
// const transactionInput_2 = new transaction.transactionInput(unspentTransactionOutputId="id_2",
//                                                             unspentTransactionOutputIndex=2,
//                                                             signature="signature_2")
// const transactionInput_3 = new transaction.transactionInput(unspentTransactionOutputId="id_3",
//                                                             unspentTransactionOutputIndex=3,
//                                                             signature="signature_3")
// const transactionInput_4 = new transaction.transactionInput(unspentTransactionOutputId="id_4",
//                                                             unspentTransactionOutputIndex=4,
//                                                             signature="signature_4")
// const transactionInput_5 = new transaction.transactionInput(unspentTransactionOutputId="id_5",
//                                                             unspentTransactionOutputIndex=5,
//                                                             signature="signature_5")
//
// const transactionInputs_1_to_5 = [transactionInput_1,
//                                   transactionInput_2,
//                                   transactionInput_3,
//                                   transactionInput_4,
//                                   transactionInput_5]
//
// const transaction_1_to_5 = new transaction.transaction(id="",
//                                                         transactionInputs=transactionInputs_1_to_5,
//                                                         transactionOutputs=transactionOutputs_1_to_5)
//
// const transactionId = transaction.getTransactionId(transaction_1_to_5)
//
// transaction_1_to_5.id = transactionId
//
// //console.log(transaction_1_to_5)
//
// const unspentTransactionOutput_1 = new transaction.unspentTransactionOutput(transactionOutputId="id_1",
//                                                                             transactionOutputIndex=1,
//                                                                             address="user_1",
//                                                                             amount=1)
// const unspentTransactionOutput_2 = new transaction.unspentTransactionOutput(transactionOutputId="id_2",
//                                                                             transactionOutputIndex=2,
//                                                                             address="user_2",
//                                                                             amount=2)
// const unspentTransactionOutput_3 = new transaction.unspentTransactionOutput(transactionOutputId="id_3",
//                                                                             transactionOutputIndex=3,
//                                                                             address="user_3",
//                                                                             amount=3)
// const unspentTransactionOutput_4 = new transaction.unspentTransactionOutput(transactionOutputId="id_4",
//                                                                             transactionOutputIndex=4,
//                                                                             address="user_4",
//                                                                             amount=4)
// const unspentTransactionOutput_5 = new transaction.unspentTransactionOutput(transactionOutputId="id_5",
//                                                                             transactionOutputIndex=5,
//                                                                             address="user_5",
//                                                                             amount=5)
//
// unspentTransactionOutputs = [unspentTransactionOutput_1,
//                              unspentTransactionOutput_2,
//                              unspentTransactionOutput_3,
//                              unspentTransactionOutput_4,
//                              unspentTransactionOutput_5]
//
// console.log(unspentTransactionOutputs)
