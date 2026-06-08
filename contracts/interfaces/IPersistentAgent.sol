// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPersistentAgent
/// @notice Interface for Ritual Persistent Agent (precompile 0x0820)
interface IPersistentAgent {
    event TaskExecuted(bytes32 indexed taskId, bytes result);
    event MemoryUpdated(bytes32 indexed key, bytes value);
    event AgentPaused();
    event AgentResumed();

    /// @notice Execute a task on the persistent agent
    function executeTask(bytes calldata _task) external returns (bytes memory);

    /// @notice Update agent memory
    function updateMemory(bytes32 _key, bytes calldata _value) external;

    /// @notice Read agent memory
    function readMemory(bytes32 _key) external view returns (bytes memory);

    /// @notice Pause the agent
    function pause() external;

    /// @notice Resume the agent
    function resume() external;

    /// @notice Get agent status
    function isRunning() external view returns (bool);

    /// @notice Get agent owner
    function owner() external view returns (address);
}
