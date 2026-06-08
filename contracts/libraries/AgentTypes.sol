// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentTypes
/// @notice Shared types and constants for the Ritual Agent Marketplace
library AgentTypes {
    // Ritual Precompile Addresses
    address constant PRECOMPILE_PERSISTENT_AGENT = address(0x0820);
    address constant PRECOMPILE_SOVEREIGN_AGENT = address(0x080C);
    address constant PRECOMPILE_LLM = address(0x0802);
    address constant PRECOMPILE_HTTP = address(0x0801);
    address constant PRECOMPILE_IMAGE = address(0x0818);
    address constant PRECOMPILE_AUDIO = address(0x0819);

    // Agent capabilities
    string constant CAP_CHAT = "chat";
    string constant CAP_RESEARCH = "research";
    string constant CAP_TRADING = "trading";
    string constant CAP_MONITORING = "monitoring";
    string constant CAP_CODE_REVIEW = "code-review";
    string constant CAP_CONTENT = "content-generation";
    string constant CAP_ANALYSIS = "analysis";

    /// @notice Agent metadata for marketplace display
    struct AgentMeta {
        string name;
        string description;
        string[] capabilities;
        string avatarURI;
        string metadataURI;
    }

    /// @notice Rental configuration
    struct RentalConfig {
        uint256 minDurationHours;
        uint256 maxDurationHours;
        uint256 pricePerHour;
        bool acceptNativeToken;
        address erc20Token; // for ERC-20 payments
    }

    /// @notice Validate that a contract address implements the expected precompile
    function isValidPrecompile(address _addr, bool _isPersistent) internal pure returns (bool) {
        if (_isPersistent) {
            return _addr == PRECOMPILE_PERSISTENT_AGENT;
        }
        return _addr == PRECOMPILE_SOVEREIGN_AGENT;
    }
}
