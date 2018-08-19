const WebSockets = require("ws")
const Blockchain = require("./blockchain")
const Mempool = require("./memPool")

const {replaceChain, getNewestBlockFromBlockChain, isBlockStructureValid, addBlockToChain, getBlockchain,handleIncomingTransaction } = Blockchain
const { getMempool } = Mempool
const sockets = []

//Message Types
const GET_LATEST = "GET_LATEST"
const GET_ALL = "GET_ALL"
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE"

const REQUEST_MEMPOOL = "REQUEST_MEMPOOL"
const MEMPOOL_RESPONSE = "MEMPOOL_RESPONSE"



//Message Creators
const getLatest = () => {
    return {
        type : GET_LATEST,
	    data : null
    }
}

const getAll = () => {
    return {
        type: GET_ALL,
	    data: null
    }
}

const getAllMempool = () => {
   return {
     type: REQUEST_MEMPOOL,
     data: null
   };
 };

 const mempoolResponse = data => {
   return {
     type: MEMPOOL_RESPONSE,
     data
   };
 };

const blockchainResponse = data => {
    return { 
        type: BLOCKCHAIN_RESPONSE,
    	data: data
    }
}

const getSockets = () => sockets;

const startP2PServer = server => {
    const wsServer = new WebSockets.Server({server})
    wsServer.on("connection", ws => {
        initSocketConnection(ws)
    })
    wsServer.on("error", () => {
        console.log(error);
    });
    console.log('Nomadcoin P2P Server Running!')
}

const initSocketConnection = ws => {
    getSockets().push(ws)
    handleSocketMessages(ws)
    handleSocketError(ws)
    sendMessage(ws, getLatest())
    setTimeout(() => {
    	sendMessageToAll(getAllMempool())
    }, 1000)
    setInterval(() => {
        if (sockets.includes(ws)) {
            sendMessage(ws, "");
        }
   }, 1000)
}

const parseData = data => {
    try{
	return JSON.parse(data)
    } catch(e){
        console.log(e)
	return null
    }
}

const handleSocketMessages = ws => {
    ws.on("message", data => {
        const message = parseData(data)
	    if(message === null){
	        return
	    }
	    console.log(message)
	    switch(message.type){
            case GET_LATEST:
                sendMessage(ws, responseLatest())
                break

            case GET_ALL:
                sendMessage(ws, responseAll())
                break

            case BLOCKCHAIN_RESPONSE:
                const receivedBlocks = message.data
                if(receivedBlocks === null) {
                    break
                }
                handleBlockchainResponse(receivedBlocks)

	        case REQUEST_MEMPOOL:
	            sendMessage(ws, returnMempool());
	            break

            case MEMPOOL_RESPONSE:
                const receivedTransactions = message.data;
                if (receivedTransactions === null) {
                    return;
                    }
                receivedTransactions.forEach(transaction => {
                    try {
                            handleIncomingTransaction(transaction)
                broadcastMempool();
                    } catch (e) {
                            console.log(e);
                        }
		        });
	            break;
        }
    })
}

const handleBlockchainResponse = receivedBlocks => {
    if(receivedBlocks.length === 0){
        console.log("Received blocks have a length of 0")
        return
    }

    const latestBlockReceived =receivedBlocks[receivedBlocks.length-1]
    if(!isBlockStructureValid(latestBlockReceived)){
        console.log(latestBlockReceived)
        console.log("The block structure of the block received is not valid")
        return
    }

    const newestBlock = getNewestBlockFromBlockChain()
    if(latestBlockReceived.index > newestBlock.index){
        if(newestBlock.hash === latestBlockReceived.previousHash){
            if(addBlockToChain(latestBlockReceived)){
                broadcastNewBlock()
            }
        }
        else if(receivedBlocks.length === 1){
            sendMessageToAll(getAll())
        }
        else{
            replaceChain(receivedBlocks)
        }
    }
}

const broadcastNewBlock = () => {
    sendMessageToAll(responseLatest())
}

const returnMempool = () => mempoolResponse(getAllMempool());

const sendMessage = (ws, message) => ws.send(JSON.stringify(message))

const sendMessageToAll = message => {
    console.log("sending ready")
    sockets.forEach(socket => sendMessage(socket, message))
}

const responseLatest = () => blockchainResponse([getNewestBlockFromBlockChain()])

const responseAll = () => blockchainResponse(getBlockchain())
const broadcastMempool = () => sendMessageToAll(returnMempool())

const handleSocketError = ws => {
    const closeSocketConnection = ws =>{
        ws.close()
	getSockets().splice(getSockets().indexOf(ws), 1)
    }
    ws.on("close", () => closeSocketConnection(ws))
    ws.on("error", () => closeSocketConnection(ws))
}

const connectToPeers = newPeer => {
    const ws = new WebSockets(newPeer)
    ws.on("open",() => {
        initSocketConnection(ws)
    })
    ws.on("error", () => console.log("Connection failed"));
    ws.on("close", () => console.log("Connection failed"));
}

module.exports = {
    startP2PServer,
    connectToPeers,
    broadcastNewBlock,
    broadcastMempool
}
