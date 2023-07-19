const config = require("./config.js");
const { listener } = require("./server/listener.js");

const startServer = async function () {
  try {
    const wallet = new ethers.Wallet(config.privateKey);
    const ethProvider = new ethers.providers.JsonRpcProvider(
      config.GoerliInfuraEndpoint
    );
    const bscProvider = new ethers.providers.JsonRpcProvider(
      config.BSCEndpoint
    );
    const bnbVaultAdmin = wallet.connect(bscProvider);
    const ethVaultAdmin = wallet.connect(ethProvider);
    //init bnb -> eth swaps events listener
    await listener(
      bnbVaultAdmin,
      config.BnbVaultAddress,
      "SwapBnbToEth",
      "BNBETH",
      config.vaultABI,
      "ETH"
    );

    //init eth -> bnb swaps events listener
    await listener(
      ethVaultAdmin,
      config.EthVaultAddress,
      "SwapEthToBnb",
      "ETHBNB",
      config.vaultABI,
      "BNB"
    );
  } catch (e) {
    console.log(e);
  }
};

startServer();
