// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RittyProfile
 * @notice On-chain username and profile management for Ritty.ai
 */
contract RittyProfile {
    // ============ Structs ============
    struct Profile {
        string username;
        string bio;
        uint256 createdAt;
        bool exists;
    }

    // ============ State ============
    mapping(address => Profile) public profiles;
    mapping(string => address) public usernameToAddress;
    address public owner;

    // ============ Events ============
    event ProfileCreated(address indexed user, string username);
    event ProfileUpdated(address indexed user, string username, string bio);

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new profile with username
     * @param _username The desired username (3-20 chars, alphanumeric + underscore)
     * @param _bio Optional bio
     */
    function createProfile(string calldata _username, string calldata _bio) external {
        require(!profiles[msg.sender].exists, "Profile already exists");
        require(bytes(_username).length >= 3, "Username too short");
        require(bytes(_username).length <= 20, "Username too long");
        require(usernameToAddress[_username] == address(0), "Username taken");

        profiles[msg.sender] = Profile({
            username: _username,
            bio: _bio,
            createdAt: block.timestamp,
            exists: true
        });

        usernameToAddress[_username] = msg.sender;

        emit ProfileCreated(msg.sender, _username);
    }

    /**
     * @notice Update bio (username cannot be changed)
     * @param _bio New bio
     */
    function updateBio(string calldata _bio) external {
        require(profiles[msg.sender].exists, "Profile does not exist");
        profiles[msg.sender].bio = _bio;

        emit ProfileUpdated(msg.sender, profiles[msg.sender].username, _bio);
    }

    // ============ View Functions ============

    function hasProfile(address _user) external view returns (bool) {
        return profiles[_user].exists;
    }

    function getUsername(address _user) external view returns (string memory) {
        require(profiles[_user].exists, "Profile does not exist");
        return profiles[_user].username;
    }

    function getProfile(address _user) external view returns (Profile memory) {
        require(profiles[_user].exists, "Profile does not exist");
        return profiles[_user];
    }

    function isUsernameAvailable(string calldata _username) external view returns (bool) {
        return usernameToAddress[_username] == address(0);
    }
}
