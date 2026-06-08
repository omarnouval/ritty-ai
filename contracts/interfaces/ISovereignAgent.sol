// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISovereignAgent
/// @notice Interface for Ritual Sovereign Agent (precompile 0x080C)
interface ISovereignAgent {
    event TaskCreated(bytes32 indexed taskId, bytes input);
    event TaskCompleted(bytes32 indexed taskId, bytes output);
    event TaskFailed(bytes32 indexed taskId, string reason);

    /// @notice Create and execute a one-shot task
    function createTask(bytes calldata _input) external returns (bytes32);

    /// @notice Get task result
    function getTaskResult(bytes32 _taskId) external view returns (bytes memory);

    /// @notice Get task status
    function getTaskStatus(bytes32 _taskId) external view returns (uint8);

    /// @notice Cancel a pending task
    function cancelTask(bytes32 _taskId) external;
}
