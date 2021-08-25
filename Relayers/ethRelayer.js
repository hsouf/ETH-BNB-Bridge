const ethers = require("ethers");
const config = require("./config.js");

const prices = require("./pricesUtils.js");

const sendBnbOptimistically = async function (to, amount) {
  //!! VERY DANGEROUS FUNCTION XD
  const wallet = new ethers.Wallet(config.privateKey);

  let provider = new ethers.providers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545/"
  );
  const reLayerAccount = wallet.connect(provider);

  const bnbVault = new ethers.Contract(
    "0xBE8A186D5cDb224fEC4D1e57f8f7813A93F46b73",
    config.bnbVaultABI,
    reLayerAccount
  );
  console.log("We are sending BNB to your account give us a moment");
  const tx = await ethereumVault.sendEth(to, amount);
  const receipt = await tx.wait();
  console.log(receipt);
};

const EthereumRelayer = async function () {
  console.log("Relayer is now listening for any new send order....");
  const wallet = new ethers.Wallet(config.privateKey);

  let provider = new ethers.providers.JsonRpcProvider(
    "https://ropsten.infura.io/v3/ad81d172bbf84c088e319d2658dcdf2a"
  );
  const reLayerAccount = wallet.connect(provider);

  const ethereumVault = new ethers.Contract(
    "0x882114F2228c9451e774aBf4060AEcC17EA60eeb",
    config.ethVaultABI,
    reLayerAccount
  );

  ethereumVault.on("SwapEthToBnb", async (from, to, ethAmount) => {
    let BNB_ETH_PRICE = prices.fetchBNBETHpriceTicker("ETHBNB");
    let amount = new ethers.BigNumber.from(ethAmount);

    var price_BNB_ETH = parseFloat(BNB_ETH_PRICE) * 100000; // the result returned by the BInance API is in 5 decimals
    var amountToSendInEther = amount.mul(price_BNB_ETH.toString()).div(100000);

    sendBnbOptimistically(to, amountToSendInEther.toString()); //sends order to the vault smart contract to send eth
  });
};
EthereumRelayer();
