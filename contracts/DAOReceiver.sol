// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "./polygonZKEVMContracts/interfaces/IBridgeMessageReceiver.sol";
import "./polygonZKEVMContracts/interfaces/IPolygonZkEVMBridge.sol";

contract DAOBridgeReceiver is IBridgeMessageReceiver {
    // Define the user and dao structs
    struct user {
        uint256 userId;
        string userName;
        string userEmail;
        string description;
        string profileImage;
        address userWalletAddress;
    }

    struct dao {
        uint256 daoId;
        uint256 creator;
        string daoName;
        string daoDescription;
        uint256 joiningThreshold;
        uint256 proposingThreshold;
        address governanceTokenAddress;
        bool isPrivate;
        string discordID;
    }

    dao[] public daos;
    mapping(uint256 => dao) public daoIdToDao;

    uint256 public totalDaos;

    function onMessageReceived(address originAddress, uint32 originNetwork, bytes memory data)
        external
        payable
        override
    {
        (dao[] memory _newDao) = abi.decode(data, (dao[]));
        for (uint256 i = 0; i < _newDao.length; i++) {
            daos.push(_newDao[i]); // Copy each element from memory to storage
        }
    }

    // Events to log when new users or DAOs are received
    event UserReceived(uint256 userId, string userName, address userWalletAddress);
    event DaoReceived(uint256 daoId, string daoName, address daoOwner);
}
