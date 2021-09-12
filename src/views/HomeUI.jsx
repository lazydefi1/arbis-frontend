import React, { useState } from "react";
import {
  InputNumber,
  Upload,
  Button,
  List,
  Divider,
  Input,
  Card,
  DatePicker,
  Space,
  Slider,
  Switch,
  Progress,
  Spin,
  Select,
  Image
} from "antd";
import { SyncOutlined, UploadOutlined } from "@ant-design/icons";
import { Address, Balance, EtherInput, AddressInput, Hint, RaiseTile } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { Alert } from "antd";
import { ipfs, ipfsLinkFromHash, truncateString } from "../helpers";
import { useExternalContractLoader, useContractReader, useBalance } from "../hooks";
import FarmUI from "./FarmUI";
import { create as createIPFSClient } from "ipfs-http-client";
import FarmListAddress from "../contracts/FarmList.address";
import FarmListAbi from "../contracts/FarmList.abi";
import Strategy from "../contracts/Strategy.abi";
import NyanStrategyAddress from "../contracts/NyanStrategy.address";
import NyanETHStrategyAddress from "../contracts/NyanETHStrategy.address";
import FarmNYANETHUI from "./FarmNYANETHUI";
import CarbonStrategyAddress from "../contracts/CarbonStrategy.address";
const ipfsClient = createIPFSClient("https://ipfs.infura.io:5001");
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

function Required() {
  return <span style={{ color: "red" }}>*</span>;
}

export default function CreateUI({
  setPurposeEvents,
  address,
  mainnetProvider,
  userSigner,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  writeContracts,
  injectedProvider,
}) {
  const [loading, setLoading] = useState(true);
  const inUseProvider = injectedProvider;
  const instance = useExternalContractLoader(inUseProvider, FarmListAddress, FarmListAbi);
  const farm0 = useContractReader({ FarmList: instance }, "FarmList", "farms", [BigInt(0)]);
  const raiseCount = 0;
  if (farm0) {
    console.log(farm0);
  }

  function showFarms() {
    let cur = raiseCount - 1;
    if (raiseCount > 3) {
      cur = raiseCount + 3 - raiseCount;
    }
    let raises = [];
    console.log(`loading raises ${cur}`);
    while (cur >= 0) {
      raises.push(
        <span>{farm0}</span> /* {<RaiseTile
                provider={inUseProvider}
                raiseID={cur}
                factoryInstance={instance}
                key={cur}
                /> }*/,
      );

      cur = cur - 1;
    }
    return raises.map(i => i);
  }

  React.useEffect(() => {
    if (injectedProvider != undefined) {
      setLoading(false);
    }
  }, [injectedProvider]);

  return (
    <div>
      {loading ? (
        <div>
          <Spin />
          <br />
          <h4>Connect wallet to use this app</h4>
        </div>
      ) : (
        <>
        <FarmUI
        address={address}
        userSigner={userSigner}
        provider={localProvider}
        injectedProvider={injectedProvider}
        tx={tx}
        farmAddress={NyanStrategyAddress}
        farmName={"Nyan Strategy"}
        />
        <br/>
        <br/>
        <br/>
        <FarmNYANETHUI
        address={address}
        userSigner={userSigner}
        provider={localProvider}
        injectedProvider={injectedProvider}
        tx={tx}
        farmAddress={NyanETHStrategyAddress}
        farmName={"Nyan-ETH Strategy"}
        />
        <br/>
        <br/>
        <br/>
        <FarmUI
        address={address}
        userSigner={userSigner}
        provider={localProvider}
        injectedProvider={injectedProvider}
        tx={tx}
        farmAddress={CarbonStrategyAddress}
        farmName={"Carbon Strategy"}
        />
        </>
       /*  <Space direction="horizontal">
          <Card
            title={"NyanStrategy"}
            style={{ width: "300", cursor: "pointer" }}
            onClick={() => {
              window.location = window.location + "f/" + NyanStrategyAddress;
            }}
          >
            <Hint hint={<span>{`Farm #1`}</span>} />
            <br />
              <div>
                <Image width={300} height={300} src={"https://i.imgur.com/rc5GSam.png"} />
                <br />
                <p>{truncateString("First fair launch token on Arbitrum", 20)}</p>
              </div>
            <br />
            <a href={`https://arbiscan.io/address/${NyanStrategyAddress}`}>
              {" "}
              <Hint hint={<span>{truncateString(`${NyanStrategyAddress}`, 8)}</span>} />
            </a>
            <hr />
            <b>
              APY: <i>Coming Soon</i>
            </b>
          </Card>
          {/* 
            {showFarms()} *}
        </Space> */
      )}
    </div>
  );
}
