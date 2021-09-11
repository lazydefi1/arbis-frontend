import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://arbis.finance" target="_blank" rel="noopener noreferrer">
      <PageHeader
        avatar={{
          src:"/logo512.png"
        }}
        title="Arbi's"
        subTitle="We have the yields"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
