import React, { useEffect, useState } from "react";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json';
import LogoImage from '../src/assets/meme.jpeg'

// Constants
const TWITTER_HANDLE = 'CryptonikasDAO';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-0qrdocu226';
const TOTAL_MINT_COUNT = 25;

// I moved the contract address to the top for easy access.
const CONTRACT_ADDRESS = "0xbD970440d3FD3c4ce043a6e1645f52f3093070a7"

const App = () => {

  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessfulMint, setisSuccessfulMint] = useState(false);
  const [mintCount, setMintCount] = useState (0);
  const [etherscanLink, setEtherscanLink] = useState ("");
  const [openseaLink, setOpenseaLink] = useState('');

    
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
    } else {
        console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
}
        
        // Setup listener! This is for the case where a user comes to our site
        // and ALREADY had their wallet connected + authorized.
        setupEventListener()
    } else {
        console.log("No authorized account found")
    }
}

const connectWallet = async () => {
  try {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Get MetaMask!");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });

    console.log("Connected", accounts[0]);
    setCurrentAccount(accounts[0]);

    // Setup listener! This is for the case where a user comes to our site
    // and connected their wallet for the first time.
    setupEventListener() 
  } catch (error) {
    console.log(error)
  }
}

// Setup our listener.
const setupEventListener = async () => {
  // Most of this looks the same as our function askContractToMintNft
  try {
    const { ethereum } = window;

    if (ethereum) {
      // Same stuff again
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

      // THIS IS THE MAGIC SAUCE.
      // This will essentially "capture" our event when our contract throws it.
      // If you're familiar with webhooks, it's very similar to that!
      connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
        console.log(from, tokenId.toNumber())
        setOpenseaLink(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`);
      });

      console.log("Setup event listener!")

    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
}

const askContractToMintNft = async () => {

  setisSuccessfulMint(false);

  try {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

      console.log("Going to pop wallet now to pay gas...")
      let nftTxn = await connectedContract.makeAnEpicNFT();
      setIsLoading(true);

      console.log("Mining...please wait.")
      await nftTxn.wait();
      setIsLoading(false);
      setisSuccessfulMint(true);
      
      getMintCount();
      setEtherscanLink(`https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      console.log(nftTxn);
      console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
}

const getMintCount = async () => {
  try {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

      let nftCount = await connectedContract.getTotalNFTsMintedCount();
      console.log('NFTs Minted: ', parseInt(nftCount, 10))
      setMintCount(parseInt(nftCount, 10));
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
}

const getButton = () => {
  if (currentAccount === "") {
    return (<button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>)
  } 
  return (
    <button onClick={askContractToMintNft} className="cta-button mint-button" disabled={isLoading || (mintCount === TOTAL_MINT_COUNT)}>
      {isLoading ? 'Minting...' : 'Mint NFT'}
    </button>)
}; 

useEffect(() => {
  checkIfWalletIsConnected();
  getMintCount ();
}, [])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">CKS NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>

<div>
  <img className="logo-image" src={LogoImage}></img>
</div>
</div>

<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {mintCount < TOTAL_MINT_COUNT && (<p className="mint-count">{mintCount}/{TOTAL_MINT_COUNT} Minted</p>)}
          {mintCount === TOTAL_MINT_COUNT && (<p className="mint-count">Sold Out!</p>)}
          {getButton()}
          {currentAccount !== "" && (<p className="wallet-address-text">{currentAccount} is connected!</p>)}
          {isSuccessfulMint && (
            <div className="success-message">
              <p>Successful Mint!</p>
              <p>See your transaction on <a className="etherscan-link" href={etherscanLink} target="_blank" rel="noreferrer">Etherscan</a></p>
              <p>View your NFT on <a className="opensea-link" href={openseaLink} target="_blank" rel="noreferrer">Opensea</a></p>
            </div>
          )}
        </div>

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;