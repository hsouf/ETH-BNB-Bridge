# Optimistic ETH<->BNB BRIDGE

<h2 name="bridge">
    Swapping BNB to ETH is now possible: building the BNB/ETH Bridge

 </h2>
 ⚠️ This codebase has not been audited, might contain bugs and should not be used in production. Developed for fun only! ⚠️
 <h3 name="l3">
   The need for interoperability
   </h3>
   
What would a universal network for sending value, independent of any company or currency, look like? Could we route value in the same way that we are routing packets of data today?



<h3 name="bridgeDesign">
   Designing the bridge
   </h3>
   
   At the core of the bridge you will find:  <br/>
   - Prices tickers that are fetched using the public Binance API <br/>
   - Listeners on vault contracts <br/>
   - The vault contracts  processing transfers and deposits<br/>

   
   
   <h3 name="vault">
   The BNB & ETH Vault smart contracts
   </h3>
     
 The vault smart contract allows anyone to add or remove liquidity as well as keep record of all LP fees aggregated  during swaps. ( Handling liquidity in each contract will be improved soon)
   

   
   Let's see how a simple swap of BNB to ETH works : 
   
   1- the user will have to send the amount of BNB  he desires to swap for ETH to the smart contract
   ```Solidity
   
    function swapBnbToEth(address receiver) public payable nonReentrant  {
        require(msg.value > 0,"not enough value");
        
        uint256 feeAmount=msg.value.mul(2).div(1000); // A fee of 0.2% applies
        uint256 amountMinusFee=msg.value.sub(feeAmount);
        aggregatedFees= aggregatedFees.add(feeAmount);
        
        emit SwapBnbToEth(msg.sender, to, amountMinusFee);//emits an event which is considered as an order to the relayer of 
    }
   ```
   2- The bnbRelayer ( built using Nodejs ) is always listening to new events on the blockchain, once the "SwapBnbToEth" event is emitted, the relayer will act immediatley as to send Ether to the given address : 
   
   ```Javascript
     binanceVault.on("SwapBnbToEth", async (from, to, bnbAmount) => {
    let BNB_ETH_PRICE = prices.fetchBNBETHpriceTicker("BNBETH");//fetchethe price from Binance API
    let amount = new ethers.BigNumber.from(bnbAmount);

    var price_BNB_ETH = parseFloat(BNB_ETH_PRICE) * 100000; // returned price with a precision of 5
    var amountToSendInEther = amount.mul(price_BNB_ETH.toString()).div(100000);

    sendEthOptimistically(to, amountToSendInEther.toString()); //sends order to the vault smart contract to send eth
  });
   ```
   3- The owner of the Ethereum vault smart contract on the other side   will now initiate a send ether order calling the following function :
   
   ```Solidity
   
   function sendEth(address to, uint256 amount) public payable onlyOwner returns(bool success) {
        
        //this function will send the calculated amount of eth the account is entitled to receive
        (success,)=to.call{value:amount}("");// it's always a good practice to use call instead of send or transfer (gas limit considerations...)
        require(success,"failed transaction");
        
        emit ethSent(to, amount);//the ethRelayer listens for "ethSent" event to notice the user of the arrival of his funds to the given address 
    }
   
   
   ```
   
   
