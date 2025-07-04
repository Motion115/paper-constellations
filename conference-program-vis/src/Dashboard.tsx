import React, { useEffect, useRef, useState } from "react";
import CircularSOM from "./components/CircularSOM";
import {
  Alert,
  Card,
  Flex,
  Skeleton,
  Space,
  Spin,
  Tabs,
  TabsProps,
  Typography,
} from "antd";
import { decode } from "@msgpack/msgpack";
import { ContentSpec } from "./types";
import {
  useAuthorLookup,
  useContentLookup,
  useEmbedding,
  useRelationshipLookup,
} from "./store";
import SearchBar from "./components/SearchBar";
import DimReduction from "./components/DimReduction";
import PaperContent from "./components/PaperContent";
import { CSSPageConfig } from "./style/styleConfigs";
import { useWindowSize } from "usehooks-ts";

const { Paragraph, Text, Link } = Typography;

async function loadMsgPackData<T = ContentSpec[]>(
  fileName: string,
  setGlobalState: (data: T) => void
) {
  try {
    const response = await fetch(fileName);
    if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);

    const arrayBuffer = await response.arrayBuffer();
    const decodedData = decode(arrayBuffer) as T;
    // console.log(fileName, decodedData);
    setGlobalState(decodedData);
    return true;
  } catch (err) {
    console.error("MessagePack loading error:", err);
    return false;
  }
}

const Dashboard: React.FC = () => {
  const { contentLookup, setContentLookup } = useContentLookup();
  const { authorLookup, setAuthorLookup } = useAuthorLookup();
  const {
    relationshipLookup,
    setRelationshipLookup,
    appendRelationshipLookup,
  } = useRelationshipLookup();
  const { embedding, setEmbedding } = useEmbedding();

  const [searchId, setSearchId] = useState<string>("188659");
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedScatterId, setSelectedScatterId] = useState<string>("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const [displayPortDim, setDisplayPortDim] = useState<{
    width: number;
    height: number;
  }>({
    width: 20,
    height: 20,
  });

  const fullWindowRef = useRef<HTMLDivElement>(null);
  const fullWindowDim = useWindowSize();

  useState<{
    width: number;
    height: number;
  } | null>(null);

  const somRef = useRef<HTMLDivElement>(null);
  // get the height of the somRef
  useEffect(() => {
    if (somRef.current) {
      setDisplayPortDim({
        width: somRef.current.getBoundingClientRect().width,
        height: somRef.current.getBoundingClientRect().height,
      });
    }
  }, [somRef.current]);

  useEffect(() => {
    console.log("displayPortDim updated:", displayPortDim);
  }, [displayPortDim]);

  useEffect(() => {
    setSelectedId("");
  }, [searchId]);

  useEffect(() => {
    loadMsgPackData("/chi2025papers/content_lookup.msgpack", setContentLookup);
    loadMsgPackData("/chi2025papers/people_lookup.msgpack", setAuthorLookup);
    loadMsgPackData("/chi2025papers/embedMap.msgpack", setEmbedding);
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const WRAP_THRESHOLD = 1000;

  useEffect(() => {
    if (searchId && contentLookup) {
      setIsLoading(true);

      const loadId = contentLookup[searchId].shardId;

      if (!searchHistory.includes(searchId)) {
        setSearchHistory([...searchHistory, searchId]);
        loadMsgPackData(
          `/chi2025papers/shards/content_${loadId}.msgpack`,
          appendRelationshipLookup
        ).then((response) => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [searchId, contentLookup]);

  const [view, setView] = useState<string>("circular");

  const onChangeView = (key: string) => {
    setView(key);
  };

  const TabItems: TabsProps["items"] = [
    {
      key: "circular",
      label: "Query Retrieval View",
    },
    {
      key: "scatter",
      label: "Scatter Plot Dimensionality Reduction View",
    },
  ];

  const CircularView = (
    <>
      {relationshipLookup &&
        contentLookup &&
        authorLookup &&
        fullWindowDim !== null && (
          <Flex gap="large" wrap={fullWindowDim.width < WRAP_THRESHOLD}>
            <div
              style={{
                width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "25%",
                maxHeight: "60vh",
                justifyContent: "center",
                alignItems: "center",
              }}
              ref={somRef}
            >
              {isLoading ? (
                <div>
                  <Spin
                    tip={
                      <>
                        <Paragraph>Loading SOM projection...</Paragraph>
                        <Paragraph>
                          SOM projection only exsist on Papers, Journals, LBW,
                          Student Research Competition, alt.CHI and Case Studies
                        </Paragraph>
                      </>
                    }
                  >
                    <Skeleton.Node
                      active
                      style={{
                        width: displayPortDim.width,
                        height: displayPortDim.height,
                      }}
                    />
                  </Spin>
                </div>
              ) : (
                relationshipLookup &&
                contentLookup &&
                authorLookup && (
                  <CircularSOM
                    data={
                      relationshipLookup.find(
                        (item) => item.id.toString() === searchId
                      ) || relationshipLookup[0]
                    }
                    contentLookup={contentLookup}
                    setClicked={setSelectedId}
                    searchId={searchId}
                    trigger={displayPortDim.width}
                  />
                )
              )}
            </div>
            <div
              style={{
                width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "40%",
                overflowY: "scroll",
                height: "60vh",
              }}
            >
              <Card title="Star Paper" style={{ backgroundColor: "#f0f0f0" }}>
                <PaperContent
                  paperId={searchId}
                  contentLookup={contentLookup}
                  authorLookup={authorLookup}
                  trigger={displayPortDim.width}
                />
              </Card>
            </div>

            <div
              style={{
                width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "40%",
                overflowY: "scroll",
                height: "60vh",
              }}
            >
              <Card title="Companion Star Paper">
                {selectedId !== "" ? (
                  <PaperContent
                    paperId={selectedId}
                    contentLookup={contentLookup}
                    authorLookup={authorLookup}
                    trigger={displayPortDim.width}
                  />
                ) : (
                  <Alert
                    message="Select a paper from the visualization to view its details here"
                    type="info"
                    showIcon
                  />
                )}
              </Card>
            </div>
          </Flex>
        )}
    </>
  );

  const ScatterView = (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text style={{ fontWeight: "bold", fontSize: "18px" }}>
          Constellations
        </Text>
        {embedding && contentLookup && fullWindowDim !== null && (
          <div
            style={{
              width: fullWindowDim.width > WRAP_THRESHOLD ? "100%" : "100%",
              height: "40vh",
              maxHeight: "100%",
            }}
          >
            <DimReduction
              data={embedding}
              contentLookup={contentLookup}
              searchId={searchId}
              setClicked={setSearchId}
              trigger={displayPortDim.width}
            />
          </div>
        )}
      </Space>
    </>
  );

  const searchBar = contentLookup && (
    <SearchBar
      data={contentLookup}
      searchId={searchId}
      setSearchId={setSearchId}
    />
  );

  return (
    <div ref={fullWindowRef}>
      <Space direction="vertical" style={CSSPageConfig}>
        {searchBar}
        {ScatterView}
        {CircularView}

        {/* <Tabs items={TabItems} onChange={onChangeView} activeKey={view} />
        {view === "circular" ? (
          CircularView
        ) : view === "scatter" ? (
          ScatterView
        ) : (
          <div>View does not exist</div>
        )} */}
      </Space>
    </div>
  );
};

export default Dashboard;
