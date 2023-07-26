import React, { useState, useEffect } from 'react';
import Header from './Header';
import certImage from './foundry-certificate-image.PNG';
import './App.css'
import { Web3Storage } from 'web3.storage';
import Web3 from 'web3'; // Import web3 library
import { MyTokenABI } from './MyTokenABI'; // ABI

const FileUploader = () => {
  const [file, setFile] = useState(null);
  const [cid, setCID] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFileToWeb3Storage = async () => {
    try {
      const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEU2ODU2MThDRDRkNzg1NTFkMTY5NzU4MzhEMTNGQ0JkMzZlNTlGYWEiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODk0NzYxNDkyMTYsIm5hbWUiOiJJRiJ9.qhmsZBWTLWcv1Gp3pVp9evzCm3wVOZ1gbV1uNP4l9uo'; // Replace with your web3.storage API key
      const client = new Web3Storage({ token: apiKey });
      const cid = await client.put([file]);
      setCID(cid);
    } catch (error) {
      console.error('Error uploading file to web3.storage:', error);
    }
  };

  // testing
  const getTransferEventLogs = async (transactionHash) => {
    try {
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);
  
      // Get the contract address from the receipt
      const contractAddress = receipt.to;
  
      // Define the filter for Transfer events
      const filter = {
        address: contractAddress,
        topics: [web3.utils.sha3('Transfer(address,address,uint256)')],
        fromBlock: receipt.blockNumber, // Starting block number of the receipt
        toBlock: receipt.blockNumber, // Ending block number of the receipt
      };
  
      // Fetch the logs using the filter
      const logs = await web3.eth.getPastLogs(filter);
  
      // Process the logs to get the tokenId
      const tokenId = logs[0]?.topics[3]; // tokenId is the 4th topic in the Transfer event
  
      return tokenId;
    } catch (error) {
      console.error('Error retrieving Transfer event logs:', error);
      return null;
    }
  };

  const retrieveTokenId = async (transactionHash) => {
    try {
      const tokenId = await getTransferEventLogs(transactionHash);
      console.log("Retrieved tokenId:", tokenId);
      setTokenId(tokenId);
    } catch (error) {
      console.error('Error retrieving tokenId:', error);
    }
  };
  //testing ends

  const handleMintToWallet = async () => {
    try {
      if (contract && cid && web3) {
        const accounts = await web3.eth.getAccounts();
        const recipient = accounts[0];
  
        console.log("Recipient:", recipient);
        console.log("CID:", cid);
  
        // Mint the token to the recipient's address
        const transaction = await contract.methods.mintToken(recipient, cid).send({ from: recipient, gas : 999999});
        retrieveTokenId(transaction.transactionHash);
        console.log("Balance Check of : ", recipient);
        console.log(contract.methods.balanceOf(recipient).call());
        console.log("Owner test on tokenId : ", contract.methods.ownerOf(tokenId).call());
        
      }
    } catch (error) {
      console.error('Error minting token to wallet:', error);
    }
  };

  const initWeb3 = async () => {
    const web3Instance = new Web3('http://localhost:7545'); // Connect to Ganache RPC endpoint
    setWeb3(web3Instance);
  };

  const initContract = async () => {
    if (web3) {
      try {
        const instance = new web3.eth.Contract(MyTokenABI, "0xEd11Eb8C13652088Cfeb8aaD79D063f21fF32827");
        setContract(instance);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    }
  };

  useEffect(() => {
    initWeb3();
  }, []);

  useEffect(() => {
    initContract();
  }, [web3]);

  return (
    <div>
      <Header />
      <div className="flex-image-container">
        <div className="certificate-image-container">
          <div className="image-description">
          <h1 className="image-caption">Acquire Your Certificate Here</h1>
          <p className="image-elaboration">Download your certificates and mint them to your crypto wallet.</p>
          </div>
          <img className="certificate-image" src={certImage} alt="Foundry" width="500"/>
        </div>
      </div>
      
      <h2 className="demo-version">IF2 7/26/2023 Demo ver. 2</h2>
      <div className="button-container">
        <input className="file-input" type="file" onChange={handleFileChange} />
        
        <button className="button"onClick={uploadFileToWeb3Storage} disabled={!file}>
          Upload
        </button>
        <button className="button"onClick={handleMintToWallet} disabled={!contract || !cid || !web3}>
          Mint to Wallet
        </button>
        
      </div>
      <div className="response-container">
          {cid && (
            <p className="response">
              File uploaded successfully! CID: {cid}
            </p>
          )}
          {tokenId && (
            <p className="response">
              Token minted successfully! Token ID: {web3.utils.hexToNumberString(tokenId)}
            </p>
          )}
        </div>
    </div>
  );
};

export default FileUploader;