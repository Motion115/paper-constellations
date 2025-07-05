import * as d3 from "d3";
import {
  Flex,
  Radio,
  RadioChangeEvent,
  Skeleton,
  Spin,
  Switch,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { EmbeddingSpec, ContentLookupSpec } from "../types";

interface DimReductionProps {
  data: EmbeddingSpec[];
  contentLookup: ContentLookupSpec;
  searchId: string;
  selectedId: string;
  setClicked: (id: string) => void;
  colorScale: d3.ScaleOrdinal<string, string, never>;
  trigger?: any;
}

const { Text, Paragraph } = Typography;

type DimReductionTechnique = "tsne" | "umap";

const DimReduction: React.FC<DimReductionProps> = ({
  data,
  contentLookup,
  searchId,
  selectedId,
  setClicked,
  colorScale,
}) => {
  const [coordinateData] = useState<EmbeddingSpec[]>(data);
  const [projectionTechnique, setProjectionTechnique] =
    useState<DimReductionTechnique>("umap");
  const [displayPortDim, setDisplayPortDim] = useState<{
    width: number;
    height: number;
  }>({ width: 20, height: 20 });
  const PADDING = 5;
  const [RADIUS, setRADIUS] = useState(3);
  const [isAll, setIsAll] = useState(true);

  // Refs for DOM elements
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null); // Ref for the group element for zooming
  const parentRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  // Ref to hold the D3 zoom behavior instance
  const zoomRef = useRef(
    d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.9, 8]) // Set min/max zoom levels
  );

  // Effect for handling responsive SVG size
  useEffect(() => {
    if (!parentRef.current) return;

    const updateSize = () => {
      if (parentRef.current && infoRef.current) {
        const rect = parentRef.current.getBoundingClientRect();
        const infoRect = infoRef.current.getBoundingClientRect();
        setDisplayPortDim({
          width: rect.width,
          height: rect.height - infoRect.height,
        });
        setRADIUS(Math.min(rect.width, rect.height) / 100);
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(parentRef.current);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  // Effect for drawing the D3 scatter plot
  useEffect(() => {
    if (!gRef.current || !coordinateData) return;

    const displayData = coordinateData;
    const g = d3.select(gRef.current);

    // Clear previous elements from the group
    g.selectAll("*").remove();

    // Set up scales
    const xRange = d3.extent(displayData, (d) => d[projectionTechnique][0]) as [
      number,
      number
    ];
    const yRange = d3.extent(displayData, (d) => d[projectionTechnique][1]) as [
      number,
      number
    ];
    const xScale = d3.scaleLinear(xRange, [
      PADDING,
      displayPortDim.width - PADDING,
    ]);
    const yScale = d3.scaleLinear(yRange, [
      displayPortDim.height - PADDING,
      PADDING,
    ]);

    // Create circles with combined hover effects
    g.selectAll("circle")
      .data(displayData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[projectionTechnique][0]))
      .attr("cy", (d) => yScale(d[projectionTechnique][1]))
      .attr("r", (d: any) => {
        return searchId === d.id.toString() || d.id.toString() === selectedId
          ? RADIUS * 2
          : RADIUS;
      })
      .attr("fill", (d) => {
        if (selectedId === d.id.toString())
          console.log("cate:", d.category.toString());
        return searchId === d.id.toString()
          ? "grey"
          : selectedId === d.id.toString() ? "#9c755f" : colorScale(d.category.toString());
      })
      .attr("opacity", (d) => {
        if (isAll === false) {
          return contentLookup[d.id].award !== "" ? 0.8 : 0.1;
        }
        return searchId === d.id.toString() || d.id.toString() === selectedId
          ? 1
          : 0.2;
      })
      .style("cursor", "pointer")
      .on("click", function (event: MouseEvent, d: EmbeddingSpec) {
        setClicked(d.id.toString());
      })
      .on("mouseover", function (event: MouseEvent, d: EmbeddingSpec) {
        d3.select(".tooltip").remove();
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", RADIUS * 2) // Enlarge circle on hover
          .style("opacity", 1);

        const tooltipContent = (
          <Text style={{ fontWeight: "bold", display: "block" }}>
            {contentLookup[d.id].title}
          </Text>
        );

        const tooltipNode = document.createElement("div");
        const root = createRoot(tooltipNode);
        root.render(tooltipContent);

        // Position tooltip based on mouse event's page coordinates
        d3.select("body")
          .append(() => tooltipNode)
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 15}px`)
          .style("background", "rgba(255, 255, 255, 0.9)")
          .style("padding", "8px")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("pointer-events", "none")
          .style("z-index", "10");
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", (d: any) => {
            return searchId === d.id.toString() ? RADIUS * 2 : RADIUS;
          })
          .style("opacity", (d: any) => {
            if (isAll === false) {
              return contentLookup[d.id].award !== "" ? 0.8 : 0.1;
            }
            return searchId === d.id.toString() ? 1 : 0.2;
          });
        d3.select(".tooltip").remove();
      });
  }, [
    coordinateData,
    displayPortDim,
    RADIUS,
    projectionTechnique,
    isAll,
    searchId,
    selectedId,
    contentLookup,
    setClicked,
  ]);

  // Effect for setting up D3 zoom behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Define the zoom event handler
    const zoomHandler = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr("transform", event.transform.toString());
    };

    // Apply the zoom behavior to the SVG element
    const zoomBehavior = zoomRef.current.on("zoom", zoomHandler);
    svg.call(zoomBehavior);

    console.log(zoomRef.current);

    // Cleanup on unmount
    return () => {
      svg.on(".zoom", null);
    };
  }, []); // Empty dependency array ensures this runs only once

  const DimReductionOptions = [
    { value: "tsne" as DimReductionTechnique, label: "TSNE" },
    { value: "umap" as DimReductionTechnique, label: "UMAP" },
  ];

  // Handles change of projection technique and resets zoom
  const onChangeProjectionTechnique = (e: RadioChangeEvent) => {
    const newTechnique = e.target.value as DimReductionTechnique;
    setProjectionTechnique(newTechnique);

    // Reset zoom and pan when the projection changes
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const initialTransform = d3.zoomIdentity;
      // Programmatically call the zoom behavior to reset the transform
      svg.call(zoomRef.current.transform, initialTransform);
    }
  };

  return (
    <>
      {data ? (
        <div
          ref={parentRef}
          style={{ height: "100%", width: "100%", overflow: "hidden" }}
        >
          <div ref={infoRef} style={{ padding: "8px" }}>
            <Flex gap="middle" wrap>
              <Text style={{ fontWeight: "bold" }}>Projection algorithm:</Text>
              <Radio.Group
                onChange={onChangeProjectionTechnique}
                value={projectionTechnique}
                options={DimReductionOptions}
              />
              <Text style={{ fontWeight: "bold" }}>Award Filter:</Text>
              <Switch
                checked={!isAll}
                onChange={() => setIsAll(!isAll)}
                checkedChildren="On"
                unCheckedChildren="Off"
              />
            </Flex>
          </div>
          <svg
            ref={svgRef}
            width={displayPortDim.width}
            height={displayPortDim.height}
            style={{ display: "block" }}
          >
            <g ref={gRef} />
          </svg>
        </div>
      ) : (
        <div>
          <Spin
            tip={
              <>
                <Paragraph>Loading SOM projection...</Paragraph>
                <Paragraph>
                  SOM projection only exists on Papers, Journals, LBW, Student
                  Research Competition, alt.CHI and Case Studies
                </Paragraph>
              </>
            }
          >
            <Skeleton.Node
              active
              style={{
                width: "100%",
                height: "400px",
              }}
            >
              <div />
            </Skeleton.Node>
          </Spin>
        </div>
      )}
    </>
  );
};

export default DimReduction;
