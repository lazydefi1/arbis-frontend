import React, { useState } from "react";
import {
  InputNumber,
  Upload,
  Button,
  List,
  Divider,
  Image,
  Input,
  Card,
  DatePicker,
  Space,
  Slider,
  Switch,
  Progress,
  Spin,
  Select,
  Layout,
  Modal,
  Row,
} from "antd";

const { Header, Footer, Sider, Content } = Layout;
import { Link } from "react-router-dom";
import axios from "axios";
import { SyncOutlined, UploadOutlined } from "@ant-design/icons";
import { Address, Balance, EtherInput, AddressInput, Hint, RelationToNow } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { Alert } from "antd";
import { ipfs, ipfsLinkFromHash, relationToNow, truncateString } from "../helpers";
import { useExternalContractLoader, useContractReader, useBalance } from "../hooks";

import { useParams } from "react-router-dom";
import { create as createIPFSClient } from "ipfs-http-client";
import ReactMarkdown from "react-markdown";
import NyanETHStrategyAbi from "../contracts/NyanETHStrategy.abi";
import ERC20Abi from "../contracts/ERC20.abi";
import NyanRewardsContractAbi from "../contracts/NyanRewardsContract.abi";
import { BigNumber } from "@ethersproject/bignumber";
const ipfsClient = createIPFSClient("https://ipfs.infura.io:5001");
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function FarmNYANETHUI(props) {
  //props{match.params, provider, userSigner, address, tx}
  const { provider, userSigner, address, tx, injectedProvider, farmAddress, farmName } = props;
  //const { farmAddress } = useParams();
  const farmInstance = useExternalContractLoader(injectedProvider, farmAddress, NyanETHStrategyAbi);
  const tokenAddress = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "depositToken", []);

  ///nyan specific code that wont work for other farms yet
  //const stakingContractAddress = useContractReader({ NyanStrategy: farmInstance }, "NyanStrategy", "stakingContract", []);
  //const stakingContactInstance = useExternalContractLoader(injectedProvider, stakingContractAddress, NyanRewardsContractAbi);
  //const totalAvailableToCompound = useContractReader({ NyanRewards: stakingContactInstance }, "NyanRewards", "userRewards", [farmAddress]);
  //const compoundingReward = totalAvailableToCompound ? BigNumber.from(totalAvailableToCompound).div(200): 0;
  //console.log(`totalAvailableToCompound ${totalAvailableToCompound} compounding reward ${compoundingReward}`);
  ///end of specific code that wont work for other farms yet

  const tokenInstance = useExternalContractLoader(injectedProvider, tokenAddress, ERC20Abi);

  const userUnderlyingBalance = useContractReader({ ERC20: tokenInstance }, "ERC20", "balanceOf", [address]);
  const underlyingName = useContractReader({ ERC20: tokenInstance }, "ERC20", "name", []);
  const underlyingSymbol = useContractReader({ ERC20: tokenInstance }, "ERC20", "symbol", []);
  const underlyingTotalSupply = useContractReader({ ERC20: tokenInstance }, "ERC20", "totalSupply", []);

  const approved = useContractReader({ ERC20: tokenInstance }, "ERC20", "allowance", [address, farmAddress]);

  const name = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "name", []);
  const symbol = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "symbol", []);
  const totalDeposits = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "totalDeposits", []);
  const shareBalance = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "balanceOf", [address]);
  const approvedShares = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "allowance", [address, farmAddress]);
  const underlyingTokensPerShare = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "getDepositTokensForShares", [BigInt(1000000000000000000)]);
  const usersUnderlyingTokensAvailable = useContractReader({ NYANETHStrategy: farmInstance }, "NYANETHStrategy", "getDepositTokensForShares", [shareBalance]);
  //console.log(`underlying per share ${underlyingTokensPerShare}`);
  const [loading, setLoading] = React.useState(true);
  const [visible, setVisible] = React.useState(false);
  const [writeLoading, setWriteLoading] = React.useState(false);
  const [amountToDeposit, setAmountToDeposit] = React.useState("0");
  const [amountToWithdraw, setAmountToWithdraw] = React.useState("0");
  React.useEffect(() => {
    if (injectedProvider != undefined) {
      setLoading(false);
    }
  }, [injectedProvider]);

  async function handleInvest() {
    setWriteLoading(true);

    if (!isApproved()) {
      console.log(`approving for token ${tokenAddress} spender ${farmAddress} amount ${underlyingTotalSupply}`);
      //do approve tx
      const data = tokenInstance.interface.encodeFunctionData("approve", [farmAddress, underlyingTotalSupply]);
      tx(
        userSigner.sendTransaction({
          to: tokenAddress,
          data: data,
        }),
      );
      setTimeout(() => {
        setVisible(false);
        setWriteLoading(false);
      }, 2000);
    } else {
      console.log(`doing stake with approval for ${approved} and amount ${parseEther(amountToDeposit)}`);
      //do stake tx
      const data = farmInstance.interface.encodeFunctionData("deposit", [parseEther(amountToDeposit)]);

      tx(
        userSigner.sendTransaction({
          to: farmAddress,
          data: data,
        }),
      );
      setTimeout(() => {
        setVisible(false);
        setWriteLoading(false);
      }, 2000);
    }
  }

  async function handleWithdraw() {
    setWriteLoading(true);

   
      //console.log(`doing stake with approval for ${approved} and amount ${parseEther(amountToDeposit)}`);
      //do stake tx
      const data = farmInstance.interface.encodeFunctionData("withdraw", [parseEther(amountToWithdraw)]);

      tx(
        userSigner.sendTransaction({
          to: farmAddress,
          data: data,
        }),
      );
      setTimeout(() => {
        setVisible(false);
        setWriteLoading(false);
      }, 2000);
  }

  async function handleCompound() {
    setWriteLoading(true);

   
      //console.log(`doing stake with approval for ${approved} and amount ${parseEther(amountToDeposit)}`);
      //do stake tx
      const data = farmInstance.interface.encodeFunctionData("reinvest", []);

      tx(
        userSigner.sendTransaction({
          to: farmAddress,
          data: data,
        }),
      );
      setTimeout(() => {
        setVisible(false);
        setWriteLoading(false);
      }, 2000);
  }

  const handleCancel = () => {
    console.log("Clicked cancel button");
    setVisible(false);
  };

  function isApproved() {
    if (!approved) {
      return false;
    }

    if (approved == BigInt("0")) {
      return false;
    }

    return true;
  }

  function isApprovedForShares() {
    if (!approvedShares) {
      return false;
    }

    if (approvedShares == BigInt("0")) {
      return false;
    }

    return true;
  }
  function showSymbol() {
    return " $" + (underlyingSymbol ? underlyingSymbol : "");
  }

  function showShareSymbol() {
    return " $" + (symbol ? symbol : "");
  }

  return (
    <div>
      {loading ? (
        <div>
          <Spin />
          <h4>Connect your wallet on the Arbitrum</h4>
        </div>
      ) : (
        <div>
          <Layout>
            {/* <Header> */}
            {/*   <h1 style={{ fontSize: "x-large" }}>{name ? name : <Spin />}</h1> */}
            {/*   <br /> */}
            {/* </Header> */}
            <Content style={{
    minWidth: "15em",
    width: "30em",
    maxWidth: "30em",
    margin: "auto",
    padding: "0px",
    border: "1px solid black"}}>
              <h1>{farmName}</h1>
              <a href={`https://arbiscan.io/address/${farmAddress}`} target="_blank" rel="noopener noreferrer">
                {" "}
                <Hint hint={<>{truncateString(`${farmAddress}`, 8)}</>} />
              </a>
              Stake your NYAN/ETH  $SLP Tokens for {showShareSymbol() ? showShareSymbol() : ""} in Arbi to let them compound automatically!
              <hr />
              TVL: {parseFloat(formatEther(totalDeposits ? totalDeposits : "0")).toFixed(3)} {showSymbol()}
              
              <p>1 {showShareSymbol()} : {parseFloat(formatEther(underlyingTokensPerShare ? underlyingTokensPerShare : "0")).toFixed(3)} {showSymbol()}</p>
              <br />
              <div style={{ border: "1px solid black", margin: "5px", padding: "5px" }}>
                <h3>Deposit</h3>
                <Hint
                  hint={
                    <span>
                      MAX:{" "}
                      <span
                        style={{ color: "skyblue", cursor: "pointer" }}
                        onClick={() => {
                          setAmountToDeposit(formatEther(userUnderlyingBalance ? userUnderlyingBalance : "0"));
                        }}
                      >
                        {formatEther(userUnderlyingBalance ? userUnderlyingBalance : "0")}
                      </span>
                      {showSymbol()}
                    </span>
                  }
                />
                <Input style={{ width: "90%" }} value={amountToDeposit} onChange={e => setAmountToDeposit(e.target.value)} />
                <Button style={{margin: "3px", padding: "0px 10px" }} onClick={() => handleInvest()}>{isApproved() ? "Stake" : "Approve"}</Button>
              </div>

              <div style={{ border: "1px solid black", margin: "5px", padding: "5px" }}>
                <h3>Withdraw</h3>
                <Hint
                  hint={
                    <span>
                      MAX:{" "}
                      <span
                        style={{ color: "skyblue", cursor: "pointer" }}
                        onClick={() => {
                          setAmountToWithdraw(formatEther(shareBalance ? shareBalance : "0"));
                        }}
                      >
                        {formatEther(shareBalance ? shareBalance : "0")}
                      </span>
                      {showShareSymbol()}
                    </span>
                  }
                />
                <Input style={{ width: "90%" }} value={amountToWithdraw} onChange={e => setAmountToWithdraw(e.target.value)} />
                <Button style={{margin: "3px", padding: "0px 10px" }} onClick={() => handleWithdraw()}>{isApproved() ? "Withdraw" : "Approve"}</Button>
                <Hint
                  hint={
                    <span>
                      Get Back:{" "}
                      <span
                        style={{ fontWeight: "bold" }}
                      >
                        {formatEther(usersUnderlyingTokensAvailable ? usersUnderlyingTokensAvailable : "0")}
                      </span>
                      {showSymbol()}
                    </span>
                  }
                />
              </div>

              <div style={{ border: "1px solid black", margin: "5px", padding: "5px" }}>
                <h3>Compound</h3>
                <Hint
                  hint={
                    <span>
                     Compound the pools rewards so everyone keeps earning and get a 0.5% fee for your work!👩‍🌾
                    </span>
                  }
                />



                <Button onClick={() => handleCompound()}>Compound</Button>
              
                <Hint
                  hint={
                    <span>
                     If the transaction is expensive or says it will fail, dont do it. That means the pool has already compounded recently
                    </span>
                  }
                />
              </div>
              
              {/* 
              <Button onClick={() => setVisible(true)}>Staking Interface</Button> */}
            </Content>
            </Layout>
        </div>
      )}
    </div>
  );
}
