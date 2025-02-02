// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

    

contract GovernanceToken is ERC20Permit {

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _totalSupply
    ) ERC20(_tokenName, _tokenSymbol) ERC20Permit(_tokenName) {
        _mint(msg.sender, _totalSupply * 10**decimals());
    }

    function DOMAIN_SEPARATOR() public view virtual override returns (bytes32) {
        return _domainSeparatorV4();
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return super.allowance(owner, spender);
    }

    function approve(address spender, uint256 value) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return super.balanceOf(account);
    }

    function burn(uint256 value) public virtual {
        _burn(_msgSender(), value);
    }

    function burnFrom(address account, uint256 value) public virtual {
        _spendAllowance(account, _msgSender(), value);
        _burn(account, value);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function eip712Domain() public view virtual override returns (
        bytes1 fields,
        string memory domainName,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt,
        uint256[] memory extensions
    ) {
        return super.eip712Domain();
    }

    function nonces(address owner) public view virtual override returns (uint256) {
        return super.nonces(owner);
    }

    function name() public view virtual override returns (string memory) {
        return super.name();
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        super.permit(owner, spender, value, deadline, v, r, s);
    }

    function symbol() public view virtual override returns (string memory) {
        return super.symbol();
    }

    function totalSupply() public view virtual override returns (uint256) {
        return super.totalSupply();
    }

    function transfer(address to, uint256 value) public virtual override returns (bool) {
        require(to != address(0), "ERC20: transfer to zero address");
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    // // Internal functions
    // function _mint(address account, uint256 amount) internal virtual override {
    //     super._mint(account, amount);
    // }

    // function _burn(address account, uint256 amount) internal virtual override {
    //     super._burn(account, amount);
    // }

    // function _approve(address owner, address spender, uint256 amount) internal virtual override {
    //     super._approve(owner, spender, amount);
    // }
} 