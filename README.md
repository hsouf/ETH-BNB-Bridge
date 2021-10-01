# ETH_BNB_BRIDGE

<h2 name="bridge">
    Swapping BNB to ETH is now possible: building the BNB/ETH Bridge

 </h2>
 
 <h3 name="l3">
   The need for interoperability
   </h3>

What would a universal network for sending value, independent of any company or currency look like? How about routing value the same way we are routing packets of data today? 
Achieving that today now requires passing through a centralized entity who would force you to pass a KYC, enable 2FA and at the end swapping 1 simple BNB to ETH would take at least 3 minutes of your time while giving up on your identity and your very sensible data. This is why I've always dreamed of a decentralized routing mechanism where some token vaults will be distributed the same way Ethereum nodes are distributed all over the globe and who would serve you right, without corrupting your identity, and allow you to swap for the exact price of the the market as the bridge designed below is relying on real time price data API to do the math. 



<h3 name="bridgeDesign">
   Designing the bridge
   </h3>

   
   ![design_vault_v2](https://user-images.githubusercontent.com/37840702/130485116-7e3a572b-582b-4e7d-b23a-6853e1b5e09c.png)
   
   
   <h3 name="vault">
   The BNB & ETH Vault smart contracts
   </h3>
     
 The vault smart contract allows anyone to add or remove liquidity as well as keep record of all LP fees aggregated  during swaps. ( Handling liquidity in each contract will be improved soon)
   

   
   Let's see how a simple swap of BNB to ETH works : 
   
   1- the user will have to send the amount of BNB  he desires to swap for ETH to the smart contract
   ```Solidity
   
    function swapBnbToEth(address to, uint256 amount) public payable nonReentrant  {
        require(msg.value == amount,"amount not equal to value");
        
        uint256 feeAmount=msg.value.mul(2).div(1000); //using msg.value instead of amount (never trust user input)
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

    var price_BNB_ETH = parseFloat(BNB_ETH_PRICE) * 100000; // the result returned by the BInance API is in 5 decimals
    var amountToSendInEther = amount.mul(price_BNB_ETH.toString()).div(100000);

    sendEthOptimistically(to, amountToSendInEther.toString()); //sends order to the vault smart contract to send eth
  });
   ```
   3- The owner of the Ethereum vault smart contract on the other side   will now send a transaction (a send ether order) calling the following function :
   
   ```Solidity
   
   function sendEth(address to, uint256 amount) public payable onlyOwner returns(bool success) {
        
        //this function will send the calculated amount of eth the account is entitled to receive
        (success,)=to.call{value:amount}("");// it's always a good practice to use call instead of send of transfer (gas limit considerations...)
        require(success,"failed transaction");
        
        emit ethSent(to, amount);//the ethRelayer listens for "ethSent" event to notice the user of the arrival of his funds to the given address 
    }
   
   
   ```
- When sending funds I had to choose between the 3 possible ways (send, call and transfer) the only difference is in how they deal with gas, while the call is the most preferred it doesn’t set a limit for the gas used in the transaction which makes it an easy threat to reentrancy attacks, that's why I used a ```nonReentrant``` modifier
   
   
