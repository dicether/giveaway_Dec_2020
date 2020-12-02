const axios = require("axios");
const Web3 = require("web3");

function pad2(number) {
  number = (number < 10 ? '0' : '') + number;
  number = number.substring(0,2);
  return number;
}

async function calculateWinner(day) {
    if (window.web3 === undefined) {
        throw Error("You need an web3 enabled browser!");
    }

    if (day < 1 || day > 24) {
        throw Error("Invalid day! Needs to be between 1 and 24 inclusive!");
    }
    const curDateTime = Math.floor(Date.now() / 1000);
    const dayDate = Math.floor(Date.UTC(2020, 11, day + 1) / 1000);

    if (curDateTime < dayDate) {
        throw Error("Selected day is not yet available for calculation!");
    }

    const etherscanResponse = await axios.get(`https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${dayDate}&closest=after`);
    const blockNum = parseInt(etherscanResponse.data.result);

    const web3 = new Web3(window.web3.currentProvider);
    const block = await web3.eth.getBlock(blockNum);
    const blockHash = block.hash;

    const response = await axios.get(`https://api.dicether.com/api/stats/day/2020-12-${pad2(day)}`);
    const mostWagered = response.data.mostWagered;
    const sorted = mostWagered.sort((a, b) => {
        if (a.user.address < b.user.address) return -1;
        if (a.user.address > b.user.address) return 1;
        return 0;
    });

    const numUsers = sorted.length;

    // Winnings are low, so risk of block hash manipulation can be ignored.
    const randomNumber = new web3.utils.BN(blockHash);
    const winner = randomNumber.mod(new web3.utils.BN(numUsers)).toNumber();

    const winnerData = sorted[winner];
    const wagered = sorted[winner].value;

    let won = 0;
    if (wagered >= 10 * 1e9) won = 0.1;
    else if (wagered >= 1 * 1e9) won = 0.05;
    else if (wagered >= 0.1 * 1e9) won = 0.025;

    alert(`Winner of day ${day} is "${winnerData.user.username}" (address: ${winnerData.user.address}), wagered: ${wagered / 1e9} ETH => won: ${won} ETH`);
}

verifyButton.addEventListener('click', async function(event) {
    const day = Number.parseInt(document.getElementById("dayInput").value);
    if (Number.isNaN(day)) {
        alert("Could not parse day!");
        return;
    }

    document.getElementById("spinner").style.display = 'inline-block';
    try {
        await calculateWinner(day);
    }
    catch (ex)
    {
        alert(ex);
    }
    finally {
        document.getElementById("spinner").style.display = 'none';
    }
});
