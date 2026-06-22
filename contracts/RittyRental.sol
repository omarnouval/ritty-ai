// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RittyRental
 * @notice On-chain AI agent rental platform with staking integration
 * @dev Fee split: 70% stakers / 20% creator / 10% platform
 *      Revenue auto-distributed to RittyStakingPool on each rental
 */

interface IStakingPool {
    function distributeRevenue(uint256 agentId) external payable;
}

contract RittyRental {
    // ============ Structs ============
    
    struct Agent {
        address owner;
        string name;
        string description;
        string[] capabilities;
        uint256 pricePerHour;       // in wei
        uint256 totalEarnings;
        uint256 totalRentals;
        uint256 rating;             // aggregated average * 100 (for precision)
        uint256 ratingCount;
        bool isActive;
    }

    struct Rental {
        address renter;
        uint256 agentId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPaid;
        bool isActive;
    }

    // ============ State ============
    
    mapping(uint256 => Agent) public agents;
    mapping(uint256 => Rental[]) public rentals;
    mapping(address => uint256[]) public userAgents;
    mapping(uint256 => mapping(address => bool)) public hasRated;
    uint256 public agentCount;
    
    address public owner;
    IStakingPool public stakingPool;

    // ============ Events ============
    
    event AgentListed(uint256 indexed agentId, address indexed owner, string name);
    event AgentRented(uint256 indexed agentId, address indexed renter, uint256 duration, uint256 totalPaid);
    event AgentRated(uint256 indexed agentId, address indexed rater, uint8 rating);
    event AgentDeactivated(uint256 indexed agentId);
    event AgentReactivated(uint256 indexed agentId);
    event PriceUpdated(uint256 indexed agentId, uint256 oldPrice, uint256 newPrice);
    event StakingPoolUpdated(address oldPool, address newPool);

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAgentOwner(uint256 _agentId) {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _stakingPool) {
        owner = msg.sender;
        stakingPool = IStakingPool(_stakingPool);
    }

    // ============ Core Functions ============

    /// @notice List an agent on the platform
    function listAgent(
        string calldata _name,
        string calldata _description,
        string[] calldata _capabilities,
        uint256 _pricePerHour
    ) external returns (uint256) {
        require(_pricePerHour > 0, "Price must > 0");
        require(bytes(_name).length > 0, "Name required");

        agentCount++;
        uint256 id = agentCount;

        agents[id] = Agent({
            owner: msg.sender,
            name: _name,
            description: _description,
            capabilities: _capabilities,
            pricePerHour: _pricePerHour,
            totalEarnings: 0,
            totalRentals: 0,
            rating: 0,
            ratingCount: 0,
            isActive: true
        });

        userAgents[msg.sender].push(id);
        emit AgentListed(id, msg.sender, _name);
        return id;
    }

    /// @notice Rent an agent for a duration
    /// @dev Fee split: 70% stakers / 20% creator / 10% platform
    function rentAgent(uint256 _agentId, uint256 _hours) external payable {
        Agent storage agent = agents[_agentId];
        require(agent.isActive, "Agent not active");
        require(_hours > 0, "Duration must > 0");
        require(msg.value >= agent.pricePerHour * _hours, "Insufficient payment");

        // Fee split
        uint256 stakerShare = (msg.value * 7000) / 10000;  // 70%
        uint256 creatorShare = (msg.value * 2000) / 10000;  // 20%
        uint256 platformShare = (msg.value * 1000) / 10000; // 10%

        // Update agent stats
        agent.totalEarnings += creatorShare;
        agent.totalRentals++;

        // Store rental
        rentals[_agentId].push(Rental({
            renter: msg.sender,
            agentId: _agentId,
            startTime: block.timestamp,
            endTime: block.timestamp + (_hours * 3600),
            totalPaid: msg.value,
            isActive: true
        }));

        // Distribute to stakers (auto-sends to staking pool)
        if (stakerShare > 0) {
            stakingPool.distributeRevenue{value: stakerShare}(_agentId);
        }

        // Send creator share
        if (creatorShare > 0) {
            (bool sent, ) = payable(agent.owner).call{value: creatorShare}("");
            require(sent, "Creator transfer failed");
        }

        // Platform share stays in contract (owner withdraws)

        emit AgentRented(_agentId, msg.sender, _hours, msg.value);
    }

    /// @notice Update agent price (owner only)
    function updatePrice(uint256 _agentId, uint256 _newPrice) external onlyAgentOwner(_agentId) {
        require(_newPrice > 0, "Price must > 0");
        uint256 oldPrice = agents[_agentId].pricePerHour;
        agents[_agentId].pricePerHour = _newPrice;
        emit PriceUpdated(_agentId, oldPrice, _newPrice);
    }

    /// @notice Rate an agent (1-5)
    function rateAgent(uint256 _agentId, uint8 _rating) external {
        require(_rating >= 1 && _rating <= 5, "Rating 1-5");
        require(!hasRated[_agentId][msg.sender], "Already rated");
        
        Agent storage agent = agents[_agentId];
        require(agent.totalRentals > 0, "No rentals yet");

        hasRated[_agentId][msg.sender] = true;

        // Weighted average stored as rating * 100 for precision
        uint256 totalRating = agent.rating * agent.ratingCount + (uint256(_rating) * 100);
        agent.ratingCount++;
        agent.rating = totalRating / agent.ratingCount;

        emit AgentRated(_agentId, msg.sender, _rating);
    }

    /// @notice Deactivate an agent
    function deactivateAgent(uint256 _agentId) external onlyAgentOwner(_agentId) {
        agents[_agentId].isActive = false;
        emit AgentDeactivated(_agentId);
    }

    /// @notice Reactivate an agent
    function reactivateAgent(uint256 _agentId) external onlyAgentOwner(_agentId) {
        require(agents[_agentId].totalRentals > 0, "Was never active");
        agents[_agentId].isActive = true;
        emit AgentReactivated(_agentId);
    }

    // ============ View Functions ============

    /// @notice Get all active agents (paginated)
    function getActiveAgents(uint256 _offset, uint256 _limit) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= agentCount; i++) {
            if (agents[i].isActive) count++;
        }

        uint256[] memory result = new uint256[](count < _limit ? count : _limit);
        uint256 idx = 0;
        uint256 skipped = 0;

        for (uint256 i = 1; i <= agentCount && idx < result.length; i++) {
            if (agents[i].isActive) {
                if (skipped < _offset) {
                    skipped++;
                } else {
                    result[idx++] = i;
                }
            }
        }
        return result;
    }

    /// @notice Get agent details
    function getAgent(uint256 _agentId) external view returns (
        address ownerAddr,
        string memory name,
        string memory description,
        uint256 pricePerHour,
        uint256 totalEarnings,
        uint256 totalRentals,
        uint256 rating,
        uint256 ratingCount,
        bool isActive
    ) {
        Agent storage a = agents[_agentId];
        return (
            a.owner, a.name, a.description,
            a.pricePerHour, a.totalEarnings, a.totalRentals,
            a.rating, a.ratingCount, a.isActive
        );
    }

    /// @notice Get rental history for an agent
    function getRentals(uint256 _agentId) external view returns (Rental[] memory) {
        return rentals[_agentId];
    }

    /// @notice Get agents owned by a user
    function getUserAgents(address _user) external view returns (uint256[] memory) {
        return userAgents[_user];
    }

    /// @notice Calculate rental cost
    function calculateRentalCost(uint256 _agentId, uint256 _hours) external view returns (uint256) {
        return agents[_agentId].pricePerHour * _hours;
    }

    // ============ Admin Functions ============
    
    /// @notice Update staking pool address
    function updateStakingPool(address _newPool) external onlyOwner {
        require(_newPool != address(0), "Invalid address");
        address oldPool = address(stakingPool);
        stakingPool = IStakingPool(_newPool);
        emit StakingPoolUpdated(oldPool, _newPool);
    }
    
    /// @notice Withdraw platform fees
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees");
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
    }

    /// @notice Transfer ownership
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        owner = _newOwner;
    }

    // Allow contract to receive RITUAL
    receive() external payable {}
}
