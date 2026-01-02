// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MNEEVault
 * @notice Vault contract for receiving MNEE deposits and tracking balances per user
 * @dev Supports gasless deposits via EIP-2612 permit
 */
contract MNEEVault is ReentrancyGuard, Ownable {
    // MNEE token contract address
    IERC20 public immutable mneeToken;
    IERC20Permit public immutable mneePermit;
    
    // Track deposits per user (wallet address => balance)
    mapping(address => uint256) public userBalances;
    
    // Track earnings per creator
    mapping(address => uint256) public creatorEarnings;
    
    // Relayer address authorized to execute gasless transactions
    address public relayer;
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed user, uint256 amount);
    event CreatorPaid(address indexed creator, uint256 amount);
    event CreditsDeducted(address indexed user, address indexed creator, uint256 amount);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    constructor(address _mneeToken, address _relayer) Ownable(msg.sender) {
        require(_mneeToken != address(0), "Invalid token address");
        mneeToken = IERC20(_mneeToken);
        mneePermit = IERC20Permit(_mneeToken);
        relayer = _relayer;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer || msg.sender == owner(), "Not authorized");
        _;
    }

    /**
     * @notice Deposit MNEE tokens into the vault
     * @param amount Amount of MNEE to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer MNEE from user to vault
        require(
            mneeToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        userBalances[msg.sender] += amount;
        
        emit Deposited(msg.sender, amount, userBalances[msg.sender]);
    }

    /**
     * @notice Gasless deposit using EIP-2612 permit signature
     * @param owner Token owner who signed the permit
     * @param amount Amount of MNEE to deposit
     * @param deadline Permit signature deadline
     * @param v Signature v component
     * @param r Signature r component
     * @param s Signature s component
     */
    function depositWithPermit(
        address owner,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant onlyRelayer {
        require(amount > 0, "Amount must be greater than 0");
        
        // Execute permit to approve vault
        mneePermit.permit(owner, address(this), amount, deadline, v, r, s);
        
        // Transfer MNEE from owner to vault
        require(
            mneeToken.transferFrom(owner, address(this), amount),
            "Transfer failed"
        );
        
        userBalances[owner] += amount;
        
        emit Deposited(owner, amount, userBalances[owner]);
    }

    /**
     * @notice Deduct credits from user and credit to creator
     * @param user User whose credits to deduct
     * @param creator Creator to receive the payment
     * @param amount Amount to deduct/credit
     */
    function deductCredits(
        address user,
        address creator,
        uint256 amount
    ) external onlyRelayer {
        require(userBalances[user] >= amount, "Insufficient balance");
        require(creator != address(0), "Invalid creator address");
        
        userBalances[user] -= amount;
        creatorEarnings[creator] += amount;
        
        emit CreditsDeducted(user, creator, amount);
    }

    /**
     * @notice Withdraw accumulated earnings (for creators)
     */
    function withdraw() external nonReentrant {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");
        
        creatorEarnings[msg.sender] = 0;
        
        require(
            mneeToken.transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Withdraw user balance (refund)
     * @param amount Amount to withdraw
     */
    function withdrawBalance(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        
        userBalances[msg.sender] -= amount;
        
        require(
            mneeToken.transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Update the relayer address
     * @param newRelayer New relayer address
     */
    function setRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "Invalid relayer address");
        address oldRelayer = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(oldRelayer, newRelayer);
    }

    /**
     * @notice Get user's current balance
     * @param user User address
     * @return Current balance
     */
    function balanceOf(address user) external view returns (uint256) {
        return userBalances[user];
    }

    /**
     * @notice Get creator's accumulated earnings
     * @param creator Creator address
     * @return Pending earnings
     */
    function earningsOf(address creator) external view returns (uint256) {
        return creatorEarnings[creator];
    }
}
