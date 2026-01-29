import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type Props = {
  title: string;
  subtitle?: string;
  caption?: React.ReactNode;
  children: React.ReactNode;
};

export default function PanelCard({
  title,
  subtitle,
  caption,
  children,
}: Props) {
  return (
    <Paper
      elevation={1}
      sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1.25 }}
    >
      <Box sx={{ mb: 0.75 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 650, lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>

      <Box sx={{ mt: 0.75 }}>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>
          {caption}
        </Typography>
      </Box>
    </Paper>
  );
}
