// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPersistentAgent.sol";
import "./interfaces/ISovereignAgent.sol";
import "./libraries/AgentTypes.sol";

contract AgentMarketplace {
    // ============ Enums ============
    enum AgentType { SOVEREIGN, PERSISTENT }

    // ============ Structs ============
    struct Agent {
        address owner;
        address agentContract;
        string name;
        string description;
        string[] capabilities;
        uint256 pricePerHour;       // in wei
        uint256 totalEarnings;
        uint256 totalRentals;
        uint256 rating;             // aggregated average * 100 (for precision)
        uint256 ratingCount;
        bool isActive;
        AgentType agentType;
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
    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%
    uint256 public constant BPS_DENOMINATOR = 10000;

    mapping(uint256 => Agent) public agents;
    mapping(uint256 => Rental[]) public rentals;
    mapping(address => uint256[]) public userAgents;
    mapping(uint256 => mapping(address => bool)) public hasRated;
    uint256 public agentCount;
    address public platformTreasury;

    // ============ Events ============
    event AgentListed(uint256 indexed agentId, address indexed owner, string name, AgentType agentType);
    event AgentRented(uint256 indexed agentId, address indexed renter, uint256 duration, uint256 totalPaid);
    event AgentRated(uint256 indexed agentId, address indexed rater, uint8 rating);
    event AgentDeactivated(uint256 indexed agentId);
    event EarningsWithdrawn(address indexed owner, uint256 amount);
    event TaskExecuted(uint256 indexed agentId, bytes32 taskId, address indexed renter);

    // ============ Modifiers ============
    modifier onlyAgentOwner(uint256 _agentId) {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    modifier onlyActiveRental(uint256 _agentId) {
        Rental[] storage rentalList = rentals[_agentId];
        require(rentalList.length > 0, "No rentals");
        Rental storage latest = rentalList[rentalList.length - 1];
        require(latest.renter == msg.sender, "Not renter");
        require(latest.isActive, "Rental expired");
        require(block.timestamp <= latest.endTime, "Rental expired");
        _;
    }

    // ============ Constructor ============
    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        platformTreasury = _treasury;
    }

    // ============ Core Functions ============

    /// @notice List an agent on the marketplace
    function listAgent(
        address _agentContract,
        string calldata _name,
        string calldata _description,
        string[] calldata _capabilities,
        uint256 _pricePerHour,
        AgentType _agentType
    ) external returns (uint256) {
        require(_agentContract != address(0), "Invalid agent contract");
        require(_pricePerHour > 0, "Price must > 0");
        require(bytes(_name).length > 0, "Name required");

        // Validate precompile interface
        if (_agentType == AgentType.PERSISTENT) {
            // Verify the contract implements IPersistentAgent
            IPersistentAgent agent = IPersistentAgent(_agentContract);
            // Try calling a view function to verify interface
            try agent.isRunning() returns (bool) {
                // Interface verified
            } catch {
                revert("Invalid persistent agent");
            }
        } else {
            // For sovereign agents, we accept any address
            // (one-shot tasks don't require persistent connection)
        }

        agentCount++;
        uint256 id = agentCount;

        agents[id] = Agent({
            owner: msg.sender,
            agentContract: _agentContract,
            name: _name,
            description: _description,
            capabilities: _capabilities,
            pricePerHour: _pricePerHour,
            totalEarnings: 0,
            totalRentals: 0,
            rating: 0,
            ratingCount: 0,
            isActive: true,
            agentType: _agentType
        });

        userAgents[msg.sender].push(id);
        emit AgentListed(id, msg.sender, _name, _agentType);
        return id;
    }

    /// @notice Rent an agent for a duration
    function rentAgent(uint256 _agentId, uint256 _hours) external payable {
        Agent storage agent = agents[_agentId];
        require(agent.isActive, "Agent not active");
        require(_hours > 0, "Duration must > 0");
        require(msg.value >= agent.pricePerHour * _hours, "Insufficient payment");

        uint256 platformFee = (msg.value * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 ownerPayment = msg.value - platformFee;

        agent.totalEarnings += ownerPayment;
        agent.totalRentals++;

        rentals[_agentId].push(Rental({
            renter: msg.sender,
            agentId: _agentId,
            startTime: block.timestamp,
            endTime: block.timestamp + (_hours * 3600),
            totalPaid: msg.value,
            isActive: true
        }));

        // Send platform fee to treasury
        if (platformFee > 0) {
            (bool sent, ) = payable(platformTreasury).call{value: platformFee}("");
            require(sent, "Fee transfer failed");
        }

        emit AgentRented(_agentId, msg.sender, _hours, msg.value);
    }

    /// @notice Execute a task on a rented persistent agent
    function executeTask(uint256 _agentId, bytes calldata _task) external onlyActiveRental(_agentId) returns (bytes memory) {
        Agent storage agent = agents[_agentId];
        require(agent.agentType == AgentType.PERSISTENT, "Not persistent agent");

        IPersistentAgent persistentAgent = IPersistentAgent(agent.agentContract);
        bytes memory result = persistentAgent.executeTask(_task);

        emit TaskExecuted(_agentId, bytes32(0), msg.sender);
        return result;
    }

    /// @notice Create a one-shot task on a rented sovereign agent
    function createSovereignTask(uint256 _agentId, bytes calldata _input) external onlyActiveRental(_agentId) returns (bytes32) {
        Agent storage agent = agents[_agentId];
        require(agent.agentType == AgentType.SOVEREIGN, "Not sovereign agent");

        ISovereignAgent sovereignAgent = ISovereignAgent(agent.agentContract);
        bytes32 taskId = sovereignAgent.createTask(_input);

        emit TaskExecuted(_agentId, taskId, msg.sender);
        return taskId;
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

    /// @notice Withdraw all earnings from listed agents
    function withdrawEarnings() external {
        uint256 balance = 0;
        uint256[] storage agentIds = userAgents[msg.sender];

        for (uint256 i = 0; i < agentIds.length; i++) {
            uint256 agentId = agentIds[i];
            balance += agents[agentId].totalEarnings;
            agents[agentId].totalEarnings = 0;
        }

        require(balance > 0, "No earnings");
        (bool sent, ) = payable(msg.sender).call{value: balance}("");
        require(sent, "Transfer failed");

        emit EarningsWithdrawn(msg.sender, balance);
    }

    /// @notice Deactivate an agent listing
    function deactivateAgent(uint256 _agentId) external onlyAgentOwner(_agentId) {
        agents[_agentId].isActive = false;
        emit AgentDeactivated(_agentId);
    }

    /// @notice Reactivate an agent listing
    function reactivateAgent(uint256 _agentId) external onlyAgentOwner(_agentId) {
        require(agents[_agentId].totalRentals > 0, "Was never active");
        agents[_agentId].isActive = true;
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
        address owner,
        address agentContract,
        string memory name,
        string memory description,
        uint256 pricePerHour,
        uint256 totalEarnings,
        uint256 totalRentals,
        uint256 rating,
        uint256 ratingCount,
        bool isActive,
        AgentType agentType
    ) {
        Agent storage a = agents[_agentId];
        return (
            a.owner, a.agentContract, a.name, a.description,
            a.pricePerHour, a.totalEarnings, a.totalRentals,
            a.rating, a.ratingCount, a.isActive, a.agentType
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

    /// @notice Check if agent is a precompile-based agent
    function isPrecompileAgent(uint256 _agentId) external view returns (bool) {
        Agent storage a = agents[_agentId];
        if (a.agentType == AgentType.PERSISTENT) {
            return AgentTypes.isValidPrecompile(a.agentContract, true);
        }
        return AgentTypes.isValidPrecompile(a.agentContract, false);
    }
}
