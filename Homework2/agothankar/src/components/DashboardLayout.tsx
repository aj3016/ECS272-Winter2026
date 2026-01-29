import React from "react";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

import PanelCard from "./PanelCard";
import MedalStreamgraph from "./MedalStreamgraph";
import MedalStackedBarDDI from "./MedalStackedBarDDI";
import USADisciplineWaffle from "./USADisciplineWaffle";

export default function DashboardLayoutMomentum() {
  return (
    <Box id="main-container">
      <Stack spacing={1} sx={{ height: "100%" }}>
        <Paper elevation={1} sx={{ p: 1.25, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Paris 2024 Medals Story: All-Rounders vs Specialists, Momentum Over
            Time, and What Powered the USA
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.4 }}>
            This dashboard shows three different angles on Olympic medal
            success: how widely countries win across sports, how medal wins
            shift over time, and what drives the USA’s results.
          </Typography>

          <Box component="ul" sx={{ mt: 0.9, mb: 0, pl: 2.25, opacity: 0.9 }}>
            <li>
              <Typography variant="body2">
                In the first view, the stacked bars show total medals and medal
                type, but the ordering is driven by DDI. This helps compare
                medal composition while also contrasting countries based on how
                broadly they won across different disciplines.
              </Typography>
            </li>

            <li>
              <Typography variant="body2">
                In the second view, the streamgraph shows day by day momentum
                for the top countries. It highlights how medal volume rises and
                falls across the Games and makes shifts in momentum easier to
                see over time.
              </Typography>
            </li>

            <li>
              <Typography variant="body2">
                In the final view, the waffle chart explains the USA’s medal mix
                by discipline. It shows which disciplines contributed the most
                medals and groups smaller disciplines into “Other” to keep the
                view easy to read.
              </Typography>
            </li>
          </Box>
        </Paper>

        <Grid container spacing={1} sx={{ height: "50%" }}>
          <Grid size={12}>
            <PanelCard
              title="Medal Outcomes Ranked by Discipline Diversity (DDI)"
              subtitle="Stacked medals by country (Gold/Silver/Bronze) which are sorted by DDI to compare specialists vs all-rounders"
              caption={
                <>
                  DDI (Discipline Diversity Index) is computed as:
                  <span style={{ whiteSpace: "nowrap" }}> </span>
                  <b>Disciplines with 1 or more medals ÷ Total Medals.</b>
                  &thinsp; Higher DDI means medals are spread across more
                  disciplines relative to the medal count (broader success);
                  lower DDI suggests medals are concentrated in fewer
                  disciplines (more specialized).
                </>
              }
            >
              <MedalStackedBarDDI />
            </PanelCard>
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{ height: "50%" }}>
          <Grid size={7}>
            <PanelCard
              title="Medal waves over time: daily surges by country"
              subtitle="Streamgraph of medals per day for the top countries which highlights shifting dominance across the Games"
              caption={
                <>
                  Each band is a country’s medals per day. Thicker bands mean
                  more medals. The wiggle baseline can dip below zero, so
                  compare thickness, not height.
                </>
              }
            >
              <MedalStreamgraph />
            </PanelCard>
          </Grid>

          <Grid size={5}>
            <PanelCard
              title="USA medal drivers: discipline mix"
              subtitle="Waffle chart where each tile represents about 1% of USA medals"
              caption={
                <>
                  Colors show which disciplines contributed medals. The waffle
                  makes the overall mix easy to compare.
                </>
              }
            >
              <USADisciplineWaffle />
            </PanelCard>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
