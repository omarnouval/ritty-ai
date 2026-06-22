// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RittyStakingPool
 * @notice Staking pool for Ritty.ai agent rental yield distribution
 * @dev Stake RITUAL on agents, earn yield from rental revenue
 * 
 * Fee split: 70% stakers / 20% creator / 10% platform
 */

interface IRental {
    function agents(uint256) external view returns (
        address owner,
        string memory name,
        string memory description,
        uint256 pricePerHour,
        uint256 totalEarnings,
        uint256 totalRentals,
        uint256 rating,
        uint256 ratingCount,
        bool isActive
    );
}

contract RittyStakingPool {
    // ============ State ============
    
    address public owner;           // platform owner
    address public marketplace;     // marketplace contract
    
    struct AgentPool {
        uint256 totalStaked;        // total RITUAL staked in this agent
        uint256 rewardPerToken;     // accumulated reward per token (scaled 1e18)
        uint256 lastUpdateTime;     // last time rewards were updated
        uint256 totalRewards;       // total rewards distributed
        bool exists;                // pool exists
    }
    
    struct StakerInfo {
        uint256 staked;             // amount staked
        uint256 rewardPerTokenPaid; // rewardPerToken at last claim
        uint256 rewards;            // unclaimed rewards
    }
    
    // agentId => pool
    mapping(uint256 => AgentPool) public pools;
    // agentId => staker => info
    mapping(uint256 => mapping(address => StakerInfo)) public stakers;
    // all pool agent IDs
    uint256[] public poolAgentIds;
    
    // Fee splits (basis points, 10000 = 100%)
    uint256 public stakerFeeBps = 7000;   // 70%
    uint256 public creatorFeeBps = 2000;   // 20%
    uint256 public platformFeeBps = 1000;  // 10%
    
    // ============ Events ============
    
    event PoolCreated(uint256 indexed agentId);
    event Staked(uint256 indexed agentId, address indexed staker, uint256 amount);
    event Unstaked(uint256 indexed agentId, address indexed staker, uint256 amount);
    event RewardClaimed(uint256 indexed agentId, address indexed staker, uint256 amount);
    event RevenueDistributed(uint256 indexed agentId, uint256 totalAmount, uint256 stakerShare, uint256 creatorShare, uint256 platformShare);
    event FeesUpdated(uint256 stakerFee, uint256 creatorFee, uint256 platformFee);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier poolExists(uint256 _agentId) {
        require(pools[_agentId].exists, "Pool not found");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _marketplace) {
        owner = msg.sender;
        marketplace = _marketplace;
    }
    
    // ============ Pool Management ============
    
    /**
     * @notice Create a staking pool for an agent
     * @param _agentId Agent ID from marketplace
     */
    function createPool(uint256 _agentId) external onlyOwner {
        require(!pools[_agentId].exists, "Pool already exists");
        
        // Verify agent exists in marketplace
        (, string memory name, , , , , , , bool isActive) = IRental(marketplace).agents(_agentId);
        require(bytes(name).length > 0, "Agent not found");
        
        pools[_agentId] = AgentPool({
            totalStaked: 0,
            rewardPerToken: 0,
            lastUpdateTime: block.timestamp,
            totalRewards: 0,
            exists: true
        });
        
        poolAgentIds.push(_agentId);
        emit PoolCreated(_agentId);
    }
    
    // ============ Staking ============
    
    /**
     * @notice Stake RITUAL on an agent
     * @param _agentId Agent ID to stake on
     */
    function stake(uint256 _agentId) external payable poolExists(_agentId) {
        require(msg.value > 0, "Must stake > 0");
        
        _updatePool(_agentId);
        
        StakerInfo storage info = stakers[_agentId][msg.sender];
        
        // Claim pending rewards first
        if (info.staked > 0) {
            info.rewards += _earned(_agentId, msg.sender);
        }
        
        info.staked += msg.value;
        info.rewardPerTokenPaid = pools[_agentId].rewardPerToken;
        pools[_agentId].totalStaked += msg.value;
        
        emit Staked(_agentId, msg.sender, msg.value);
    }
    
    /**
     * @notice Unstake RITUAL from an agent
     * @param _agentId Agent ID to unstake from
     * @param _amount Amount to unstake (0 = all)
     */
    function unstake(uint256 _agentId, uint256 _amount) external poolExists(_agentId) {
        StakerInfo storage info = stakers[_agentId][msg.sender];
        require(info.staked > 0, "Nothing staked");
        
        _updatePool(_agentId);
        
        // Claim pending rewards
        info.rewards += _earned(_agentId, msg.sender);
        info.rewardPerTokenPaid = pools[_agentId].rewardPerToken;
        
        uint256 withdrawAmount = _amount == 0 ? info.staked : _amount;
        require(withdrawAmount <= info.staked, "Exceeds staked");
        
        info.staked -= withdrawAmount;
        pools[_agentId].totalStaked -= withdrawAmount;
        
        // Transfer RITUAL back
        (bool success, ) = msg.sender.call{value: withdrawAmount}("");
        require(success, "Transfer failed");
        
        emit Unstaked(_agentId, msg.sender, withdrawAmount);
    }
    
    // ============ Revenue Distribution ============
    
    /**
     * @notice Distribute rental revenue to stakers
     * @param _agentId Agent ID that earned revenue
     * @dev Called by marketplace when rental payment is received
     */
    function distributeRevenue(uint256 _agentId) external payable poolExists(_agentId) {
        require(msg.value > 0, "Must send > 0");
        
        _updatePool(_agentId);
        
        uint256 stakerShare = (msg.value * stakerFeeBps) / 10000;
        uint256 creatorShare = (msg.value * creatorFeeBps) / 10000;
        uint256 platformShare = (msg.value * platformFeeBps) / 10000;
        
        // Add staker share to pool rewards
        if (pools[_agentId].totalStaked > 0) {
            pools[_agentId].rewardPerToken += (stakerShare * 1e18) / pools[_agentId].totalStaked;
        }
        pools[_agentId].totalRewards += stakerShare;
        
        // Store pending withdrawals
        pendingCreatorFees[_agentId] += creatorShare;
        pendingPlatformFees[_agentId] += platformShare;
        
        emit RevenueDistributed(_agentId, msg.value, stakerShare, creatorShare, platformShare);
    }
    
    // Pending fee tracking
    mapping(uint256 => uint256) public pendingCreatorFees;
    mapping(uint256 => uint256) public pendingPlatformFees;
    
    /**
     * @notice Creator withdraw accumulated fees
     * @param _agentId Agent ID
     */
    function withdrawCreatorFee(uint256 _agentId) external {
        (address agentOwner, , , , , , , , ) = IRental(marketplace).agents(_agentId);
        require(msg.sender == agentOwner, "Not creator");
        
        uint256 amount = pendingCreatorFees[_agentId];
        require(amount > 0, "No fees");
        
        pendingCreatorFees[_agentId] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Platform withdraw accumulated fees
     * @param _agentId Agent ID
     */
    function withdrawPlatformFee(uint256 _agentId) external onlyOwner {
        uint256 amount = pendingPlatformFees[_agentId];
        require(amount > 0, "No fees");
        
        pendingPlatformFees[_agentId] = 0;
        
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    // ============ Claims ============
    
    /**
     * @notice Claim all pending rewards for an agent
     * @param _agentId Agent ID
     */
    function claimReward(uint256 _agentId) external poolExists(_agentId) {
        StakerInfo storage info = stakers[_agentId][msg.sender];
        
        _updatePool(_agentId);
        
        uint256 reward = info.rewards + _earned(_agentId, msg.sender);
        require(reward > 0, "No rewards");
        
        info.rewards = 0;
        info.rewardPerTokenPaid = pools[_agentId].rewardPerToken;
        
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(_agentId, msg.sender, reward);
    }
    
    /**
     * @notice Claim rewards from all staked agents
     */
    function claimAllRewards() external {
        for (uint256 i = 0; i < poolAgentIds.length; i++) {
            uint256 agentId = poolAgentIds[i];
            StakerInfo storage info = stakers[agentId][msg.sender];
            
            if (info.staked > 0) {
                _updatePool(agentId);
                uint256 reward = info.rewards + _earned(agentId, msg.sender);
                
                if (reward > 0) {
                    info.rewards = 0;
                    info.rewardPerTokenPaid = pools[agentId].rewardPerToken;
                    
                    (bool success, ) = msg.sender.call{value: reward}("");
                    require(success, "Transfer failed");
                    
                    emit RewardClaimed(agentId, msg.sender, reward);
                }
            }
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get pending rewards for a staker on an agent
     */
    function pendingReward(uint256 _agentId, address _staker) external view returns (uint256) {
        StakerInfo storage info = stakers[_agentId][_staker];
        return info.rewards + _earned(_agentId, _staker);
    }
    
    /**
     * @notice Get staker's share percentage of an agent pool
     */
    function stakerShare(uint256 _agentId, address _staker) external view returns (uint256) {
        if (pools[_agentId].totalStaked == 0) return 0;
        return (stakers[_agentId][_staker].staked * 10000) / pools[_agentId].totalStaked;
    }
    
    /**
     * @notice Get APY estimate for an agent pool
     * @dev Based on historical rewards vs total staked
     */
    function getAPY(uint256 _agentId) external view returns (uint256) {
        AgentPool storage pool = pools[_agentId];
        if (pool.totalStaked == 0 || pool.lastUpdateTime == 0) return 0;
        
        uint256 duration = block.timestamp - pool.lastUpdateTime;
        if (duration == 0) return 0;
        
        // Annualize: (totalRewards / totalStaked) * (365 days / duration) * 100
        uint256 annualized = (pool.totalRewards * 365 days * 100) / (pool.totalStaked * duration);
        return annualized;
    }
    
    /**
     * @notice Get all pool agent IDs
     */
    function getAllPools() external view returns (uint256[] memory) {
        return poolAgentIds;
    }
    
    /**
     * @notice Get pool info
     */
    function getPoolInfo(uint256 _agentId) external view returns (
        uint256 totalStaked,
        uint256 totalRewards,
        uint256 stakerCount,
        uint256 apy
    ) {
        AgentPool storage pool = pools[_agentId];
        return (
            pool.totalStaked,
            pool.totalRewards,
            _stakerCount(_agentId),
            this.getAPY(_agentId)
        );
    }
    
    // ============ Internal ============
    
    function _updatePool(uint256 _agentId) internal {
        AgentPool storage pool = pools[_agentId];
        if (pool.totalStaked > 0) {
            pool.rewardPerToken = pool.rewardPerToken; // already updated via distributeRevenue
        }
        pool.lastUpdateTime = block.timestamp;
    }
    
    function _earned(uint256 _agentId, address _staker) internal view returns (uint256) {
        StakerInfo storage info = stakers[_agentId][_staker];
        return (info.staked * (pools[_agentId].rewardPerToken - info.rewardPerTokenPaid)) / 1e18;
    }
    
    function _stakerCount(uint256 _agentId) internal view returns (uint256) {
        // This is simplified - in production, track stakers in a list
        // For now, return 0 as we don't track unique stakers
        return 0;
    }
    
    // ============ Admin ============
    
    /**
     * @notice Update fee splits
     * @param _stakerFee Staker fee in bps
     * @param _creatorFee Creator fee in bps
     * @param _platformFee Platform fee in bps
     */
    function updateFees(uint256 _stakerFee, uint256 _creatorFee, uint256 _platformFee) external onlyOwner {
        require(_stakerFee + _creatorFee + _platformFee == 10000, "Must sum to 100%");
        stakerFeeBps = _stakerFee;
        creatorFeeBps = _creatorFee;
        platformFeeBps = _platformFee;
        emit FeesUpdated(_stakerFee, _creatorFee, _platformFee);
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        owner = _newOwner;
    }
    
    // Allow contract to receive RITUAL
    receive() external payable {}
}
