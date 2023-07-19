const ethers = require("ethers");
const prices = require("./utils/pricesUtils.js");

const sendAssetOptimistically = async function (
  to,
  amount,
  wallet,
  asset,
  vaultABI
) {
  try {
    const vault = new ethers.Contract(vaultAddress, vaultABI, wallet);
    console.log(`We are sending ${asset} to your account give us a moment`);
    const tx = await vault.send(to, amount);
    const receipt = await tx.wait();
    console.log(receipt);
  } catch (e) {
    console.log(e);
  }
};

module.exports.listener = async function (
  wallet,
  vaultAddress,
  event,
  tokenPair,
  vaultABI,
  asset
) {
  console.log("Listening for any new send order....");

  const vault = new ethers.Contract(vaultAddress, vaultABI, wallet);

  vault.on(event, async (from, to, ethAmount) => {
    let price = prices.fetchBNBETHpriceTicker(tokenPair);
    let amount = new ethers.BigNumber.from(ethAmount);
    var amountToSend = amount.mul(parseFloat(price) * 100000).div(100000);

    sendAssetOptimistically(
      to,
      amountToSend.toString(),
      wallet,
      asset,
      vaultABI
    );
  });
};
