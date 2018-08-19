const express = require("express")
const bodyParser = require("body-parser")
const morgan = require("morgan")

const Blockchain = require("./blockchain")
const P2P = require("./p2p")
const Wallet = require("./wallet")
const Mempool = require("./memPool")

const _ = require("lodash")
const cors = require("cors")

const { getBlockchain, createNewBlock, getAccountBalance, sendTransaction, getUnspentTransactionOutputs} = Blockchain
const { startP2PServer, connectToPeers} = P2P
const { initWallet,getPublicFromWallet,getBalance } = Wallet
const { getMempool } = Mempool

const PORT = process.env.HTTP_PORT || 3000;
const app = express()

//externals
app.use(bodyParser.json())
app.use(cors())
app.use(morgan("combined"))

//handle get requests from users
app.route("/blocks")
    .get((request, response) => {
        response.send(getBlockchain())
    })
    .post((request, response) => {
        const newBlock = createNewBlock()
        response.send(newBlock)
    })

app.get("/transactions/:id", (req, res) => {
   const tx = _(getBlockchain())
     .map(blocks => blocks.data)
     .flatten()
     .find({ id: req.params.id });
   if (tx === undefined) {
     res.status(400).send("Transaction not found");
   }
   res.send(tx);
 });

app.get("/address/:address", (req, res) => {
   const { params: { address } } = req;
   const balance = getBalance(address, getUTxOutList());
   res.send({ balance });
 });

app.get("/blocks/:hash", (req, res) => {
   const { params: { hash } } = req;
   const block = _.find(getBlockchain(), { hash });
   if (block === undefined) {
     res.status(400).send("Block not found");
   } else {
     res.send(block);
   }
 });

app.route("/me/address")
   .get((req, res) => {
   res.send(getPublicFromWallet());
   });

app.route("/me/balance")
    .get((req, res) => {
        const balance = getAccountBalance();
        res.send({ balance })
    })

app.route("/peers")
    .post((request, response) => {
        const { body: { peer } } = request
        connectToPeers(peer)
        response.send()
    })

app.route("/transactions")
    .get((req, res) => {
	res.send(getMempool())
    })
    .post((req, res) => {
        // try{
        const  { body : { address, amount } } = req
        if(address === undefined || amount === undefined){
            throw Error("Please Specify address and amount")
        } else{
            const response = sendTransaction(address, amount)
            res.send(response)
        }
        // } catch(error){
        //     res.status(400).send(error.message)
        // }
    })

//listener
const server = app.listen(PORT, () => 
    console.log(`Nomadcoin HTTP Server running on ${PORT}`))

initWallet()
startP2PServer(server)

