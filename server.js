require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const Web3 = require("web3");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const web3 = new Web3(process.env.BSC_RPC);
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

function logToFile(message) {
    const logPath = path.join(__dirname, 'log.txt');
    const time = new Date().toLocaleString();
    fs.appendFileSync(logPath, `[${time}] ${message}\n`);
}

app.post('/claim', async (req, res) => {
    const { to, amount } = req.body;

    const PASS_TOKEN_ADDRESS = process.env.PASS_CONTRACT;
    const PASS_ABI = [{
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    }];

    const passContract = new web3.eth.Contract(PASS_ABI, PASS_TOKEN_ADDRESS);

    if (!web3.utils.isAddress(to)) {
        const msg = `Geçersiz adres: ${to}`;
        logToFile(msg);
        return res.status(400).json({ success: false, error: msg });
    }

    try {
        const tokenAmount = web3.utils.toWei(amount.toString(), 'ether');
        const tx = await passContract.methods.transfer(to, tokenAmount).send({
            from: account.address,
            gas: 100000
        });

        const successMsg = `🎁 CLAIM: ${amount} PASS gönderildi → ${to}`;
        logToFile(successMsg);
        return res.json({ success: true, txHash: tx.transactionHash });

    } catch (error) {
        const failMsg = `🚫 CLAIM Hatası: ${error.message}`;
        logToFile(failMsg);
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    logToFile(`Server başlatıldı: http://localhost:${PORT}`);
    console.log(`✅ Server çalışıyor: http://localhost:${PORT}`);
});
