pragma solidity ^0.8.4;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol";

contract ethVault is ReentrancyGuard, Ownable {
    struct liquidityProvider {
        uint256 totalLiquidity;
        address provider;
    }
    using SafeMath for uint256;

    mapping(address => liquidityProvider) public liquidityProviders;
    uint256 fee; //2% fee on each transfer from ETH-BNB or BNB-ETH
    uint256 public aggregatedFees;
    event SwapEthToBnb(
        address indexed from,
        address indexed to,
        uint256 indexed amount
    );
    event ethSent(address indexed to, uint256 indexed amount);

    function getVaultBalance() public view returns (uint256 totalSupply) {
        totalSupply = address(this).balance;
    }

    function addliquidity() public payable nonReentrant {
        require(msg.value >= 1000000, "not enough liquidity");
        liquidityProviders[msg.sender].totalLiquidity += msg.value;
    }

    function removeLiquidity(uint256 amount)
        public
        payable
        nonReentrant
        returns (bool success)
    {
        require(
            liquidityProviders[msg.sender].totalLiquidity >= amount,
            "not enough liquidity"
        );

        uint256 userShareFromAggregatedFees = aggregatedFees.mul(amount).div(
            address(this).balance
        );
        uint256 amountPlusFee = amount.add(userShareFromAggregatedFees);

        (success, ) = msg.sender.call{value: amountPlusFee}("");
        liquidityProviders[msg.sender].totalLiquidity -= msg.value;
    }

    function swapEthToBnb(address to, uint256 amount)
        public
        payable
        nonReentrant
    {
        require(msg.value == amount, "amount not equal to value");

        uint256 feeAmount = msg.value.mul(2).div(1000);
        uint256 amountMinusFee = msg.value.sub(feeAmount);
        aggregatedFees = aggregatedFees.add(feeAmount);

        emit SwapEthToBnb(msg.sender, to, amountMinusFee);
    }

    function sendEth(address to, uint256 amount)
        public
        payable
        onlyOwner
        returns (bool success)
    {
        (success, ) = to.call{value: amount}("");
        require(success, "failed transaction");

        emit ethSent(to, amount);
    }
}
