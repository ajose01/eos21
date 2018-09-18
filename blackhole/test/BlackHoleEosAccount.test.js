const BigNumber = web3.BigNumber;
require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .use(require('chai-as-promised'))
    .should();

const BlackHoleEosAccount = artifacts.require('BlackHoleEosAccount');
const ERC20Token = artifacts.require('ERC20Token');

contract('BlackHoleEosAccount', accounts => {
    const name = 'ERC20 test';
    const symbol = 'SNS';
    const decimals = 8;
    const tokens = 100;
    const minimumAmount = 0;

    const criticBlock = 0;
    const eosAccount = "te.mgr5ymass";

    it ("can't teleport if blackHole is closed", async () => {
        const blackHole = await BlackHoleEosAccount.new(0x0, criticBlock, minimumAmount);
        await blackHole.close();
        await blackHole.teleportToAccount(eosAccount).should.be.rejected;
    });

    it("teleport with invalid ERC20Contract", async () => {
        const blackHole = await BlackHoleEosAccount.new(0x0, criticBlock, minimumAmount);
        await blackHole.teleportToAccount(eosAccount).should.be.rejected;
    });

    it('teleport account', async () => {
        const erc20Token = await ERC20Token.new(name, symbol, tokens, decimals);
        const blackHole = await BlackHoleEosAccount.new(erc20Token.address, criticBlock, minimumAmount);

        let watcher = blackHole.TeleportToAccount();

        await erc20Token.approve(blackHole.address, 10000000000);
        await blackHole.teleportToAccount(eosAccount);
        const blackHoleBalance = await erc20Token.balanceOf(blackHole.address);
        blackHoleBalance.should.be.bignumber.equal(10000000000);
        const balance = await erc20Token.balanceOf(accounts[0]);
        balance.should.be.bignumber.equal(0);

        const events = await watcher.get();
        events.length.should.be.equal(1);
        events[0].args.eosAccount.should.be.equal(eosAccount);
        events[0].args.tokens.should.be.bignumber.equal(10000000000);
    });

    it('teleport with less than minimum balance', async () => {
        const erc20Token = await ERC20Token.new(name, symbol, tokens, decimals);
        const blackHole = await BlackHoleEosAccount.new(erc20Token.address, criticBlock, 10000000001);

        await erc20Token.approve(blackHole.address, 10000000000);
        await blackHole.teleportToAccount(eosAccount).should.be.rejected;
    });
});
