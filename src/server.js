const express = require("express")
const bodyParser = require("body-parser")
const morgan = require("morgan")

const Blockchain = require("./blockchain")
const P2P = require("./p2p")

const { getBlockchain, createNewBlock} = Blockchain
const { startP2PServer, connectToPeers} = P2P

const PORT = process.env.HTTP_PORT || 3000;
const app = express()

//externals
app.use(bodyParser.json())
app.use(morgan("combined"))

//handle get requests from users
app.get("/blocks", (request, response) => {
    response.send(getBlockchain())
})

//handle post requests from users
app.post("/blocks", (request, response) => {
    const { body: { data } } = request
    const newBlock = createNewBlock(data)
    //console.log("--------- starting :", request)
    // console.log(data)
    response.send(newBlock)
})

app.post("/peers",(request, response) => {
    const { body: { peer } } = request
    connectToPeers(peer)
    response.send()
})

//listener
const server = app.listen(PORT, () => 
    console.log(`Nomadcoin HTTP Server running on ${PORT}`))

startP2PServer(server)

