// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Required interface of an ERC20 compliant token.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/**
 * @title Helios DeFAI Smart Vault
 * @notice An autonomous, cryptographically guarded DeFi-handling vault explicitly customized for 0G network AI agents.
 * It enforces precise on-chain guardrails (spending/transaction capacity, whitelisted protocol interaction)
 * and verifies cryptographic consensus assertions signed by authorized off-chain agents.
 */
contract DeFAIVault {
    // Structural Guardrails Block
    struct SecurityLimits {
        uint256 perTxMaxUSD;        // Maximum value (simulated in USD-stable equivalent / 1e18) per execution trade
        uint256 dailyCapUSD;        // Comprehensive cumulative spending threshold allowed per rolling 24-hour cycle
        uint256 coSignThresholdUSD; // Limit exceeding which owner co-signature MUST accompany the agent's signal
        uint256 cooldownPeriod;     // Minimum chronological spacing (seconds) mandatory between individual automated trades
    }

    // Agent Signature Proof Elements
    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // Global Roles & State Managers
    address public owner;
    address public activeAgentKey;
    bool public isPaused;
    
    SecurityLimits public limits;
    
    // Whitelists & Activity Monitors
    mapping(address => bool) public whitelistedProtocols;
    mapping(address => uint256) public assetPriceOracles; // Mapping token addresses to simulated feed rates
    
    uint256 public cumulativeTxSpend24h;
    uint256 public lastDailyCapResetTimestamp;
    uint256 public lastExecutionTimestamp;

    // Events logging consensus transactions
    event VaultInitialized(address indexed owner, address indexed agent, uint256 initialGasFunding);
    event RebalanceExecuted(address indexed protocol, address indexed tokenIn, uint256 amountIn, bytes32 indexed receiptHash);
    event LimitsUpdated(uint256 perTxMax, uint256 dailyCap, uint256 coSignThreshold, uint256 cooldown);
    event ProtocolWhitelisted(address indexed targetAddress, bool status);
    event AgentRotated(address indexed oldAgent, address indexed newAgent);
    event EmergencyFrozen(bool indexed status);
    event VaultSwept(address indexed owner, address indexed token, uint256 amount);
    event PriceOracleUpdated(address indexed token, uint256 priceUSD);

    // Modifier Checks
    modifier onlyOwner() {
        require(msg.sender == owner, "Vault error: restricted to Owner account");
        _;
    }

    modifier onlyWhenActive() {
        require(!isPaused, "Vault error: emergency freeze is enabled across the consensus layer");
        _;
    }

    /**
     * @notice Constructor initializes the DeFAI execution workspace
     * @param _initialAgent Address of the primary delegated offsite consensus key
     * @param _perTxMax Limit per individual trade
     * @param _dailyCap Max allowance per 24 hours
     * @param _coSignThreshold Boundary require Owner to co-sign the trade payload
     */
    constructor(
        address _initialAgent,
        uint256 _perTxMax,
        uint256 _dailyCap,
        uint256 _coSignThreshold
    ) payable {
        owner = msg.sender;
        activeAgentKey = _initialAgent;
        
        limits = SecurityLimits({
            perTxMaxUSD: _perTxMax,
            dailyCapUSD: _dailyCap,
            coSignThresholdUSD: _coSignThreshold,
            cooldownPeriod: 900 // Default to 15-minute intervals (900 seconds)
        });

        lastDailyCapResetTimestamp = block.timestamp;
        
        emit VaultInitialized(owner, _initialAgent, msg.value);
    }

    /**
     * @notice Update fundamental safety parameters (cooldown timings, max transactional capacities)
     */
    function updateSecurityLimits(
        uint256 _perTxMax,
        uint256 _dailyCap,
        uint256 _coSignThreshold,
        uint256 _cooldown
    ) external onlyOwner {
        limits.perTxMaxUSD = _perTxMax;
        limits.dailyCapUSD = _dailyCap;
        limits.coSignThresholdUSD = _coSignThreshold;
        limits.cooldownPeriod = _cooldown;

        emit LimitsUpdated(_perTxMax, _dailyCap, _coSignThreshold, _cooldown);
    }

    /**
     * @notice Restrict agent interaction exclusively to accredited external smart contracts
     */
    function setProtocolWhitelist(address _protocol, bool _status) external onlyOwner {
        whitelistedProtocols[_protocol] = _status;
        emit ProtocolWhitelisted(_protocol, _status);
    }

    /**
     * @notice Perform cryptographic rotation of delegated session key matching security profiles
     */
    function rotateAgentKey(address _newAgent) external onlyOwner {
        require(_newAgent != address(0), "Vault error: invalid agent key boundary pointer");
        address oldAgent = activeAgentKey;
        activeAgentKey = _newAgent;
        emit AgentRotated(oldAgent, _newAgent);
    }

    /**
     * @notice Standard Emergency freeze circuit breaker toggled dynamically by owners
     */
    function setEmergencyPause(bool _paused) external onlyOwner {
        isPaused = _paused;
        emit EmergencyFrozen(_paused);
    }

    /**
     * @notice Seed direct simulated token feed exchange rate for calculations
     */
    function setAssetPriceUSD(address _token, uint256 _priceUSD) external onlyOwner {
        assetPriceOracles[_token] = _priceUSD;
        emit PriceOracleUpdated(_token, _priceUSD);
    }

    /**
     * @notice Core Execution point where Agent broadcasts a cryptographically signed instruction payload.
     * Enforces the following validations:
     * 1. Check protocol whitelist status.
     * 2. Ensure agent cooldown periods are strictly respected.
     * 3. Ensure the trade size is below absolute transactional maximums.
     * 4. Perform daily limit consumption updates or resets.
     * 5. Enforce Owner co-signature checks if threshold is triggered.
     * 6. Formulate receipt validating computational consensus parameters.
     */
    function executeAutonoumousRebalance(
        address _protocol,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        bytes32 _receiptHash,
        Signature calldata _agentSig,
        Signature calldata _ownerSig
    ) external onlyWhenActive {
        // Validation Block 1: Target Contract Whitelist
        require(whitelistedProtocols[_protocol], "DeFAI security violation: unauthorized target protocol contract call");

        // Validation Block 2: Crucial chronological spacing checking (Cooldown limits)
        require(block.timestamp >= lastExecutionTimestamp + limits.cooldownPeriod, "DeFAI timing violation: transaction cooldown active");

        // Validation Block 3: Translate transaction value to reference USD and check individual limits
        uint256 rate = assetPriceOracles[_tokenIn] > 0 ? assetPriceOracles[_tokenIn] : 1; // Fallback unit rate
        uint256 calculatedValueUSD = (_amountIn * rate) / 1e18;
        
        require(calculatedValueUSD <= limits.perTxMaxUSD, "DeFAI limits violation: target amount exceeds per-transaction limits");

        // Validation Block 4: Check if 24 hours reset is required for cumulative spending tracking
        if (block.timestamp >= lastDailyCapResetTimestamp + 1 days) {
            cumulativeTxSpend24h = 0;
            lastDailyCapResetTimestamp = block.timestamp;
        }
        
        require(cumulativeTxSpend24h + calculatedValueUSD <= limits.dailyCapUSD, "DeFAI safety violation: daily cumulative budget depleted");

        // Validation Block 5: Verify the computational instruction is authorized via consensus signature
        bytes32 messageDigest = keccak256(abi.encodePacked(_protocol, _tokenIn, _tokenOut, _amountIn, _receiptHash, block.chainid));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageDigest));
        
        address agentSigner = recoverSigner(ethSignedMessageHash, _agentSig);
        require(agentSigner == activeAgentKey, "DeFAI cryptographic mismatch: invalid session key credentials provided");

        // Validation Block 6: Owner co-signing threshold audit check
        if (calculatedValueUSD >= limits.coSignThresholdUSD) {
            address ownerSigner = recoverSigner(ethSignedMessageHash, _ownerSig);
            require(ownerSigner == owner, "DeFAI security compliance lack: custom owner co-signer validation required for this size");
        }

        // Action Block: State update & simulated external ERC20 rebalancing
        cumulativeTxSpend24h += calculatedValueUSD;
        lastExecutionTimestamp = block.timestamp;

        // Perform mock interaction/allowance approvals to the recipient DeFi protocol
        IERC20(_tokenIn).transferFrom(address(this), _protocol, _amountIn);

        emit RebalanceExecuted(_protocol, _tokenIn, _amountIn, _receiptHash);
    }

    /**
     * @notice Helper tool extracting signer address from cryptographic structures
     */
    function recoverSigner(bytes32 _ethSignedMessageHash, Signature calldata _sig) public pure returns (address) {
        return ecrecover(_ethSignedMessageHash, _sig.v, _sig.r, _sig.s);
    }

    /**
     * @notice Sweep liquidity reserves securely back to owner address in case of emergencies
     */
    function sweepAssets(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "Sweeper error: non-zero token assets required");
        IERC20(_token).transfer(owner, balance);
        emit VaultSwept(owner, _token, balance);
    }

    /**
     * @notice Receive Ether fallback
     */
    receive() external payable {}
}
