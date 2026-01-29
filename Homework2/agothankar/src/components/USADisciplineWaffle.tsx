import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";
import { ComponentSize, Margin } from "../types";

import {
  loadMedallistsCached,
  disciplineBreakdownForCountry,
  DisciplineCount,
} from "../utils/etl";

const FOCUS_COUNTRY = "United States";

const GRID_COLS = 10;
const GRID_ROWS = 10;
const GRID_TOTAL = GRID_COLS * GRID_ROWS;

type WaffleCell = {
  i: number;
  discipline: string;
  count: number;
  percent: number;
};

export default function USADisciplineWaffle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [data, setData] = useState<DisciplineCount[]>([]);

  const onResize = useDebounceCallback((s: ComponentSize) => setSize(s), 150);
  useResizeObserver({
    ref: containerRef as React.RefObject<HTMLDivElement>,
    onResize,
  });

  useEffect(() => {
    const run = async () => {
      const rows = await loadMedallistsCached();
      const d = disciplineBreakdownForCountry(rows, FOCUS_COUNTRY, 12);
      setData(d);
    };
    run().catch(console.error);
  }, []);

  const prepared = useMemo(() => {
    if (!data.length) return null;

    const sorted = data.slice().sort((a, b) => b.count - a.count);
    const total = d3.sum(sorted, (d) => d.count);

    const raw = sorted.map((d) => ({
      discipline: d.discipline,
      count: d.count,
      exactTiles: (d.count / total) * GRID_TOTAL,
    }));

    const baseTiles = raw.map((r) => Math.floor(r.exactTiles));
    const used = d3.sum(baseTiles);

    const remainders = raw
      .map((r, idx) => ({ idx, rem: r.exactTiles - Math.floor(r.exactTiles) }))
      .sort((a, b) => b.rem - a.rem);

    const tiles = baseTiles.slice();
    for (let k = 0; k < GRID_TOTAL - used; k++) {
      tiles[remainders[k % remainders.length].idx] += 1;
    }

    const cells: WaffleCell[] = [];
    let cursor = 0;
    for (let idx = 0; idx < raw.length; idx++) {
      const t = tiles[idx];
      const r = raw[idx];
      const percent = (r.count / total) * 100;
      for (let j = 0; j < t; j++) {
        cells.push({
          i: cursor++,
          discipline: r.discipline,
          count: r.count,
          percent,
        });
      }
    }

    const cells100 = cells.slice(0, GRID_TOTAL);
    while (cells100.length < GRID_TOTAL && raw.length) {
      const last = raw[raw.length - 1];
      cells100.push({
        i: cells100.length,
        discipline: last.discipline,
        count: last.count,
        percent: (last.count / total) * 100,
      });
    }

    const legend = sorted.map((d) => ({
      discipline: d.discipline,
      count: d.count,
      percent: (d.count / total) * 100,
    }));

    return { total, cells: cells100, legend };
  }, [data]);

  useEffect(() => {
    const svg = d3.select("#usa-waffle");
    svg.selectAll("*").remove();

    if (!prepared || !size.width || !size.height) return;

    const { total, cells, legend } = prepared;

    const width = size.width;
    const height = size.height;

    const MIN_WAFFLE_PX = 300;
    const LEFT = 24;
    const TOP = 18;
    const BOTTOM = 34;
    const GAP_BETWEEN = 16;

    const maxLegend = 440;
    const minLegend = 110;

    const legendWidth = Math.max(
      minLegend,
      Math.min(maxLegend, width - LEFT - MIN_WAFFLE_PX - GAP_BETWEEN),
    );

    const margin: Margin = {
      top: TOP,
      right: Math.max(0, legendWidth),
      bottom: BOTTOM,
      left: LEFT,
    };

    const innerW = Math.max(0, width - margin.left - margin.right);
    const innerH = Math.max(0, height - margin.top - margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const compact = width < 720;
    const tiny = width < 620;

    const font = tiny ? 9 : compact ? 10 : 11;
    const rowH = tiny ? 12 : compact ? 14 : 16;

    const rowsPerCol = 7;
    const colW = tiny ? 150 : compact ? 170 : 210;

    const xCount = tiny ? 105 : compact ? 120 : 135;

    const lw = tiny ? -160 : compact ? -100 : -80;

    const maxChars = tiny ? 10 : compact ? 14 : 999;
    const label = (s: string) =>
      s.length > maxChars ? s.slice(0, maxChars - 1) + "…" : s;

    const gap = 2;
    const cellSize = Math.floor(
      Math.min(
        (innerW - gap * (GRID_COLS - 1)) / GRID_COLS,
        (innerH - gap * (GRID_ROWS - 1)) / GRID_ROWS,
      ),
    );

    const gridH = cellSize * GRID_ROWS + gap * (GRID_ROWS - 1);

    const gridX0 = 0;
    const gridY0 = Math.max(0, Math.floor((innerH - gridH) / 2));

    const disciplines = Array.from(new Set(legend.map((d) => d.discipline)));

    const color = d3
      .scaleOrdinal<string, string>()
      .domain(disciplines)
      .range(d3.schemeTableau10.concat(d3.schemeSet3 as any));

    g.append("g")
      .selectAll("rect")
      .data(cells)
      .join("rect")
      .attr("x", (d) => gridX0 + (d.i % GRID_COLS) * (cellSize + gap))
      .attr("y", (d) => gridY0 + Math.floor(d.i / GRID_COLS) * (cellSize + gap))
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("fill", (d) => color(d.discipline))
      .attr("opacity", 0.95);

    g.append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("font-size", font)
      .attr("font-weight", 650)
      .text(`${FOCUS_COUNTRY}: medals by discipline (waffle = 100 tiles)`);

    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", height - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", font)
      .text("Each tile ≈ 1% of medals (medallists only)");

    const legendG = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + innerW + GAP_BETWEEN}, ${margin.top + 15})`,
      );

    legendG
      .append("text")
      .attr("x", lw)
      .attr("y", 0)
      .attr("font-size", font)
      .attr("font-weight", 650)
      .text("Discipline");

    legendG
      .append("text")
      .attr("x", lw + xCount)
      .attr("y", 0)
      .attr("font-size", font)
      .attr("text-anchor", "end")
      .attr("opacity", 0.8)
      .text("Medals");

    const startY = 18;
    const rowsAll = legend;

    rowsAll.forEach((d, i) => {
      const col = Math.floor(i / rowsPerCol);
      const row = i % rowsPerCol;

      const x0 = col * colW;
      const y0 = startY + row * rowH;

      const gRow = legendG
        .append("g")
        .attr("transform", `translate(${x0}, ${y0})`);

      gRow
        .append("rect")
        .attr("x", lw)
        .attr("y", -(tiny ? 9 : 10))
        .attr("width", tiny ? 9 : 10)
        .attr("height", tiny ? 9 : 10)
        .attr("fill", color(d.discipline));

      gRow
        .append("text")
        .attr("x", lw + 14)
        .attr("y", 0)
        .attr("font-size", font)
        .text(label(d.discipline));

      gRow
        .append("text")
        .attr("x", lw + xCount)
        .attr("y", 0)
        .attr("font-size", font)
        .attr("text-anchor", "end")
        .attr("opacity", 0.9)
        .text(d.count.toString());
    });

    legendG
      .append("text")
      .attr("x", lw)
      .attr("y", startY + rowsPerCol * rowH + 10)
      .attr("font-size", font)
      .attr("opacity", 0.85)
      .text(`Total medals: ${total}`);
  }, [prepared, size]);

  return (
    <div ref={containerRef} className="chart-container">
      <svg id="usa-waffle" width="100%" height="100%" />
    </div>
  );
}
