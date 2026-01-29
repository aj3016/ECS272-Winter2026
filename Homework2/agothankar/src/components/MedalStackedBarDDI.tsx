import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";
import { ComponentSize, Margin } from "../types";

import {
  loadMedallistsCached,
  computeCountryMedalsDDI,
  CountryMedalsDDI,
  MEDALS,
} from "../utils/etl";

export default function MedalStackedBarDDI() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [data, setData] = useState<CountryMedalsDDI[]>([]);
  const margin: Margin = { top: 10, right: 10, bottom: 70, left: 60 };

  const onResize = useDebounceCallback((s: ComponentSize) => setSize(s), 200);
  useResizeObserver({
    ref: containerRef as React.RefObject<HTMLDivElement>,
    onResize,
  });

  useEffect(() => {
    const run = async () => {
      const rows = await loadMedallistsCached();
      const top = computeCountryMedalsDDI(rows, 12);
      setData(top);
    };
    run().catch(console.error);
  }, []);

  useEffect(() => {
    const svg = d3.select("#bar-ddi-svg");
    svg.selectAll("*").remove();
    if (!size.width || !size.height || data.length === 0) return;

    const width = size.width;
    const height = size.height;
    const innerW = Math.max(0, width - margin.left - margin.right);
    const innerH = Math.max(0, height - margin.top - margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.country))
      .range([0, innerW])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.total) ?? 0])
      .nice()
      .range([innerH, 0]);

    const stacked = d3.stack<CountryMedalsDDI>().keys(MEDALS as any)(
      data as any,
    );

    const color = d3
      .scaleOrdinal<string, string>()
      .domain(MEDALS as any)
      .range(["#D4AF37", "#C0C0C0", "#CD7F32"]);

    g.append("g")
      .selectAll("g")
      .data(stacked)
      .join("g")
      .attr("fill", (d: any) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => x(d.data.country) ?? 0)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth());

    g.append("g").call(d3.axisLeft(y).ticks(6));

    const gx = g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x));

    gx.selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-35)")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em");

    const ddiRowY = innerH + 48;
    g.append("g")
      .selectAll("text.ddi")
      .data(data)
      .join("text")
      .attr("class", "ddi")
      .attr("x", (d) => (x(d.country) ?? 0) + x.bandwidth() / 2)
      .attr("y", ddiRowY)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("opacity", 0.8)
      .text((d) => `DDI ${d.ddi.toFixed(2)}`);

    const legend = g
      .append("g")
      .attr("transform", `translate(${Math.max(0, innerW - 260)}, 0)`);

    legend
      .append("text")
      .attr("x", -30)
      .attr("y", 0)
      .attr("font-size", 11)
      .attr("font-weight", 650)
      .text("Medal type");

    const startX = 0;
    const startY = 10;
    const itemGap = 72;

    (MEDALS as readonly string[]).forEach((m, i) => {
      const item = legend
        .append("g")
        .attr("transform", `translate(${startX + i * itemGap}, ${startY})`);

      item
        .append("rect")
        .attr("x", -100)
        .attr("y", 0)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(m));

      item
        .append("text")
        .attr("x", -82)
        .attr("y", 10)
        .attr("font-size", 11)
        .text(m);
    });
  }, [size, data]);

  return (
    <div ref={containerRef} className="chart-container">
      <svg id="bar-ddi-svg" width="100%" height="100%" />
    </div>
  );
}
