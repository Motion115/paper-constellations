import React from "react";
import { ConfigProvider, Layout, Typography } from "antd";
import Dashboard from "./Dashboard";
import THEME from "./style/theme";
import { CSSBasicPageConfig, CSSPageConfig } from "./style/styleConfigs";
import { TwitterOutlined } from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Text, Title, Paragraph, Link } = Typography;

const App: React.FC = () => {
  return (
    <>
      <ConfigProvider theme={THEME}>
        <div>
          <Header style={{ padding: "0% 0% 0% 2%" }}>
            <Title level={3}>Paper Constellations</Title>
          </Header>
          <Content style={CSSPageConfig}>
            <Dashboard />
          </Content>
          <Footer style={CSSPageConfig}>
          </Footer>
        </div>
      </ConfigProvider>
    </>
  );
};

export default App;
