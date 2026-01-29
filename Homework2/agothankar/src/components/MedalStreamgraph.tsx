import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";
import { ComponentSize, Margin } from "../types";

import {
  loadMedallistsCached,
  topCountriesByTotal,
  buildDailyCounts,
  buildDailyStackMatrix,
} from "../utils/etl";

export default function MedalStreamgraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [rows, setRows] = useState<any[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  const margin: Margin = { top: 34, right: 12, bottom: 42, left: 44 };

  const onResize = useDebounceCallback((s: ComponentSize) => setSize(s), 150);
  useResizeObserver({
    ref: containerRef as React.RefObject<HTMLDivElement>,
    onResize,
  });

  useEffect(() => {
    const run = async () => {
      const med = await loadMedallistsCached();
      const top = topCountriesByTotal(med, 8).map((d) => d.country);
      const { days, dailyByCountry } = buildDailyCounts(med, top);
      const mat = buildDailyStackMatrix(days, dailyByCountry, top);
      setCountries(top);
      setRows(mat);
    };
    run().catch(console.error);
  }, []);

  useEffect(() => {
    const svg = d3.select("#stream");
    svg.selectAll("*").remove();
    if (
      !size.width ||
      !size.height ||
      rows.length === 0 ||
      countries.length === 0
    )
      return;

    const width = size.width;
    const height = size.height;
    const innerW = Math.max(0, width - margin.left - margin.right);
    const innerH = Math.max(0, height - margin.top - margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(rows, (d: any) => d.day) as [Date, Date])
      .range([0, innerW]);

    const stack = d3
      .stack<any>()
      .keys(countries)
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut);

    const layers = stack(rows);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(layers, (layer) => d3.min(layer, (d) => d[0])) ?? 0,
        d3.max(layers, (layer) => d3.max(layer, (d) => d[1])) ?? 0,
      ])
      .range([innerH, 0]);

    const color = d3
      .scaleOrdinal<string, string>()
      .domain(countries)
      .range(d3.schemeTableau10);

    const area = d3
      .area<any>()
      .x((d: any) => x(d.data.day))
      .y0((d: any) => y(d[0]))
      .y1((d: any) => y(d[1]))
      .curve(d3.curveCatmullRom);

    g.selectAll("path.layer")
      .data(layers)
      .join("path")
      .attr("class", "layer")
      .attr("d", area as any)
      .attr("fill", (d: any) => color(d.key))
      .attr("opacity", 0.9);

    const dateFmt = d3.timeFormat("%b %d");

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeDay.every(1))
          .tickFormat(dateFmt as any),
      );

    g.append("g").call(d3.axisLeft(y).ticks(4));

    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", height - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .text("Medal date (binned daily)");

    svg
      .append("text")
      .attr(
        "transform",
        `translate(14, ${margin.top + innerH / 2}) rotate(-90)`,
      )
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .text("Daily medals (stream offset)");

    const lg = g.append("g").attr("transform", `translate(0,-24)`);

    const cols = 4;
    const colW = innerW / cols;
    const rowH = 16;

    countries.forEach((c, i) => {
      const r = Math.floor(i / cols);
      const col = i % cols;

      const item = lg
        .append("g")
        .attr("transform", `translate(${col * colW + 6}, ${r * rowH})`);

      item
        .append("rect")
        .attr("x", 0)
        .attr("y", -8)
        .attr("width", 14)
        .attr("height", 10)
        .attr("fill", color(c));

      item
        .append("text")
        .attr("x", 20)
        .attr("y", 0)
        .attr("font-size", 11)
        .text(c);
    });
  }, [size, rows, countries]);

  return (
    <div ref={containerRef} className="chart-container">
      <svg id="stream" width="100%" height="100%" />
    </div>
  );
}
