// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RittyAgent
 * @notice Agent contract for Ritty.ai Agent Platform
 * @dev Uses LLM precompile (0x0802) for AI responses
 */
contract RittyAgent {
    // ============ State ============
    string public name;
    string public category;
    string public systemPrompt;
    address public owner;
    bool public isActive;
    
    // Precompile addresses
    address constant LLM_PRECOMPILE = address(0x0802);
    address constant ASYNC_DELIVERY = address(0x0820); // AsyncDelivery precompile
    
    // ============ Events ============
    event ChatRequested(bytes32 indexed requestId, address indexed user, string message);
    event ChatResponse(bytes32 indexed requestId, string response);
    event AgentActivated(string name, string category);
    
    // ============ Structs ============
    struct ChatMessage {
        address user;
        string message;
        uint256 timestamp;
        string response;
    }
    
    // ============ Mappings ============
    mapping(bytes32 => ChatMessage) public messages;
    bytes32[] public messageIds;
    
    // ============ Constructor ============
    constructor(string memory _name, string memory _category, string memory _systemPrompt) {
        name = _name;
        category = _category;
        systemPrompt = _systemPrompt;
        owner = msg.sender;
        isActive = true;
        
        emit AgentActivated(_name, _category);
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Send a chat message to the agent
     * @param userMessage The user's message
     * @return requestId Unique identifier for this chat request
     */
    function chat(string calldata userMessage) external returns (bytes32) {
        require(isActive, "Agent is not active");
        require(bytes(userMessage).length > 0, "Empty message");
        
        bytes32 requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender, userMessage));
        
        // Store the message
        messages[requestId] = ChatMessage({
            user: msg.sender,
            message: userMessage,
            timestamp: block.timestamp,
            response: ""
        });
        messageIds.push(requestId);
        
        // Build LLM request for precompile
        // Format: [system_prompt, user_message, model, temperature, max_tokens]
        bytes memory llmInput = abi.encode(
            systemPrompt,
            userMessage,
            "llama-3.3-70b",
            uint256(7),  // temperature * 10
            uint256(2048)
        );
        
        // Call LLM precompile
        // Note: This is a simplified version. In production, use proper precompile interface
        (bool success, ) = LLM_PRECOMPILE.call(llmInput);
        require(success, "LLM precompile call failed");
        
        emit ChatRequested(requestId, msg.sender, userMessage);
        
        return requestId;
    }
    
    /**
     * @notice Callback with LLM response (called by AsyncDelivery)
     * @param requestId The request ID from the original chat call
     * @param result The LLM response bytes
     */
    function onLlmResult(bytes32 requestId, bytes calldata result) external {
        require(msg.sender == ASYNC_DELIVERY, "Only AsyncDelivery can call");
        
        string memory response = abi.decode(result, (string));
        messages[requestId].response = response;
        
        emit ChatResponse(requestId, response);
    }
    
    // ============ Admin Functions ============
    
    function deactivate() external {
        require(msg.sender == owner, "Only owner");
        isActive = false;
    }
    
    function activate() external {
        require(msg.sender == owner, "Only owner");
        isActive = true;
    }
    
    function updateSystemPrompt(string calldata _newPrompt) external {
        require(msg.sender == owner, "Only owner");
        systemPrompt = _newPrompt;
    }
    
    // ============ View Functions ============
    
    function getMessageCount() external view returns (uint256) {
        return messageIds.length;
    }
    
    function getMessage(bytes32 requestId) external view returns (ChatMessage memory) {
        return messages[requestId];
    }
}
